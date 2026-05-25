"""
scrape_google_maps.py

Fetches restaurant data + reviews from Google Maps via Apify,
then writes data/restaurants.csv and data/reviews.csv in the format
that run_pipeline.py expects.

Usage:
    1. Create a .env file with:  APIFY_API_TOKEN=apify_api_XXXXX
    2. Run:  python scrape_google_maps.py

This will:
    - Call the Apify Google Maps Scraper actor
    - Wait for results
    - Transform output into your pipeline's CSV format
    - Save to data/restaurants.csv and data/reviews.csv
"""

import os
import json
import hashlib
from datetime import datetime

import pandas as pd
from apify_client import ApifyClient
from dotenv import load_dotenv

load_dotenv()

# ---------------------------------------------------------------------------
# CONFIG — tweak these to control what gets scraped
# ---------------------------------------------------------------------------
SEARCH_TERMS = [
    # General
    "best restaurant",
    "local restaurant",
    # Cuisine-specific — broad
    "pizza",
    "tacos",
    "noodles",
    "dumplings",
    "falafel",
    "ramen",
    "deli",
    "bakery",
    "sushi",
    "korean food",
    "thai food",
    "caribbean food",
    # Cuisine-specific — expansion
    "Ethiopian restaurant New York",
    "Colombian restaurant New York",
    "Dominican restaurant New York",
    "Filipino restaurant New York",
    "Peruvian restaurant New York",
    "Vietnamese restaurant New York",
    "dim sum New York",
    "soul food New York",
    "Turkish restaurant New York",
    "Bangladeshi restaurant New York",
    "West African restaurant New York",
    "Tibetan restaurant New York",
    "Salvadoran restaurant New York",
    "Uzbek restaurant New York",
    "Georgian restaurant New York",
    # Brooklyn neighborhoods
    "restaurant Williamsburg Brooklyn",
    "restaurant Bushwick Brooklyn",
    "restaurant Park Slope Brooklyn",
    "restaurant Bed-Stuy Brooklyn",
    "restaurant Crown Heights Brooklyn",
    "restaurant Greenpoint Brooklyn",
    "restaurant Sunset Park Brooklyn",
    "restaurant Bay Ridge Brooklyn",
    "restaurant Brighton Beach Brooklyn",
    "restaurant Bensonhurst Brooklyn",
    "restaurant Flatbush Brooklyn",
    "restaurant Canarsie Brooklyn",
    "restaurant Red Hook Brooklyn",
    # Manhattan neighborhoods
    "restaurant Lower East Side Manhattan",
    "restaurant East Village Manhattan",
    "restaurant West Village Manhattan",
    "restaurant Chinatown Manhattan",
    "restaurant Harlem Manhattan",
    "restaurant East Harlem Manhattan",
    "restaurant Inwood Manhattan",
    "restaurant Washington Heights Manhattan",
    "restaurant Hell's Kitchen Manhattan",
    "restaurant Nolita Manhattan",
    # Queens neighborhoods
    "restaurant Jackson Heights Queens",
    "restaurant Flushing Queens",
    "restaurant Astoria Queens",
    "restaurant Forest Hills Queens",
    "restaurant Ridgewood Queens",
    "restaurant Woodside Queens",
    "restaurant Elmhurst Queens",
    "restaurant Jamaica Queens",
    "restaurant Bayside Queens",
    # Bronx neighborhoods
    "restaurant Fordham Bronx",
    "restaurant Arthur Avenue Bronx",
    "restaurant Mott Haven Bronx",
    "restaurant Kingsbridge Bronx",
    "restaurant Pelham Parkway Bronx",
    # Staten Island
    "restaurant Staten Island",
    "restaurant St George Staten Island",
]

LOCATION = "New York City, USA"
MAX_PLACES_PER_SEARCH = 40      # results per search term
MAX_REVIEWS_PER_PLACE = 50      # reviews to pull per restaurant
OUTPUT_DIR = "data"
USE_LAST_RUN = False  # Set to True to re-use the last Apify run without spending credits

