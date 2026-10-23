"""
update_backend.py

Copies the pipeline output into backend/data.csv and enriches it
with phone, hours, and reviews from the raw Apify data.

Work that took real effort to produce is carried over from the current
backend/data.csv for every restaurant that stays on the list:
  - image_url, when it's a permanent copy in Supabase Storage (the scraped
    Google photo links expire, and the site would fall back to stock photos)
  - review_themes (the "what to order" / vibe summaries from Claude)
New restaurants still need host_images.py (photos) and
backend/enrich_reviews.py (summaries); the script lists them at the end.

Run after run_pipeline.py:
    python update_backend.py
"""

import os
import subprocess
import sys

import pandas as pd

SRC = "outputs/locals_recommendations.csv"
DST = "backend/data.csv"
CARRY_OVER = ["image_url", "review_themes"]

if not os.path.exists(SRC):
    print(f"❌ {SRC} not found — run python run_pipeline.py first")
    sys.exit(1)

previous = pd.read_csv(DST) if os.path.exists(DST) else None

pd.read_csv(SRC).to_csv(DST, index=False)
print(f"✅ Copied {SRC} → {DST}")

print("\nRunning enrich_data.py...")
result = subprocess.run([sys.executable, "enrich_data.py"], check=False)
if result.returncode != 0:
    print("⚠️  enrich_data.py failed — backend/data.csv was updated but not enriched")
    sys.exit(1)

if previous is not None:
    df = pd.read_csv(DST)
    prev = previous.set_index("restaurant_id")
    hosted = prev["image_url"].where(prev["image_url"].astype(str).str.contains("supabase.co/storage"))
    df["image_url"] = df["restaurant_id"].map(hosted).fillna(df["image_url"])
    if "review_themes" in prev.columns:
        df["review_themes"] = df["restaurant_id"].map(prev["review_themes"])
    df.to_csv(DST, index=False)
    needs_photo = int((~df["image_url"].astype(str).str.contains("supabase.co/storage")).sum())
    needs_themes = int(df["review_themes"].isna().sum()) if "review_themes" in df.columns else len(df)
    print(f"\nCarried over hosted photos and summaries for restaurants that stayed.")
    print(f"  still need a hosted photo: {needs_photo} → run python host_images.py")
    print(f"  still need summaries:      {needs_themes} → run python backend/enrich_reviews.py")

print("\n✅ Done. Commit and push backend/data.csv to deploy.")
