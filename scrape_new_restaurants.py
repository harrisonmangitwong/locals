"""
scrape_new_restaurants.py

Monthly job: finds NYC restaurants not already in data/restaurants.csv and
scrapes only those, so Apify credits are never spent re-fetching details/
reviews for a restaurant already on file.

Two-pass, to control cost:
  1. discover_place_ids() — cheap search-only pass (no detail page, no
     reviews) across the existing SEARCH_TERMS, all five boroughs.
  2. Compare against data/restaurants.csv's google_place_id column; only
     genuinely new places move on to the expensive pass.
  3. scrape_by_place_ids() — full detail + review scrape, targeted at
     exactly those new places (capped at MAX_NEW_PLACES_PER_RUN).

Data-only: appends to data/restaurants.csv, data/reviews.csv, and
data/raw_apify_data.json via the existing save(). Does NOT run
run_pipeline.py or update_backend.py, and does NOT touch backend/data.csv —
bringing new restaurants live on the site is a separate, manual step.

Usage:
    python scrape_new_restaurants.py

Required env var (.env):
    APIFY_API_TOKEN
"""
import os

import pandas as pd
from apify_client import ApifyClient
from dotenv import load_dotenv

from scrape_google_maps import (
    discover_place_ids,
    scrape_by_place_ids,
    build_restaurants_df,
    build_reviews_df,
    save,
)

load_dotenv()

# Hard budget cap. The user's Apify plan is $5/month, and Apify doesn't
# publish exact per-place detail/review pricing, so this stays conservative
# until a real run's dashboard cost is known. Raise only with real numbers,
# not a bigger guess.
MAX_NEW_PLACES_PER_RUN = 15


def known_place_ids() -> set[str]:
    path = "data/restaurants.csv"
    if not os.path.exists(path):
        return set()
    return set(pd.read_csv(path)["google_place_id"].dropna())


def main():
    token = os.getenv("APIFY_API_TOKEN")
    if not token:
        print("❌ Missing APIFY_API_TOKEN in .env file!")
        return

    client = ApifyClient(token)

    discovered = discover_place_ids(client)
    new_ids = list(discovered - known_place_ids())
    print(f"Discovered {len(discovered)} places, {len(new_ids)} are new")

    if not new_ids:
        print("Nothing new this run.")
        return

    if len(new_ids) > MAX_NEW_PLACES_PER_RUN:
        print(
            f"Capping this run to {MAX_NEW_PLACES_PER_RUN} of {len(new_ids)} new places "
            f"(budget cap) -- the rest will be picked up in a future run."
        )
        new_ids = new_ids[:MAX_NEW_PLACES_PER_RUN]

    items = scrape_by_place_ids(client, new_ids)
    if not items:
        print("⚠️  No results returned for the new place IDs.")
        return

    restaurants_df = build_restaurants_df(items)
    reviews_df = build_reviews_df(items)
    save(restaurants_df, reviews_df, items)

    print(f"\n🎉 Done! Added {len(items)} new restaurant(s) to the data files.")
    print("   Not yet live on the site -- run run_pipeline.py + update_backend.py when ready to deploy.")


if __name__ == "__main__":
    main()
