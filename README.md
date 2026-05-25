# Locals — NYC Restaurant Discovery

**[locals-nyc.com](https://www.locals-nyc.com)**

A data-driven restaurant recommendation app that surfaces places real New Yorkers love — not the tourist traps that dominate traditional review platforms.

## The Problem

Most restaurant discovery apps rank by raw rating or review volume. That favors spots near Times Square with thousands of one-time visitor reviews, not the neighborhood gems that locals return to week after week.

Locals fixes this by scoring each reviewer's "localness" — how geographically concentrated their reviews are, how consistent they are over time, and whether they're a Local Guide. A neighborhood regular's opinion counts more than a tourist's. The result is a ranked list of restaurants that reflects where New Yorkers actually eat.

## How It Works

1. **Collect** — 48,000+ reviews across 1,000+ NYC restaurants scraped via Apify's Google Maps crawler
2. **Score reviewers** — each reviewer gets a localness score (0–1) based on geographic concentration, review consistency over time, and Local Guide status
3. **Enrich restaurants** — aggregate local vs. tourist ratings, compute weighted scores, pull hours, images, and metadata
4. **Train a classifier** — Random Forest trained on 21 features (local/tourist rating delta, NLP signals, location, price, polarization) predicts whether a restaurant is "local-approved"
5. **Rank and serve** — restaurants are ranked by model confidence and surfaced through a filterable FastAPI + Next.js app

## Features

- Filterable recommendations by neighborhood, cuisine, price range, and open now
- Detail pages with hours, Google Maps link, local vs. tourist rating breakdown, and local signal score
- Favorites (saved per-user to Supabase)
- Dark mode, mobile responsive

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 16, TypeScript, Tailwind CSS |
| Backend | FastAPI, Python |
| Database | Supabase (PostgreSQL) |
| Auth | NextAuth v5 (Google OAuth) |
| ML | scikit-learn (Random Forest), pandas, numpy |
| Data | Apify (Google Maps scraper) |
| Deployment | Vercel (frontend), Railway (backend) |

## Running Locally

**Backend**
```bash
pip install -r requirements.txt
python3 -m uvicorn backend.main:app --port 8000
```

**Frontend**
```bash
cd frontend
npm install
npm run dev
```

App runs at `http://localhost:3000`.

Create `frontend/.env.local`:
```
NEXT_PUBLIC_API_URL=http://localhost:8000
AUTH_URL=http://localhost:3000/api/auth
AUTH_SECRET=<your-secret>
AUTH_GOOGLE_ID=<your-google-client-id>
AUTH_GOOGLE_SECRET=<your-google-client-secret>
NEXT_PUBLIC_SUPABASE_URL=<your-supabase-url>
SUPABASE_SERVICE_ROLE_KEY=<your-supabase-service-role-key>
```

## Project Structure

```
locals/
├── backend/
│   ├── main.py              # FastAPI app — recommendations, filters, open-now logic
│   └── data.csv             # Enriched restaurant dataset (ML scores + metadata)
├── frontend/
│   ├── app/                 # Next.js App Router pages
│   │   ├── recommendations/ # Main discovery page
│   │   ├── restaurant/[id]/ # Restaurant detail page
│   │   ├── favorites/       # Saved restaurants
│   │   └── api/             # Auth + favorites API routes
│   ├── components/          # RestaurantCard and shared UI
│   └── auth.ts              # NextAuth config
├── data/
│   ├── reviews.csv          # Raw reviews (48k+)
│   └── restaurants.csv      # Raw restaurant metadata
├── pipeline.py              # ML training pipeline (reviewer scoring → model)
├── enrich_data.py           # Enrichment from raw Apify output
└── scrape_google_maps.py    # Apify scraper config
```
