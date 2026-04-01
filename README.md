# Locals — NYC Restaurant Discovery

**[locals-nyc.com](https://www.locals-nyc.com)**

A data-driven restaurant recommendation app that surfaces places real New Yorkers love — not the ones tourists stumble into.

## The Problem

Visiting NYC and don't want to eat at a tourist trap? Google Maps won't help — its ratings are dominated by one-time visitors who rate the experience, not the food. A mediocre restaurant near Times Square with thousands of tourist reviews outranks the authentic neighborhood spot that locals return to every week. There's no way to filter by *who* is doing the rating.

## How It Works

1. **Scrape** — 48,000+ reviews across 415 NYC restaurants via Apify's Google Maps crawler
2. **Score reviewers** — each reviewer gets a localness score (0–1) based on geographic concentration of their reviews, review consistency over time, and Local Guide status
3. **Train a model** — a Random Forest classifier trained on 21 features (local vs. tourist ratings, NLP signals, location, price) classifies each restaurant as "local-approved"
4. **Rank and serve** — restaurants are ranked by confidence score and surfaced in a filterable web app

## Features

- Filterable recommendations by neighborhood, cuisine, price, and open now
- Detail pages with hours, contact info, local vs. tourist rating breakdown, and local signal strength
- Save favorites (localStorage)
- Dark mode support
- Mobile responsive

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js, TypeScript, Tailwind CSS |
| Backend | FastAPI, Python |
| ML | scikit-learn (Random Forest), pandas, numpy |
| Data | Apify (Google Maps scraper) |
| Deployment | Vercel (frontend), Railway (backend) |
| Dev tools | Claude Code, ChatGPT, Impeccable |

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

App runs at `http://localhost:3000`. Set `NEXT_PUBLIC_API_URL=http://localhost:8000` in `frontend/.env.local`.

## Project Structure

```
locals/
├── backend/
│   ├── main.py          # FastAPI app, ML scoring, Open Now logic
│   └── data.csv         # Enriched restaurant dataset
├── frontend/
│   ├── app/             # Next.js App Router pages
│   └── components/      # RestaurantCard and shared components
├── pipeline.py          # ML training pipeline
└── enrich_data.py       # Data enrichment from raw Apify output
```
