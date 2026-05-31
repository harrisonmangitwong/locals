# Locals

### Find where New Yorkers actually eat.

**[locals-nyc.com](https://www.locals-nyc.com)**

---

## The Inspiration

I was traveling in Taiwan and ran into a problem I couldn't shake: I'd open Google Maps, search for food nearby, and the top results were clearly tourist traps — high ratings, thousands of reviews, packed with visitors, but locals I talked to had never heard of them.

The star rating wasn't measuring quality. It was measuring **tourist attention volume**.

I came back and noticed the same problem in NYC. One of the most reviewed cities in the world, but the rankings are polluted by one-time visitors who have no stake in whether a neighborhood restaurant actually holds up. The places real New Yorkers return to every week were buried under spots that had learned to optimize for foot traffic, not food.

That's what Locals is built to fix.

---

## The Insight

Google Maps has enormous amounts of data. The problem isn't data quality — it's that all reviewers are treated equally.

A tourist visiting New York once and a local who's eaten out 200 times in the city carry completely different signal value. If you know **who** is leaving the review, you can re-weight the ratings to surface what locals actually think.

---

## How It Works

**1. Score every reviewer**

Each reviewer gets a localness score from 0 to 1, built from three signals:

- **60% geographic concentration** — NYC reviews as a share of their total worldwide reviews. A visitor with 300 reviews globally but only 1 in NYC scores near zero.
- **25% review stability** — consistent NYC reviewing over time, not a one-time trip.
- **15% Local Guide badge** — Google-verified locals get a small boost.

**2. Re-weight the ratings**

Using those scores, every restaurant gets two separate ratings: a local-weighted rating and a tourist-weighted rating. The gap between them is one of the strongest signals of whether a place is a neighborhood staple or riding tourist hype.

**3. Run a classifier**

I hand-labeled 200 restaurants as "local-approved" or not to create training data, then trained a Random Forest on 21 features — review statistics, NLP signals from review text (quality language, local vs. tourist patterns), and location data (distance from tourist centers, price range, rating distribution).

The model outputs a confidence score for each restaurant. That score drives the final ranking.

**4. Surface it cleanly**

The app lets you filter by neighborhood, cuisine, price range, and whether a place is open now. Restaurant pages show the local take in plain language — no jargon, no bar charts, just: "locals rate it 4.4 vs. tourists' 3.8 — regulars love it more than visitors do."

---

## Product Decisions Worth Noting

- **Didn't surface the raw localness score to users.** It's too abstract and would require explanation at the wrong moment. The job-to-be-done is "find a good restaurant," not "understand the methodology." The verdict sentence does that job better.
- **Accounts backed by Supabase** rather than browser storage — so you can save restaurants while planning on your laptop and pull them up on your phone when you're out.
- **NYC-only launch.** Highest signal density in the US, most pronounced local/tourist gap, and every neighborhood has its own distinct food culture. The methodology is city-agnostic — Chicago, New Orleans, Tokyo all produce the same reviewable signal — but NYC is the right proof of concept.
- **Built the frontend with AI tooling (Claude Code).** Deliberate choice: the core algorithm, feature engineering, and hand-labeling are where the proprietary value is. Offloading the UI was the right trade-off.

---

## What I'd Build Next

- **City expansion.** The pipeline runs on any Google Maps data. The localness signal gets stronger in cities with dense resident reviewer populations — Chicago, LA, New Orleans are natural next markets.
- **Richer local signals.** Review recency, return visit patterns (reviewers who review the same restaurant twice), and photo-to-review ratio all carry signal I haven't fully used.
- **Personalization.** Right now the ranking is universal. A model that learns your neighborhood preferences and price range could surface a personal ranked list rather than a city-wide one.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 16, TypeScript, Tailwind CSS |
| Backend | FastAPI, Python |
| Database | Supabase (PostgreSQL) |
| Auth | NextAuth v5 (Google OAuth) |
| ML | scikit-learn (Random Forest), pandas, numpy |
| Data collection | Apify (Google Maps scraper) |
| Deployment | Vercel (frontend), Railway (backend) |

**Dataset:** 48,000+ reviews · 1,000+ restaurants · 200 hand-labeled training examples · 21 classifier features

---

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
AUTH_SECRET=<your-secret>
AUTH_GOOGLE_ID=<your-google-client-id>
AUTH_GOOGLE_SECRET=<your-google-client-secret>
NEXT_PUBLIC_SUPABASE_URL=<your-supabase-url>
SUPABASE_SERVICE_ROLE_KEY=<your-supabase-service-role-key>
```

---

## Project Structure

```
locals/
├── backend/
│   ├── main.py              # FastAPI app — recommendations, filters, open-now logic
│   └── data.csv             # Enriched restaurant dataset (ML scores + metadata)
├── frontend/
│   ├── app/
│   │   ├── recommendations/ # Main discovery page with filters
│   │   ├── restaurant/[id]/ # Restaurant detail page
│   │   ├── favorites/       # Saved restaurants (per-user, Supabase-backed)
│   │   └── api/             # Auth + saved/visited API routes
│   └── components/          # RestaurantCard and shared UI
├── data/
│   ├── reviews.csv          # Raw reviews (48k+)
│   └── restaurants.csv      # Raw restaurant metadata
├── pipeline.py              # ML training pipeline (reviewer scoring → classifier)
├── enrich_data.py           # Enrichment from raw Apify output
└── scrape_google_maps.py    # Apify scraper config
```
