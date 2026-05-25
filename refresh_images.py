"""
refresh_images.py

Re-scrapes imageUrl for all restaurants in backend/data.csv using their
existing Google Maps URLs (no name ambiguity). Updates image_url in place.

Usage:
    python3 refresh_images.py
"""

import os
import pandas as pd
from apify_client import ApifyClient
from dotenv import load_dotenv

load_dotenv()

DATA_PATH = "backend/data.csv"
BATCH_SIZE = 50


def scrape_images(client: ApifyClient, urls: list[str]) -> dict[str, str]:
    """Returns {google_maps_url -> imageUrl} for each scraped place."""
    actor_input = {
        "startUrls": [{"url": u} for u in urls],
        "maxCrawledPlacesPerSearch": 1,
        "language": "en",
        "skipClosedPlaces": False,
        "scrapePlaceDetailPage": False,
        "maxReviews": 0,
        "maxImages": 1,
        "maxQuestions": 0,
        "scrapeContacts": False,
        "scrapeDirectories": False,
        "includeWebResults": False,
        "scrapeTableReservationProvider": False,
    }

    run = client.actor("compass/crawler-google-places").call(run_input=actor_input)
    items = list(client.dataset(run["defaultDatasetId"]).iterate_items())

    result = {}
    for item in items:
        image = item.get("imageUrl") or item.get("image") or ""
        # Map back via the URL field Apify echoes
        place_url = item.get("url") or ""
        place_id = item.get("placeId") or ""
        if image:
            result[place_url] = image
            result[place_id] = image
    return result


def main():
    token = os.getenv("APIFY_API_TOKEN")
    if not token:
        print("❌ Missing APIFY_API_TOKEN in .env")
        return

    df = pd.read_csv(DATA_PATH)
    if "url" not in df.columns or "image_url" not in df.columns:
        print("❌ Expected 'url' and 'image_url' columns in", DATA_PATH)
        return

    urls = df["url"].dropna().tolist()
    place_ids = df["google_place_id"].dropna().tolist()
    print(f"🔍 Refreshing images for {len(urls)} restaurants in {BATCH_SIZE}-item batches...")

    client = ApifyClient(token)
    url_to_image: dict[str, str] = {}

    for i in range(0, len(urls), BATCH_SIZE):
        batch = urls[i : i + BATCH_SIZE]
        batch_num = i // BATCH_SIZE + 1
        total = (len(urls) + BATCH_SIZE - 1) // BATCH_SIZE
        print(f"  Batch {batch_num}/{total} ({len(batch)} restaurants)...")
        result = scrape_images(client, batch)
        url_to_image.update(result)
        print(f"    Got {len(result)} images")

    # Update image_url column — match by Google Maps URL or place_id
    updated = 0
    for idx, row in df.iterrows():
        new_img = url_to_image.get(row.get("url", "")) or url_to_image.get(row.get("google_place_id", ""))
        if new_img:
            df.at[idx, "image_url"] = new_img
            updated += 1

    df.to_csv(DATA_PATH, index=False)
    print(f"\n✅ Updated {updated}/{len(df)} image URLs in {DATA_PATH}")
    print("   Now redeploy the backend (and optionally re-run pipeline for data.csv sync).")


if __name__ == "__main__":
    main()
