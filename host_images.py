#!/usr/bin/env python3
"""
host_images.py

Downloads each restaurant's current image and uploads it to Supabase Storage
(restaurant-photos bucket). Updates backend/data.csv with permanent hosted URLs.

Usage: python3 host_images.py
"""

import csv
import io
import json
import os
import sys
import time
import urllib.error
import urllib.request

DATA_CSV = "backend/data.csv"
SUPABASE_URL = "https://komriwzkkknrsirifgqg.supabase.co"
SUPABASE_SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtvbXJpd3pra2tucnNpcmlmZ3FnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3OTA0NDI0MSwiZXhwIjoyMDk0NjIwMjQxfQ.DgVULmoeKyyIKdnZ-JQNe_4uYHcoKbRAVf4an1ndbdI"
BUCKET = "restaurant-photos"
HEADERS_AUTH = {
    "Authorization": f"Bearer {SUPABASE_SERVICE_KEY}",
    "apikey": SUPABASE_SERVICE_KEY,
}
BROWSER_UA = (
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
    "AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
)


def ensure_bucket():
    """Create the public bucket if it doesn't exist."""
    url = f"{SUPABASE_URL}/storage/v1/bucket"
    body = json.dumps({"id": BUCKET, "name": BUCKET, "public": True}).encode()
    req = urllib.request.Request(
        url,
        data=body,
        headers={**HEADERS_AUTH, "Content-Type": "application/json"},
        method="POST",
    )
    try:
        with urllib.request.urlopen(req) as resp:
            print(f"✓ Created bucket '{BUCKET}'")
    except urllib.error.HTTPError as e:
        msg = e.read().decode()
        if "already exists" in msg or e.code == 400:
            print(f"  Bucket '{BUCKET}' already exists, continuing.")
        else:
            print(f"  Bucket create error {e.code}: {msg}")
            sys.exit(1)


def download_image(url: str) -> bytes | None:
    req = urllib.request.Request(
        url,
        headers={"User-Agent": BROWSER_UA, "Referer": "https://www.locals-nyc.com/"},
    )
    try:
        with urllib.request.urlopen(req, timeout=15) as resp:
            return resp.read()
    except Exception as e:
        print(f"    Download error: {e}")
        return None


def upload_image(data: bytes, path: str, content_type: str = "image/jpeg") -> str | None:
    """Upload bytes to Supabase Storage, return public URL."""
    url = f"{SUPABASE_URL}/storage/v1/object/{BUCKET}/{path}"
    req = urllib.request.Request(
        url,
        data=data,
        headers={
            **HEADERS_AUTH,
            "Content-Type": content_type,
            "x-upsert": "true",
        },
        method="POST",
    )
    try:
        with urllib.request.urlopen(req) as resp:
            resp.read()
        return f"{SUPABASE_URL}/storage/v1/object/public/{BUCKET}/{path}"
    except urllib.error.HTTPError as e:
        print(f"    Upload error {e.code}: {e.read().decode()[:100]}")
        return None


def already_hosted(url: str) -> bool:
    return url and "supabase.co/storage" in url


def main():
    ensure_bucket()

    rows = []
    with open(DATA_CSV, newline="", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        fieldnames = reader.fieldnames
        rows = list(reader)

    updated = 0
    skipped = 0
    failed = 0

    for i, row in enumerate(rows):
        name = row["name"]
        rid = row["restaurant_id"]
        img_url = row.get("image_url", "") or ""

        if already_hosted(img_url):
            skipped += 1
            print(f"[{i+1}/{len(rows)}] {name[:30]} — already hosted, skip")
            continue

        if not img_url:
            failed += 1
            print(f"[{i+1}/{len(rows)}] {name[:30]} — no image_url")
            continue

        print(f"[{i+1}/{len(rows)}] {name[:30]} ...", end=" ", flush=True)
        img_data = download_image(img_url)

        if not img_data:
            failed += 1
            print("download failed")
            continue

        path = f"{rid}.jpg"
        hosted_url = upload_image(img_data, path)

        if hosted_url:
            row["image_url"] = hosted_url
            updated += 1
            print(f"OK ({len(img_data)//1024}KB)")
        else:
            failed += 1
            print("upload failed")

        time.sleep(0.05)

    with open(DATA_CSV, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(rows)

    print(f"\nDone. Updated: {updated}, Skipped: {skipped}, Failed: {failed}")
    print(f"Next: git add backend/data.csv && git commit && git push origin main")


if __name__ == "__main__":
    main()