# ---------------------------------------------------------------------------
# STEP 1 — Run the Apify actor (or fetch the last run's data)
# ---------------------------------------------------------------------------

def run_scraper(token: str, use_last_run: bool = False) -> list[dict]:
    """
    Either triggers a new Apify run or fetches the last successful run's data.
    Returns a list of place dicts.
    """
    client = ApifyClient(token)

    if use_last_run:
        print("📦 Fetching data from the last successful run...")
        runs = client.actor("compass/crawler-google-places").runs()
        last_run = runs.list(limit=1, status="SUCCEEDED").items
        if not last_run:
            raise RuntimeError("No successful runs found. Set use_last_run=False to start a new one.")
        dataset_id = last_run[0]["defaultDatasetId"]
        items = list(client.dataset(dataset_id).iterate_items())
        print(f"   Got {len(items)} places from dataset {dataset_id}")
        return items

    # --- Start a new run ---
    actor_input = {
        "searchStringsArray": SEARCH_TERMS,
        "locationQuery": LOCATION,
        "maxCrawledPlacesPerSearch": MAX_PLACES_PER_SEARCH,
        "language": "en",
        "searchMatching": "all",
        "skipClosedPlaces": True,

        # IMPORTANT: these must be True / > 0 for your pipeline
        "scrapePlaceDetailPage": True,
        "maxReviews": MAX_REVIEWS_PER_PLACE,
        "reviewsSort": "newest",
        "scrapeReviewsPersonalData": True,

        # stuff we don't need
        "maxImages": 1,
        "maxQuestions": 0,
        "scrapeContacts": False,
        "scrapeDirectories": False,
        "includeWebResults": False,
        "scrapeTableReservationProvider": False,
    }

    print(f"🚀 Starting Apify Google Maps Scraper...")
    print(f"   Search terms: {SEARCH_TERMS}")
    print(f"   Location: {LOCATION}")
    print(f"   Max places per search: {MAX_PLACES_PER_SEARCH}")
    print(f"   Max reviews per place: {MAX_REVIEWS_PER_PLACE}")
    print(f"   This may take several minutes...\n")

    run = client.actor("compass/crawler-google-places").call(run_input=actor_input)
    dataset_id = run["defaultDatasetId"]

    print(f"✅ Run finished! Dataset ID: {dataset_id}")
    items = list(client.dataset(dataset_id).iterate_items())
    print(f"   Got {len(items)} places\n")
    return items


# ---------------------------------------------------------------------------
# STEP 2 — Transform Apify output → restaurants.csv
# ---------------------------------------------------------------------------

def make_restaurant_id(place_id: str) -> str:
    """Shorten Google's placeId into a compact ID like 'r001'."""
    # We'll use a hash so the same place always gets the same ID
    h = hashlib.md5(place_id.encode()).hexdigest()[:6]
    return f"r_{h}"


