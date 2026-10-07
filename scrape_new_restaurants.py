"""
scrape_new_restaurants.py

Monthly job: finds NYC restaurants not already in data/restaurants.csv and
scrapes only those, so Apify credits are never spent re-fetching details/
reviews for a restaurant already on file.

Two-pass, to control cost:
  1. discover_place_ids() — cheap search-only pass (no detail page, no
     reviews) across a bounded, monthly rotating subset of SEARCH_TERMS.
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
    SEARCH_TERMS,
    discover_place_ids,
    scrape_by_place_ids,
    build_restaurants_df,
    build_reviews_df,
    save,
)

load_dotenv()

# Request caps, not a guarantee of a dollar spend. See SCRAPER_BUDGET.md.
MAX_NEW_PLACES_PER_RUN = 5


def read_limit(name: str, default: int) -> int:
    raw = os.getenv(name, str(default))
    try:
        value = int(raw)
    except ValueError:
        raise ValueError(f"{name} must be a non-negative integer") from None
    if value < 0:
        raise ValueError(f"{name} must be a non-negative integer")
    return value


def known_place_ids() -> set[str]:
    path = "data/restaurants.csv"
    if not os.path.exists(path):
        return set()
    return set(pd.read_csv(path)["google_place_id"].dropna())


def main():
    # Validate every limit before constructing the client or spending credits.
    max_new = read_limit("MAX_NEW_PLACES_PER_RUN", MAX_NEW_PLACES_PER_RUN)
    max_results = read_limit("MAX_DISCOVERY_RESULTS_PER_RUN", 30)
    max_terms = read_limit("MAX_DISCOVERY_SEARCH_TERMS", 3)
    per_search = read_limit("MAX_DISCOVERY_PLACES_PER_SEARCH", 10)
    max_reviews = read_limit("MAX_REVIEWS_PER_NEW_PLACE", 10)
    if not all((max_new, max_results, max_terms, per_search)):
        print("Scraping disabled by a zero request limit.")
        return
    known = known_place_ids()
    # Rotate bounded subsets monthly rather than always searching the first terms.
    from datetime import datetime, timezone
    now = datetime.now(timezone.utc)
    offset = ((now.year * 12 + now.month - 1) * max_terms) % len(SEARCH_TERMS)
    terms = [SEARCH_TERMS[(offset + i) % len(SEARCH_TERMS)]
             for i in range(min(max_terms, len(SEARCH_TERMS)))]
    print(f"Request limits: discovery <= {min(len(terms), max_results // min(per_search, max_results)) * min(per_search, max_results)} "
          f"results; details <= {max_new}; reviews/place <= {max_reviews}")
    token = os.getenv("APIFY_API_TOKEN")
    if not token:
        print("❌ Missing APIFY_API_TOKEN in .env file!")
        return

    client = ApifyClient(token)

    discovered = discover_place_ids(client, per_search, max_results=max_results, search_terms=terms)
    new_ids = sorted(discovered - known)
    print(f"Discovered {len(discovered)} places, {len(new_ids)} are new")

    if not new_ids:
        print("Nothing new this run.")
        return

    if len(new_ids) > max_new:
        print(
            f"Capping this run to {max_new} of {len(new_ids)} new places "
            f"(request cap) -- remaining places may be rediscovered in a future run."
        )
        new_ids = new_ids[:max_new]

    items = scrape_by_place_ids(client, new_ids, max_reviews=max_reviews)
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

