"""
Enrich backend/data.csv (or the CSV path given as the first argument, e.g.
backend/sweets.csv) with phone, website, opening_hours, extra_image_urls,
and top_reviews from data/raw_apify_data.json.
Run: python3 enrich_data.py [path]
"""
import json
import sys
import pandas as pd

DATA_CSV = sys.argv[1] if len(sys.argv) > 1 else "backend/data.csv"

with open("data/raw_apify_data.json") as f:
    apify_list = json.load(f)

apify_map: dict = {}
for rec in apify_list:
    pid = rec.get("placeId") or rec.get("inputPlaceId")
    if pid:
        apify_map[pid] = rec

df = pd.read_csv(DATA_CSV)

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

_COMMON_ENGLISH_WORDS = {
    "the", "and", "was", "is", "for", "with", "very", "this", "that", "it",
    "in", "on", "to", "of", "a", "we", "i", "my", "our", "had", "were",
    "good", "great", "food", "service", "place", "staff", "amazing", "love",
    "loved", "best", "nice", "friendly", "recommend", "delicious", "really",
    "definitely", "so", "but", "not", "would", "will", "go", "went", "came",
}


def _is_mostly_english(text: str) -> bool:
    """Cheap, dependency-free language filter. ASCII-ratio alone isn't
    enough -- Spanish, Polish, French etc. are also mostly ASCII -- so this
    also requires a few common English words to actually show up, not just
    Latin characters."""
    if not text:
        return False
    ascii_chars = sum(1 for c in text if ord(c) < 128)
    if ascii_chars / len(text) < 0.85:
        return False
    words = [w.strip(".,!?()\"'").lower() for w in text.split()]
    if len(words) < 4:
        return True  # too short to judge reliably either way; ASCII check already passed
    return sum(1 for w in words if w in _COMMON_ENGLISH_WORDS) >= 2


def get_top_reviews(row):
    candidates = [r for r in apify_for(row).get("reviews", []) if r.get("text") and _is_mostly_english(r["text"])]
    if not candidates:
        return None
    # Prefer local guides, then prefer short, complete reviews over long
    # paragraphs -- nobody reads a 6-sentence quote on a page built for a
    # fast decision. The 40-char floor skips throwaway one-liners ("great!")
    # that don't actually say anything; fall back to all candidates if
    # nothing clears it.
    substantial = [r for r in candidates if len(r.get("text") or "") >= 40]
    pool = substantial if substantial else candidates
    pool.sort(key=lambda r: (not bool(r.get("isLocalGuide")), len(r.get("text") or "")))
    top = pool[:3]
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

df.to_csv(DATA_CSV, index=False)

print(f"Total: {len(df)}")
print(f"Has phone:        {df['phone'].notna().sum()}")
print(f"Has website:      {df['website'].notna().sum()}")
print(f"Has hours:        {df['opening_hours'].notna().sum()}")
print(f"Has extra images: {df['extra_image_urls'].notna().sum()}")
print(f"Has top reviews:  {df['top_reviews'].notna().sum()}")
print("Done.")
