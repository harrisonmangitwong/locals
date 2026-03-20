"""
refresh.py

Single command to fetch real restaurant data and regenerate recommendations.

Usage:
    1. Add your Apify token to .env:  APIFY_API_TOKEN=apify_api_XXXXX
    2. Run:  python refresh.py

This will:
    - Scrape Google Maps via Apify → data/restaurants.csv + data/reviews.csv
    - Run the scoring pipeline → outputs/locals_recommendations.csv
"""

import os
import sys
from dotenv import load_dotenv

load_dotenv()


def main():
    token = os.getenv("APIFY_API_TOKEN")
    if not token:
        print("❌ Missing APIFY_API_TOKEN")
        print("   Create a .env file with:  APIFY_API_TOKEN=apify_api_XXXXX")
        print("   Get your token from: https://console.apify.com/account/integrations")
        sys.exit(1)

    # Step 1: Scrape
    print("=" * 50)
    print("STEP 1: Scraping Google Maps via Apify")
    print("=" * 50)
    from scrape_google_maps import run_scraper, build_restaurants_df, build_reviews_df, save, USE_LAST_RUN
    items = run_scraper(token, use_last_run=USE_LAST_RUN)
    if not items:
        print("⚠️  No results returned from Apify. Check your account.")
        sys.exit(1)
    restaurants_df = build_restaurants_df(items)
    reviews_df = build_reviews_df(items)
    save(restaurants_df, reviews_df)

    # Step 2: Pipeline
    print("\n" + "=" * 50)
    print("STEP 2: Running scoring pipeline")
    print("=" * 50)
    import run_pipeline
    run_pipeline.main()

    print("\n" + "=" * 50)
    print("Done! Start the app with:")
    print("  python3 -m streamlit run app.py")
    print("=" * 50)


if __name__ == "__main__":
    main()
