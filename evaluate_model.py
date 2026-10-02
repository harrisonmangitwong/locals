"""
evaluate_model.py

Checks whether the model's p_safe_pick actually lines up with what real
users think, by joining the live `ratings` table (liked / ok / disliked,
from people who actually went) against backend/data.csv's model scores.

This is the one piece of model validation this project doesn't otherwise
have: train_random_forest_model() in pipeline.py only checks the model
against the 206 hand-labels it was trained on. This checks it against
actual outcomes instead.

Run: python3 evaluate_model.py
"""

import json
import os
import urllib.error
import urllib.request

import pandas as pd
from dotenv import load_dotenv

load_dotenv()

SUPABASE_URL = os.environ["SUPABASE_URL"]
SUPABASE_SERVICE_KEY = os.environ["SUPABASE_SERVICE_ROLE_KEY"]
DATA_CSV = "backend/data.csv"

BUCKET_ORDER = ["liked", "ok", "disliked"]
SCORE_COLS = ["p_safe_pick", "local_weighted_rating", "tourist_weighted_rating", "adjusted_score"]


def fetch_ratings() -> list[dict]:
    req = urllib.request.Request(
        f"{SUPABASE_URL}/rest/v1/ratings?select=restaurant_id,bucket,score",
        headers={
            "Authorization": f"Bearer {SUPABASE_SERVICE_KEY}",
            "apikey": SUPABASE_SERVICE_KEY,
        },
    )
    try:
        with urllib.request.urlopen(req) as resp:
            return json.loads(resp.read())
    except urllib.error.HTTPError as e:
        print(f"Failed to fetch ratings: {e.code} {e.read().decode()[:200]}")
        raise SystemExit(1)


def main():
    ratings = fetch_ratings()
    if not ratings:
        print("No ratings yet -- nothing to evaluate.")
        return

    ratings_df = pd.DataFrame(ratings)
    data = pd.read_csv(DATA_CSV)

    merged = ratings_df.merge(
        data[["restaurant_id", "name"] + SCORE_COLS],
        on="restaurant_id",
        how="left",
    )

    unmatched = merged[merged["name"].isna()]
    matched = merged.dropna(subset=["name"])

    print(f"Total ratings: {len(ratings_df)}")
    if len(unmatched) > 0:
        print(f"  {len(unmatched)} rating(s) reference a restaurant not in the live dataset -- excluded:")
        for rid in unmatched["restaurant_id"]:
            print(f"    {rid}")
    print(f"Ratings matched to a live restaurant: {len(matched)}\n")

    if len(matched) == 0:
        print("Nothing left to evaluate after matching.")
        return

    if len(matched) < 10:
        print(f"⚠️  Only {len(matched)} matched rating(s) -- read this as directional, not statistically meaningful.\n")

    print("Average model scores by what users actually thought:\n")
    for bucket in BUCKET_ORDER:
        if bucket not in matched["bucket"].values:
            continue
        row = matched[matched["bucket"] == bucket]
        print(f"  {bucket:10s} (n={len(row)})")
        for col in SCORE_COLS:
            print(f"      {col:24s} avg {row[col].mean():.3f}")
        print()

    liked_psp = matched.loc[matched["bucket"] == "liked", "p_safe_pick"].mean()
    disliked_psp = matched.loc[matched["bucket"] == "disliked", "p_safe_pick"].mean()
    if pd.notna(liked_psp) and pd.notna(disliked_psp):
        direction = "higher" if liked_psp > disliked_psp else "lower or equal"
        print(f"p_safe_pick for 'liked' restaurants is {direction} than for 'disliked' ones "
              f"({liked_psp:.3f} vs {disliked_psp:.3f}).")
        if liked_psp <= disliked_psp:
            print("That's the wrong direction -- worth digging into which specific restaurants drove this before trusting it.")

    print("\nPer-restaurant detail:")
    print(
        matched[["name", "bucket"] + SCORE_COLS]
        .sort_values(["bucket", "p_safe_pick"], ascending=[True, False])
        .to_string(index=False)
    )


if __name__ == "__main__":
    main()
