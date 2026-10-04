#!/usr/bin/env python3
"""
Enriches data.csv with structured review themes extracted via Claude API.
Adds a `review_themes` column with JSON: {loved, criticisms, regulars}

Review selection is weighted toward local reviewers (Google Local Guides,
reviewers with a longer history) rather than just the most-liked reviews --
pulled fresh from data/raw_apify_data.json, not the already-trimmed
top_reviews column (which is sorted by likes, not localness).

Usage: python enrich_reviews.py
Requires ANTHROPIC_API_KEY (in the environment or the repo-root .env).
Resumes automatically from checkpoint if interrupted.
"""

import csv
import json
import sys
import time
from pathlib import Path
from pydantic import BaseModel
from dotenv import load_dotenv
import anthropic

load_dotenv(Path(__file__).parent.parent / ".env")

DATA_CSV = Path(__file__).parent / "data.csv"
RAW_APIFY_JSON = Path(__file__).parent.parent / "data" / "raw_apify_data.json"
OUT_CSV = Path(__file__).parent / "data_enriched.csv"
CHECKPOINT = Path(__file__).parent / "enrich_checkpoint.json"

MAX_REVIEWS_PER_RESTAURANT = 15


class ReviewThemes(BaseModel):
    standout_dishes: list[str]       # 2-4 specific dishes/drinks people consistently praise -- food only
    vibe_and_service: list[str]      # 1-3 non-food reasons it's worth going (atmosphere, service, value, specific touches) -- never a dish
    wait_time_note: str | None       # one practical sentence on wait times/reservations, only if reviews actually say enough to know; null otherwise


def load_checkpoint() -> dict[str, str]:
    if CHECKPOINT.exists():
        return json.loads(CHECKPOINT.read_text())
    return {}


def save_checkpoint(done: dict[str, str]):
    CHECKPOINT.write_text(json.dumps(done))


def load_apify_map() -> dict[str, dict]:
    with open(RAW_APIFY_JSON) as f:
        apify_list = json.load(f)
    apify_map: dict[str, dict] = {}
    for rec in apify_list:
        pid = rec.get("placeId") or rec.get("inputPlaceId")
        if pid:
            apify_map[pid] = rec
    return apify_map


def select_local_reviews(apify_record: dict, max_reviews: int = MAX_REVIEWS_PER_RESTAURANT) -> list[dict]:
    """Prioritizes Local Guides and reviewers with a longer review history
    over whatever Google/Apify happened to surface as 'top' -- the point of
    this feature is to summarize what locals say, not what's most-liked."""
    candidates = [r for r in apify_record.get("reviews", []) if (r.get("text") or "").strip()]
    candidates.sort(
        key=lambda r: (bool(r.get("isLocalGuide")), r.get("reviewerNumberOfReviews") or 0),
        reverse=True,
    )
    return candidates[:max_reviews]


def extract_themes(client: anthropic.Anthropic, name: str, cuisine: str, reviews: list[dict]) -> ReviewThemes | None:
    review_text = "\n".join(
        f"- ({r.get('stars') or r.get('rating') or '?'}★) {r['text']}"
        for r in reviews
        if (r.get("text") or "").strip()
    )
    if not review_text.strip():
        return None

    prompt = f"""Restaurant: {name} ({cuisine})

Reviews from local reviewers:
{review_text}

Extract structured themes from these reviews. Be specific and concrete -- name actual dishes when mentioned, quote real patterns you see across multiple reviews. Never invent a dish, claim, or detail that isn't actually in the text above. This is about what's GOOD here and what's practically useful to know -- not a review of what's bad.

- standout_dishes: 2-4 specific dishes or drinks multiple reviews praise by name, 3-8 words each. Food and drink only -- nothing about service or atmosphere here. Empty list if no specific dish comes up more than once.
- vibe_and_service: 1-3 non-food reasons people say it's worth going -- atmosphere, service, a specific staff mention, value, a detail like "great for groups" or "good for a date." Never a dish. Empty list if reviews don't really talk about this.
- wait_time_note: ONE practical, plain-language sentence about wait times or reservations, only if multiple reviews actually give you enough to say something concrete (e.g. "Walk-ins get seated fast on weekdays, but expect a wait on weekend nights without a reservation."). Use null if reviews don't say enough to know this reliably -- do not guess or generalize from one review.

Write in plain, conversational language, like a friend telling you why a place is worth it -- not marketing copy. Do not use the words "locals," "regulars," or "tourists" anywhere in your answer.
"""

    response = client.messages.parse(
        model="claude-sonnet-5-5",
        max_tokens=700,
        # This model "thinks" by default even for plain non-tool-use calls,
        # which otherwise burns the whole max_tokens budget on invisible
        # reasoning and leaves no room for the actual structured output.
        # "between_tools" is this model's actual way to turn that off (its
        # own 400 error names this exact value -- "disabled" doesn't exist
        # here, unlike older Claude models).
        thinking={"type": "between_tools"},
        messages=[{"role": "user", "content": prompt}],
        output_format=ReviewThemes,
    )
    return response.parsed_output


def main():
    client = anthropic.Anthropic()
    apify_map = load_apify_map()

    # Load existing data
    with open(DATA_CSV, newline="", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        fieldnames = reader.fieldnames
        rows = list(reader)

    if "review_themes" not in fieldnames:
        fieldnames = list(fieldnames) + ["review_themes"]

    done = load_checkpoint()
    to_process = [r for r in rows if r["restaurant_id"] not in done and r.get("google_place_id") in apify_map]
    total = len(rows)
    already_done = len(done)

    print(f"Total: {total} restaurants | Already done: {already_done} | Remaining: {len(to_process)}")

    for i, row in enumerate(to_process, start=already_done + 1):
        rid = row["restaurant_id"]
        name = row["name"]

        reviews = select_local_reviews(apify_map[row["google_place_id"]])
        if not reviews:
            done[rid] = ""
            continue

        print(f"[{i}/{total}] {name}...", end=" ", flush=True)

        try:
            themes = extract_themes(client, name, row.get("cuisine", ""), reviews)
            done[rid] = json.dumps(themes.model_dump()) if themes else ""
            print("✓")
        except anthropic.AuthenticationError as e:
            # Fatal and identical for every remaining restaurant -- stop
            # immediately instead of burning through the whole list marking
            # everything "done" with no real data (and poisoning the
            # checkpoint so a later retry would silently skip them all).
            print(f"\nAuthentication failed: {e}")
            print("Fix ANTHROPIC_API_KEY and re-run -- nothing from this run was checkpointed or billed.")
            sys.exit(1)
        except anthropic.RateLimitError:
            print("rate limited — waiting 60s")
            time.sleep(60)
            try:
                themes = extract_themes(client, name, row.get("cuisine", ""), reviews)
                done[rid] = json.dumps(themes.model_dump()) if themes else ""
                print("✓ (retry)")
            except anthropic.AuthenticationError as e:
                print(f"\nAuthentication failed: {e}")
                print("Fix ANTHROPIC_API_KEY and re-run -- nothing from this run was checkpointed or billed.")
                sys.exit(1)
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