def guess_cuisine(item: dict) -> str:
    """
    Best-effort cuisine label from Google's categoryName + categories list.
    Falls back to 'Restaurant' if nothing specific is found.
    """
    cats = [c.lower() for c in (item.get("categories") or [])]
    cat_name = (item.get("categoryName") or "").lower()
    all_cats = " ".join(cats + [cat_name])

    cuisine_map = [
        ("pizza", "Pizza"),
        ("chinese", "Chinese"),
        ("japanese", "Japanese"),
        ("sushi", "Japanese"),
        ("ramen", "Ramen"),
        ("thai", "Thai"),
        ("indian", "Indian"),
        ("mexican", "Mexican"),
        ("taco", "Mexican"),
        ("italian", "Italian"),
        ("french", "French"),
        ("korean", "Korean"),
        ("vietnamese", "Vietnamese"),
        ("pho", "Vietnamese"),
        ("mediterranean", "Mediterranean"),
        ("middle eastern", "Middle Eastern"),
        ("falafel", "Middle Eastern"),
        ("shawarma", "Middle Eastern"),
        ("greek", "Greek"),
        ("burger", "Burgers"),
        ("steak", "Steakhouse"),
        ("seafood", "Seafood"),
        ("bbq", "BBQ"),
        ("barbecue", "BBQ"),
        ("bakery", "Bakery"),
        ("dessert", "Dessert"),
        ("ice cream", "Dessert"),
        ("deli", "Deli"),
        ("sandwich", "Deli"),
        ("vegan", "Vegan"),
        ("vegetarian", "Veggie"),
        ("brunch", "Brunch"),
        ("breakfast", "Brunch"),
        ("diner", "Diner"),
        ("caribbean", "Caribbean"),
        ("colombian", "Colombian"),
        ("peruvian", "Peruvian"),
        ("ethiopian", "Ethiopian"),
        ("bangladeshi", "Bangladeshi"),
        ("halal", "Halal"),
        ("jewish", "Jewish"),
        ("cafe", "Cafe"),
        ("coffee", "Cafe"),
        ("american", "American"),
    ]

    for keyword, label in cuisine_map:
        if keyword in all_cats:
            return label

    return "Restaurant"


def build_restaurants_df(items: list[dict]) -> pd.DataFrame:
    """Convert Apify place items into a restaurants DataFrame."""
    rows = []
    seen_ids = set()

    for item in items:
        pid = item.get("placeId")
        if not pid or pid in seen_ids:
            continue
        seen_ids.add(pid)

        rid = make_restaurant_id(pid)
        name = item.get("title", "Unknown")
        neighborhood = item.get("neighborhood") or item.get("city") or ""
        cuisine = guess_cuisine(item)
        city = "NYC"

        rows.append({
            "restaurant_id": rid,
            "name": name,
            "neighborhood": neighborhood,
            "cuisine": cuisine,
            "city": city,
            # Extra fields your pipeline can use
            "google_place_id": pid,
            "address": item.get("address", ""),
            "total_score": item.get("totalScore"),
            "review_count": item.get("reviewsCount", 0),
            "image_url": item.get("imageUrl", ""),
            "url": item.get("url", ""),
        })

    df = pd.DataFrame(rows)
    print(f"📋 Built restaurants table: {len(df)} unique restaurants")
    return df


# ---------------------------------------------------------------------------
# STEP 3 — Transform Apify reviews → reviews.csv
# ---------------------------------------------------------------------------

def estimate_reviewer_city(reviewer: dict) -> str:
    """
    Try to figure out if a reviewer is local to NYC.
    Google Maps sometimes provides a reviewer's location in their profile.
    We use the 'reviewerNumberOfReviews' as a proxy signal too.

    Returns 'NYC' or a generic other city.
    """
    # The Apify scraper doesn't always provide reviewer location,
    # but when it does, it's in various fields. We check what's available.
    # For now, default to NYC (the pipeline's localness model will
    # handle the rest based on review patterns).
    return "NYC"


def build_reviews_df(items: list[dict]) -> pd.DataFrame:
    """Extract individual reviews from Apify place items."""
    rows = []
    review_id = 1

    for item in items:
        pid = item.get("placeId")
        if not pid:
            continue
        rid = make_restaurant_id(pid)
        reviews = item.get("reviews") or []

        for rev in reviews:
            # Reviewer ID: use Google's reviewer URL or name as a stable key
            reviewer_url = rev.get("reviewerUrl") or rev.get("name") or f"anon_{review_id}"
            reviewer_id = "u_" + hashlib.md5(reviewer_url.encode()).hexdigest()[:8]

            # Rating (1-5 stars)
            stars = rev.get("stars")
            if stars is None:
                continue

            # Timestamp
            published = rev.get("publishedAtDate") or rev.get("publishAt") or ""
            if published:
                try:
                    ts = pd.to_datetime(published).strftime("%Y-%m-%d")
                except Exception:
                    ts = datetime.today().strftime("%Y-%m-%d")
            else:
                ts = datetime.today().strftime("%Y-%m-%d")

            rows.append({
                "review_id": f"rev{review_id:05d}",
                "reviewer_id": reviewer_id,
                "restaurant_id": rid,
                "restaurant_city": "NYC",
                "timestamp": ts,
                "rating": round(float(stars), 1),
                "reviewer_total_reviews": rev.get("reviewerNumberOfReviews") or 0,
                "is_local_guide": bool(rev.get("isLocalGuide")),
            })
            review_id += 1

    df = pd.DataFrame(rows)
    print(f"📝 Built reviews table: {len(df)} reviews from {df['reviewer_id'].nunique()} unique reviewers")
    return df


