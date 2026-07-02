#!/usr/bin/env python3
"""
Enriches data.csv with structured review themes extracted via Claude API.
Adds a `review_themes` column with JSON: {loved, criticisms, regulars}

Usage: python enrich_reviews.py
Resumes automatically from checkpoint if interrupted.
"""

import csv
import json
import os
import time
from pathlib import Path
from pydantic import BaseModel
import anthropic

DATA_CSV = Path(__file__).parent / "data.csv"
OUT_CSV = Path(__file__).parent / "data_enriched.csv"
CHECKPOINT = Path(__file__).parent / "enrich_checkpoint.json"


class ReviewThemes(BaseModel):
    loved: list[str]        # 2-4 commonly loved dishes or aspects
    criticisms: list[str]   # 1-3 recurring criticisms (empty list if none)
    regulars: str           # one sentence: what keeps regulars coming back


def load_checkpoint() -> dict[str, str]:
    if CHECKPOINT.exists():
        return json.loads(CHECKPOINT.read_text())
    return {}


def save_checkpoint(done: dict[str, str]):
    CHECKPOINT.write_text(json.dumps(done))


def extract_themes(client: anthropic.Anthropic, name: str, cuisine: str, reviews: list[dict]) -> ReviewThemes | None:
    review_text = "\n".join(
        f"- ({r['rating']}★) {r['text']}"
        for r in reviews
        if r.get("text", "").strip()
    )
    if not review_text.strip():
        return None

    prompt = f"""Restaurant: {name} ({cuisine})

Reviews:
{review_text}

Extract structured themes from these reviews. Be specific and concrete — name actual dishes when mentioned, quote real patterns. Keep each item brief (3–8 words).
"""

    response = client.messages.parse(
        model="claude-opus-4-8",
        max_tokens=512,
        messages=[{"role": "user", "content": prompt}],
        output_format=ReviewThemes,
    )
    return response.parsed_output


def main():
    client = anthropic.Anthropic()

    # Load existing data
    with open(DATA_CSV, newline="", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        fieldnames = reader.fieldnames
        rows = list(reader)

    if "review_themes" not in fieldnames:
        fieldnames = list(fieldnames) + ["review_themes"]

    done = load_checkpoint()
    to_process = [r for r in rows if r["restaurant_id"] not in done and r.get("top_reviews")]
    total = len(rows)
    already_done = len(done)

    print(f"Total: {total} restaurants | Already done: {already_done} | Remaining: {len(to_process)}")

    for i, row in enumerate(to_process, start=already_done + 1):
        rid = row["restaurant_id"]
        name = row["name"]

        try:
            reviews = json.loads(row["top_reviews"])
        except (json.JSONDecodeError, KeyError):
            done[rid] = ""
            continue

        print(f"[{i}/{total}] {name}...", end=" ", flush=True)

        try:
            themes = extract_themes(client, name, row.get("cuisine", ""), reviews)
            done[rid] = json.dumps(themes.model_dump()) if themes else ""
            print("✓")
        except anthropic.RateLimitError:
            print("rate limited — waiting 60s")
            time.sleep(60)
            try:
                themes = extract_themes(client, name, row.get("cuisine", ""), reviews)
                done[rid] = json.dumps(themes.model_dump()) if themes else ""
                print("✓ (retry)")
            except Exception as e:
                print(f"failed: {e}")
                done[rid] = ""
        except Exception as e:
            print(f"error: {e}")
            done[rid] = ""

        save_checkpoint(done)

        # Gentle rate limiting
        if i % 10 == 0:
            time.sleep(1)

    # Write output CSV
    with open(OUT_CSV, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        for row in rows:
            row["review_themes"] = done.get(row["restaurant_id"], "")
            writer.writerow(row)

    # Also update data.csv in place
    import shutil
    shutil.copy(OUT_CSV, DATA_CSV)
    print(f"\nDone! Updated {DATA_CSV}")
    CHECKPOINT.unlink(missing_ok=True)


if __name__ == "__main__":
    main()
