"""
scrape_labeled_restaurants.py

Scrapes specific restaurants from the user's labeled training data
that aren't already in the dataset. Uses Apify Google Maps Scraper
with exact restaurant name + NYC searches.

Usage:
    python3 scrape_labeled_restaurants.py
"""

import os
import hashlib
from datetime import datetime

import pandas as pd
from apify_client import ApifyClient
from dotenv import load_dotenv

load_dotenv()

OUTPUT_DIR = "data"
MAX_REVIEWS_PER_PLACE = 50


def make_restaurant_id(place_id: str) -> str:
    h = hashlib.md5(place_id.encode()).hexdigest()[:6]
    return f"r_{h}"


def guess_cuisine(item: dict) -> str:
    cats = [c.lower() for c in (item.get("categories") or [])]
    cat_name = (item.get("categoryName") or "").lower()
    all_cats = " ".join(cats + [cat_name])

    cuisine_map = [
        ("pizza", "Pizza"), ("chinese", "Chinese"), ("japanese", "Japanese"),
        ("sushi", "Japanese"), ("ramen", "Ramen"), ("thai", "Thai"),
        ("indian", "Indian"), ("mexican", "Mexican"), ("taco", "Mexican"),
        ("italian", "Italian"), ("french", "French"), ("korean", "Korean"),
        ("vietnamese", "Vietnamese"), ("pho", "Vietnamese"),
        ("mediterranean", "Mediterranean"), ("middle eastern", "Middle Eastern"),
        ("falafel", "Middle Eastern"), ("shawarma", "Middle Eastern"),
        ("greek", "Greek"), ("burger", "Burgers"), ("steak", "Steakhouse"),
        ("seafood", "Seafood"), ("bbq", "BBQ"), ("barbecue", "BBQ"),
        ("bakery", "Bakery"), ("dessert", "Dessert"), ("ice cream", "Dessert"),
        ("deli", "Deli"), ("sandwich", "Deli"), ("vegan", "Vegan"),
        ("vegetarian", "Veggie"), ("brunch", "Brunch"), ("breakfast", "Brunch"),
        ("diner", "Diner"), ("caribbean", "Caribbean"), ("colombian", "Colombian"),
        ("peruvian", "Peruvian"), ("ethiopian", "Ethiopian"),
        ("bangladeshi", "Bangladeshi"), ("halal", "Halal"), ("jewish", "Jewish"),
        ("cafe", "Cafe"), ("coffee", "Cafe"), ("american", "American"),
    ]

    for keyword, label in cuisine_map:
        if keyword in all_cats:
            return label
    return "Restaurant"


def load_missing_restaurants() -> list[str]:
    """Load restaurant names from labels that aren't in the existing dataset."""
    existing = pd.read_csv("outputs/locals_restaurant_scores_with_probs.csv")
    labels = pd.read_csv("data/user_labels_raw.csv")
    labels.columns = ["name", "label_safe_pick"]

    existing_names = set(existing["name"].str.lower().str.strip())
    labels["name_clean"] = labels["name"].str.lower().str.strip()

    missing = labels[~labels["name_clean"].isin(existing_names)]
    return missing["name"].tolist()


def scrape_restaurants(token: str, names: list[str]) -> list[dict]:
    """Scrape specific restaurants by searching each name + NYC."""
    client = ApifyClient(token)

    # Build search terms: "Restaurant Name NYC"
    search_terms = [f"{name} NYC" for name in names]

    # Apify has limits per run, so batch into chunks of ~50
    BATCH_SIZE = 50
    all_items = []

    for i in range(0, len(search_terms), BATCH_SIZE):
        batch = search_terms[i:i + BATCH_SIZE]
        batch_num = i // BATCH_SIZE + 1
        total_batches = (len(search_terms) + BATCH_SIZE - 1) // BATCH_SIZE

        print(f"\n🚀 Batch {batch_num}/{total_batches} ({len(batch)} restaurants)...")

        actor_input = {
            "searchStringsArray": batch,
            "locationQuery": "New York City, USA",
            "maxCrawledPlacesPerSearch": 1,  # We want exactly 1 result per search
            "language": "en",
            "searchMatching": "all",
            "skipClosedPlaces": True,
            "scrapePlaceDetailPage": True,
            "maxReviews": MAX_REVIEWS_PER_PLACE,
            "reviewsSort": "newest",
            "scrapeReviewsPersonalData": True,
            "maxImages": 1,
            "maxQuestions": 0,
            "scrapeContacts": False,
            "scrapeDirectories": False,
            "includeWebResults": False,
            "scrapeTableReservationProvider": False,
        }

        run = client.actor("compass/crawler-google-places").call(run_input=actor_input)
        dataset_id = run["defaultDatasetId"]
        items = list(client.dataset(dataset_id).iterate_items())
        print(f"   ✅ Got {len(items)} places")
        all_items.extend(items)

    print(f"\n📦 Total scraped: {len(all_items)} places")
    return all_items


