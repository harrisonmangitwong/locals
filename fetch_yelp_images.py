"""
fetch_yelp_images.py

Fetches real restaurant photo URLs from the Yelp Fusion API using each
restaurant's name + address, then updates image_url in backend/data.csv.

Usage:
    YELP_API_KEY=your_key python3 fetch_yelp_images.py

Free tier: 500 calls/day — 407 restaurants fits in one run.
Yelp CDN URLs don't expire, unlike Google Maps signed URLs.
"""

import os
import time
import pandas as pd
import urllib.request
import urllib.parse
import json

DATA_PATH = "backend/data.csv"
YELP_SEARCH_URL = "https://api.yelp.com/v3/businesses/search"
DELAY_SECONDS = 0.25  # 4 req/sec — well within free tier limits


def yelp_search(api_key: str, name: str, address: str) -> str | None:
    """Search Yelp for a business by name + address; return image_url or None."""
    params = urllib.parse.urlencode({
        "term": name,
        "location": address,
        "limit": 1,
    })
    req = urllib.request.Request(
        f"{YELP_SEARCH_URL}?{params}",
        headers={"Authorization": f"Bearer {api_key}"},
    )
    try:
        with urllib.request.urlopen(req, timeout=10) as resp:
            data = json.loads(resp.read())
            businesses = data.get("businesses", [])
            if businesses:
                img = businesses[0].get("image_url", "")
                # Convert to original (non-thumbnail) version
                return img.replace("/s.jpg", "/o.jpg").replace("/ms.jpg", "/o.jpg") if img else None
    except Exception as e:
        print(f"  Error: {e}")
    return None


def main():
    api_key = os.environ.get("YELP_API_KEY", "").strip()
    if not api_key:
        print("Error: Set YELP_API_KEY environment variable first.")
        print("  Get a free key at: https://www.yelp.com/developers/v3/manage_app")
        return

    df = pd.read_csv(DATA_PATH)
    updated = 0
    skipped = 0

    for i, row in df.iterrows():
        name = row["name"]
        address = row.get("address", "")
        # Use full address if available, fall back to neighborhood + NYC
        location = address if pd.notna(address) and address else f"{row.get('neighborhood', '')}, New York City"

        print(f"[{i+1}/{len(df)}] {name} ...", end=" ", flush=True)
        img_url = yelp_search(api_key, name, location)

        if img_url:
            df.at[i, "image_url"] = img_url
            updated += 1
            print(f"OK ({img_url[:60]}...)")
        else:
            skipped += 1
            print("not found — keeping existing")

        time.sleep(DELAY_SECONDS)

    df.to_csv(DATA_PATH, index=False)
    print(f"\nDone. Updated: {updated}, Skipped/not found: {skipped}")
    print(f"Saved to {DATA_PATH}")


if __name__ == "__main__":
    main()
