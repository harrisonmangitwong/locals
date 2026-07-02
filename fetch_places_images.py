"""
fetch_places_images.py

Uses Google Places API (New) with each restaurant's google_place_id to fetch
a photo URL and update image_url in backend/data.csv.

Usage:
    GOOGLE_PLACES_API_KEY=your_key python3 fetch_places_images.py

Cost: ~$0.017 per restaurant (Place Details Basic SKU) — 407 restaurants ≈ $7,
well within the $200/month free credit.
"""

import os
import time
import json
import urllib.request
import urllib.parse
import pandas as pd

DATA_PATH = "backend/data.csv"
DELAY = 0.1  # 10 req/sec

def get_photo_url(api_key: str, place_id: str) -> str | None:
    # Step 1: get photo reference via Place Details
    fields = "photos"
    url = f"https://places.googleapis.com/v1/places/{place_id}?fields={fields}&key={api_key}"
    req = urllib.request.Request(url, headers={"Content-Type": "application/json"})
    try:
        with urllib.request.urlopen(req, timeout=10) as resp:
            data = json.loads(resp.read())
        photos = data.get("photos", [])
        if not photos:
            return None
        photo_name = photos[0].get("name", "")
        if not photo_name:
            return None
    except Exception as e:
        print(f"  Details error: {e}")
        return None

    # Step 2: get the actual photo URL (skip redirect to get the direct URL)
    photo_url = f"https://places.googleapis.com/v1/{photo_name}/media?maxWidthPx=800&key={api_key}&skipHttpRedirect=true"
    req2 = urllib.request.Request(photo_url, headers={"Content-Type": "application/json"})
    try:
        with urllib.request.urlopen(req2, timeout=10) as resp:
            data2 = json.loads(resp.read())
        return data2.get("photoUri")
    except Exception as e:
        print(f"  Photo error: {e}")
        return None


def main():
    api_key = os.environ.get("GOOGLE_PLACES_API_KEY", "").strip()
    if not api_key:
        print("Error: set GOOGLE_PLACES_API_KEY environment variable first.")
        return

    df = pd.read_csv(DATA_PATH)
    updated = 0
    skipped = 0

    for i, row in df.iterrows():
        name = row["name"]
        place_id = row.get("google_place_id", "")
        if not isinstance(place_id, str) or not place_id.strip():
            skipped += 1
            print(f"[{i+1}/{len(df)}] {name} — no place_id")
            continue

        print(f"[{i+1}/{len(df)}] {name} ...", end=" ", flush=True)
        photo_url = get_photo_url(api_key, place_id.strip())

        if photo_url:
            df.at[i, "image_url"] = photo_url
            updated += 1
            print(f"OK")
        else:
            skipped += 1
            print("no photo")

        time.sleep(DELAY)

    df.to_csv(DATA_PATH, index=False)
    print(f"\nDone. Updated: {updated}, Skipped: {skipped}")


if __name__ == "__main__":
    main()