# ---------------------------------------------------------------------------
# STEP 4 — Save CSVs
# ---------------------------------------------------------------------------

def save(restaurants_df: pd.DataFrame, reviews_df: pd.DataFrame, raw_items: list[dict]):
    os.makedirs(OUTPUT_DIR, exist_ok=True)

    r_path = os.path.join(OUTPUT_DIR, "restaurants.csv")
    v_path = os.path.join(OUTPUT_DIR, "reviews.csv")
    j_path = os.path.join(OUTPUT_DIR, "raw_apify_data.json")

    # Merge with existing data (deduplicate by google_place_id / review_id)
    if os.path.exists(r_path):
        existing_r = pd.read_csv(r_path)
        known_pids = set(existing_r["google_place_id"].dropna())
        new_r = restaurants_df[~restaurants_df["google_place_id"].isin(known_pids)]
        restaurants_df = pd.concat([existing_r, new_r], ignore_index=True)
        print(f"   Merged: {len(existing_r)} existing + {len(new_r)} new restaurants = {len(restaurants_df)} total")

    if os.path.exists(v_path):
        existing_v = pd.read_csv(v_path)
        known_rids = set(existing_v["review_id"])
        new_v = reviews_df[~reviews_df["review_id"].isin(known_rids)]
        reviews_df = pd.concat([existing_v, new_v], ignore_index=True)
        print(f"   Merged: {len(existing_v)} existing + {len(new_v)} new reviews = {len(reviews_df)} total")

    # Merge raw JSON (needed by enrich_data.py)
    existing_raw: list[dict] = []
    if os.path.exists(j_path):
        with open(j_path) as f:
            existing_raw = json.load(f)
    existing_pids = {r.get("placeId") for r in existing_raw if r.get("placeId")}
    new_raw = [r for r in raw_items if r.get("placeId") not in existing_pids]
    merged_raw = existing_raw + new_raw
    with open(j_path, "w") as f:
        json.dump(merged_raw, f)

    restaurants_df.to_csv(r_path, index=False)
    reviews_df.to_csv(v_path, index=False)

    print(f"\n✅ Saved {r_path}  ({len(restaurants_df)} restaurants)")
    print(f"✅ Saved {v_path}  ({len(reviews_df)} reviews)")
    print(f"✅ Saved {j_path}  ({len(merged_raw)} raw place records)")


# ---------------------------------------------------------------------------
# MAIN
# ---------------------------------------------------------------------------

def main():
    token = os.getenv("APIFY_API_TOKEN")
    if not token:
        print("❌ Missing APIFY_API_TOKEN in .env file!")
        print("   Create a .env file with:  APIFY_API_TOKEN=apify_api_XXXXX")
        print("   Get your token from: https://console.apify.com/account/integrations")
        return

    items = run_scraper(token, use_last_run=USE_LAST_RUN)

    if not items:
        print("⚠️  No results returned. Check your Apify account and input settings.")
        return

    restaurants_df = build_restaurants_df(items)
    reviews_df = build_reviews_df(items)

    save(restaurants_df, reviews_df, items)

    print(f"\n🎉 Done! Now run:  python run_pipeline.py")


if __name__ == "__main__":
    main()