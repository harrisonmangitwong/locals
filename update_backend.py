"""
update_backend.py

Copies the pipeline output into backend/data.csv and enriches it
with phone, hours, and reviews from the raw Apify data.

Run after run_pipeline.py:
    python update_backend.py
"""

import shutil
import subprocess
import sys
import os

SRC = "outputs/locals_recommendations.csv"
DST = "backend/data.csv"

if not os.path.exists(SRC):
    print(f"❌ {SRC} not found — run python run_pipeline.py first")
    sys.exit(1)

shutil.copy(SRC, DST)
print(f"✅ Copied {SRC} → {DST}")

print("\nRunning enrich_data.py...")
result = subprocess.run([sys.executable, "enrich_data.py"], check=False)
if result.returncode != 0:
    print("⚠️  enrich_data.py failed — backend/data.csv was updated but not enriched")
    sys.exit(1)

print("\n✅ Done. Commit and push backend/data.csv to deploy.")
