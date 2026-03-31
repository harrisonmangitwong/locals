"""
Enrich backend/data.csv with phone, website, opening_hours, extra_image_urls,
and top_reviews from data/raw_apify_data.json.
Run once: python3 enrich_data.py
"""
import json
import pandas as pd

with open("data/raw_apify_data.json") as f:
    apify_list = json.load(f)

apify_map: dict = {}
for rec in apify_list:
    pid = rec.get("placeId") or rec.get("inputPlaceId")
    if pid:
        apify_map[pid] = rec

df = pd.read_csv("backend/data.csv")

def apify_for(row) -> dict:
    return apify_map.get(row.get("google_place_id", ""), {})

def get_phone(row):
    return apify_for(row).get("phone") or None

def get_website(row):
    return apify_for(row).get("website") or None

def get_opening_hours(row):
    hours = apify_for(row).get("openingHours")
    return json.dumps(hours) if hours else None

def get_extra_images(row):
    urls = [u for u in apify_for(row).get("imageUrls", []) if u][:5]
    return json.dumps(urls) if urls else None

def get_top_reviews(row):
    reviews = [r for r in apify_for(row).get("reviews", []) if r.get("text")]
    reviews.sort(key=lambda r: r.get("likesCount", 0), reverse=True)
    top = reviews[:3]
    if not top:
        return None
    return json.dumps([
        {"text": r["text"], "rating": r.get("stars") or r.get("rating") or 5,
         "author": r.get("name", "Local"), "published": r.get("publishAt", "")}
        for r in top
    ])

rows = df.to_dict(orient="records")
df["phone"] = [get_phone(r) for r in rows]
df["website"] = [get_website(r) for r in rows]
df["opening_hours"] = [get_opening_hours(r) for r in rows]
df["extra_image_urls"] = [get_extra_images(r) for r in rows]
df["top_reviews"] = [get_top_reviews(r) for r in rows]

df.to_csv("backend/data.csv", index=False)

print(f"Total: {len(df)}")
print(f"Has phone:        {df['phone'].notna().sum()}")
print(f"Has website:      {df['website'].notna().sum()}")
print(f"Has hours:        {df['opening_hours'].notna().sum()}")
print(f"Has extra images: {df['extra_image_urls'].notna().sum()}")
print(f"Has top reviews:  {df['top_reviews'].notna().sum()}")
print("Done.")