def build_and_merge(items: list[dict]):
    """Build restaurant + review DataFrames and merge with existing data."""
    # Build restaurants
    restaurant_rows = []
    seen_ids = set()
    for item in items:
        pid = item.get("placeId")
        if not pid or pid in seen_ids:
            continue
        seen_ids.add(pid)
        rid = make_restaurant_id(pid)
        restaurant_rows.append({
            "restaurant_id": rid,
            "name": item.get("title", "Unknown"),
            "neighborhood": item.get("neighborhood") or item.get("city") or "",
            "cuisine": guess_cuisine(item),
            "city": "NYC",
            "google_place_id": pid,
            "address": item.get("address", ""),
            "total_score": item.get("totalScore"),
            "review_count": item.get("reviewsCount", 0),
            "image_url": item.get("imageUrl", ""),
            "url": item.get("url", ""),
        })

    new_restaurants = pd.DataFrame(restaurant_rows)
    print(f"\n📋 New restaurants: {len(new_restaurants)}")

    # Build reviews
    review_rows = []
    review_id = 100000  # Start high to avoid ID conflicts
    for item in items:
        pid = item.get("placeId")
        if not pid:
            continue
        rid = make_restaurant_id(pid)
        for rev in (item.get("reviews") or []):
            reviewer_url = rev.get("reviewerUrl") or rev.get("name") or f"anon_{review_id}"
            reviewer_id = "u_" + hashlib.md5(reviewer_url.encode()).hexdigest()[:8]
            stars = rev.get("stars")
            if stars is None:
                continue
            published = rev.get("publishedAtDate") or rev.get("publishAt") or ""
            if published:
                try:
                    ts = pd.to_datetime(published).strftime("%Y-%m-%d")
                except Exception:
                    ts = datetime.today().strftime("%Y-%m-%d")
            else:
                ts = datetime.today().strftime("%Y-%m-%d")

            review_rows.append({
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

    new_reviews = pd.DataFrame(review_rows)
    print(f"📝 New reviews: {len(new_reviews)}")

    # Merge with existing
    existing_restaurants = pd.read_csv("data/restaurants.csv")
    existing_reviews = pd.read_csv("data/reviews.csv")

    # Deduplicate by restaurant_id
    existing_rids = set(existing_restaurants["restaurant_id"])
    new_restaurants = new_restaurants[~new_restaurants["restaurant_id"].isin(existing_rids)]
    new_reviews = new_reviews[~new_reviews["restaurant_id"].isin(existing_rids)]

    merged_restaurants = pd.concat([existing_restaurants, new_restaurants], ignore_index=True)
    merged_reviews = pd.concat([existing_reviews, new_reviews], ignore_index=True)

    merged_restaurants.to_csv("data/restaurants.csv", index=False)
    merged_reviews.to_csv("data/reviews.csv", index=False)

    print(f"\n✅ Merged: {len(merged_restaurants)} total restaurants, {len(merged_reviews)} total reviews")
    print(f"   (added {len(new_restaurants)} new restaurants, {len(new_reviews)} new reviews)")


def main():
    token = os.getenv("APIFY_API_TOKEN")
    if not token:
        print("❌ Missing APIFY_API_TOKEN in .env file!")
        return

    missing = load_missing_restaurants()
    print(f"🔍 {len(missing)} restaurants to scrape")

    if not missing:
        print("✅ All labeled restaurants already in dataset!")
        return

    items = scrape_restaurants(token, missing)
    if not items:
        print("⚠️  No results returned.")
        return

    build_and_merge(items)
    print(f"\n🎉 Done! Now run: python3 run_pipeline.py")


if __name__ == "__main__":
    main()
