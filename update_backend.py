"""
update_backend.py

Copies the pipeline output into backend/data.csv and enriches it
with phone, hours, and reviews from the raw Apify data.

Work that took real effort to produce is carried over from the current
backend/data.csv for every restaurant that stays on the list:
  - image_url, when it's a permanent copy in Supabase Storage (the scraped
    Google photo links expire, and the site would fall back to stock photos)
  - review_themes (the "what to order" / vibe summaries from Claude)
New restaurants still need host_images.py (photos) and
backend/enrich_reviews.py (summaries); the script lists them at the end.

Places listed in data/closed_restaurants.csv are dropped, so a re-run
can't bring back a restaurant that has closed. Their labels stay in
data/labels.csv for training.

The new catalog is validated before it's kept (required columns filled,
unique ids, scores in range, coordinates in NYC, no big drop in size).
If any step fails, backend/data.csv is restored byte for byte, so a bad
scrape or training run can't replace the catalog users see.

Run after run_pipeline.py:
    python update_backend.py
    python update_backend.py --allow-shrink   # catalog intentionally got >10% smaller
"""

import os
import shutil
import subprocess
import sys
import tempfile

import pandas as pd

SRC = "outputs/locals_recommendations.csv"
DST = "backend/data.csv"
CLOSED = "data/closed_restaurants.csv"

REQUIRED = ["restaurant_id", "name", "neighborhood", "cuisine", "lat", "lng", "p_safe_pick", "image_url"]
MIN_ROWS = 50
MAX_SHRINK = 0.10  # fail if the catalog loses more than 10% of its places
NYC_LAT = (40.45, 40.95)
NYC_LNG = (-74.30, -73.65)


class InvalidCatalog(Exception):
    pass


def validate(df: pd.DataFrame, previous_rows: int | None, allow_shrink: bool) -> None:
    problems = []
    missing = [c for c in REQUIRED if c not in df.columns]
    if missing:
        raise InvalidCatalog(f"missing columns: {missing}")
    for c in REQUIRED:
        n = int(df[c].isna().sum())
        if n:
            problems.append(f"{n} row(s) with no {c}")
    dupes = int(df["restaurant_id"].duplicated().sum())
    if dupes:
        problems.append(f"{dupes} duplicate restaurant_id(s)")
    p = pd.to_numeric(df["p_safe_pick"], errors="coerce")
    if not p.between(0, 1).all():
        problems.append("p_safe_pick outside 0–1")
    if not (df["lat"].between(*NYC_LAT).all() and df["lng"].between(*NYC_LNG).all()):
        problems.append("coordinates outside NYC")
    if len(df) < MIN_ROWS:
        problems.append(f"only {len(df)} rows (minimum {MIN_ROWS})")
    if previous_rows and not allow_shrink and len(df) < previous_rows * (1 - MAX_SHRINK):
        problems.append(
            f"catalog shrank from {previous_rows} to {len(df)} places; "
            "rerun with --allow-shrink if that's intended"
        )
    if problems:
        raise InvalidCatalog("; ".join(problems))


def build(previous: pd.DataFrame | None) -> pd.DataFrame:
    pd.read_csv(SRC).to_csv(DST, index=False)
    print(f"✅ Copied {SRC} → {DST}")

    print("\nRunning enrich_data.py...")
    if subprocess.run([sys.executable, "enrich_data.py"], check=False).returncode != 0:
        raise InvalidCatalog("enrich_data.py failed")

    df = pd.read_csv(DST)
    if previous is not None:
        prev = previous.set_index("restaurant_id")
        hosted = prev["image_url"].where(prev["image_url"].astype(str).str.contains("supabase.co/storage"))
        df["image_url"] = df["restaurant_id"].map(hosted).fillna(df["image_url"])
        if "review_themes" in prev.columns:
            df["review_themes"] = df["restaurant_id"].map(prev["review_themes"])
        needs_photo = int((~df["image_url"].astype(str).str.contains("supabase.co/storage")).sum())
        needs_themes = int(df["review_themes"].isna().sum()) if "review_themes" in df.columns else len(df)
        print("\nCarried over hosted photos and summaries for restaurants that stayed.")
        print(f"  still need a hosted photo: {needs_photo} → run python host_images.py")
        print(f"  still need summaries:      {needs_themes} → run python backend/enrich_reviews.py")

    if os.path.exists(CLOSED):
        closed = set(pd.read_csv(CLOSED)["restaurant_id"])
        dropped = df["restaurant_id"].isin(closed)
        df = df[~dropped]
        print(f"\nDropped {int(dropped.sum())} closed restaurant(s) listed in {CLOSED}")

    return df


def main() -> None:
    allow_shrink = "--allow-shrink" in sys.argv[1:]
    if not os.path.exists(SRC):
        print(f"❌ {SRC} not found — run python run_pipeline.py first")
        sys.exit(1)

    previous = pd.read_csv(DST) if os.path.exists(DST) else None
    backup = None
    if previous is not None:
        backup = os.path.join(tempfile.mkdtemp(), "data.csv")
        shutil.copy2(DST, backup)

    try:
        df = build(previous)
        validate(df, len(previous) if previous is not None else None, allow_shrink)
        df.to_csv(DST, index=False)
    except Exception as e:
        if backup:
            shutil.copy2(backup, DST)
            print(f"\n❌ {e}\n   Restored the previous {DST}; nothing changed.")
        else:
            print(f"\n❌ {e}")
        sys.exit(1)

    print(f"\n✅ Done: {len(df)} places passed validation. Commit and push {DST} to deploy.")


if __name__ == "__main__":
    main()
