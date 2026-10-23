# Locals: product requirements

**Status:** Living document that describes the product as it ships today. Plans live in [roadmap.md](roadmap.md); the design system lives in [DESIGN.md](DESIGN.md).
**Live at:** [locals-nyc.com](https://www.locals-nyc.com)
**Last updated:** 2026-10-23

---

## 1. Summary

Most food apps give you endless recommendations. Locals tells you where to go tonight.

Locals is a mobile-first web app for picking a restaurant in New York. **Help me pick** is the core experience. You set a few preferences, Locals builds a shortlist of six places that are open now and nearby, and a quick this-or-that narrows it to one, with directions one tap away. The shortlist comes from a ranking model that weighs reviews by whether the reviewer is actually a local. Users never have to read the model; it decides which six places they see.

## 2. Problem

Deciding where to eat in New York is slow, and the usual sources aren't trustworthy.

- **Ratings are anonymous.** A 4.5 on Google or Yelp blends locals with one-time visitors, and you can't tell whose opinion you're getting.
- **Social media rewards hype.** A place that went viral on TikTok can be good, or just good at going viral. "Overhyped" and "too expensive for what it was" are the most common regrets.
- **More recommendations don't help.** Friends' lists, saved bookmarks and "best of" articles all hand back a long list to sort through yourself, at the moment you're hungry and want to stop deciding.

**Hypothesis:** if you know who wrote each review, you can trust the ratings more. And if the app commits to a short, trustworthy shortlist instead of a feed, people will decide faster and go somewhere they're glad they went.

## 3. Users

| | Who | Job to be done |
|---|---|---|
| **Primary** | Young, food-curious New Yorkers, 0–5 years in the city (e.g. recent NYU grads). They use Beli, don't like repeating restaurants, and are tired of scrolling recs and forgotten bookmarks. | "Help me land on one place I haven't tried that's actually worth it, so I can stop deciding and go." |
| **Secondary** | Visitors to NYC. | "Show me where locals eat, not where a tourist list sends me." |

The decision moment is urgent: hungry now, or planning tonight. Almost all use is on a phone.

## 4. Goals, non-goals, and success metrics

**Goals**
1. Get someone from "where should we eat?" to a decision in under two minutes.
2. Send people to places they're glad they went to: worth it, not overhyped.
3. Earn trust by being open about how places are chosen.

**Non-goals (for now)**
- Choosing for the user with no input. People want some say in where they eat, so Locals narrows the options and the person makes the final choice.
- Reservations, delivery, or payments.
- Cities other than New York.
- A social feed. A follow graph exists, but social features are frozen while the core loop is proven.

**Success metrics**

| Metric | Definition | Source |
|---|---|---|
| **Pick-to-visit rate** (north star) | Of finished picks, the share where the person says they went | "Did you go?" answers in `/metrics` |
| Pick completion | Picks finished ÷ picks started | `pick_started`, `pick_completed` events |
| Hand-off rate | Finished picks where the person tapped "Let's go" (directions) | `result_action` events |
| Model quality | How well the ranking separates hand-labeled "worth it" places from the rest (AUC, cross-validated) | Offline evaluation, §6.3 |

Tracking shipped on 2026-10-21. There isn't enough traffic yet to report these numbers, so none are quoted here.

## 5. Product

### 5.1 Help me pick (`/pick`), the core flow

No account needed.

1. **Preferences.** Cuisines (any number), price ($–$$$$), how far you'll walk (default 2 mi; uses your location, rounded to about 100 m on the device), and, for signed-in users, "only places new to you", which leaves out places you've marked as visited.
2. **Shortlist.** Six places that are **open right now**, in model order.
   - The six are spread across the cuisines you chose. With no cuisine chosen, at most two share a cuisine.
   - If fewer than two places match, the radius widens step by step (0.5, 1, 2, 3, 5 mi), then the price filter is dropped. Open-now is never dropped. A notice says exactly what was loosened, and also when a cuisine you asked for has nothing open nearby.
3. **This or that.** Two places side by side, each with its photo, neighborhood, distance, price and a "Known for" or "The vibe" line drawn from reviews. The place you choose stays in, and the next contender comes in. Five rounds settle six places. "Just pick for me" skips straight to the top-ranked place.
4. **Result.** The winner fills the screen, tinted by its own photo. One primary action, **Let's go**, opens directions. Secondary actions: details, share, pick again, and a **Close second** you can swap to.
5. **Did you go?** 2 to 72 hours later, the home and pick pages ask about that pick: Went, Not yet, or Went elsewhere. Signed-in users who went can rate it.

### 5.2 Home (`/`)

A collage of real restaurant photos, the line "Let's eat.", a primary button into Help me pick, a secondary button into Browse, and a short list of places open right now.

### 5.3 Browse (`/recommendations`)

The full list in model order, as rows (photo, name, neighborhood, cuisine and price, rating). Search by name; filter by open now, near me, neighborhood, cuisine and price. A result count appears only when filters are on. Signed-in users with enough history get a **For you** toggle that re-sorts by their own saves and ratings.

### 5.4 Restaurant page (`/restaurant/[id]`)

Cover photo, neighborhood, cuisine and price, "Locals rate it 4.4", today's hours, and an open-now tag. **Get directions** is the primary action, with Save, Share and Call alongside. Below: the local take (how locals' rating compares with visitors'), then what to order, the vibe and a heads-up (e.g. long waits), all summarized from reviews, then hours and contact info, and more top places in the same neighborhood. A missing photo shows a gray placeholder, never a stock photo.

### 5.5 Accounts (Google sign-in)

Browsing, Help me pick and restaurant pages are open to everyone. Sign-in is asked for at the moment of an action that needs an identity.
- **Saved** and **Visited** lists, with a public shareable list per user (`/list/[userId]`, `/u/[username]`).
- **Ratings:** after a visit, you rank a place by comparing it with places you've already rated, rather than by giving it stars.
- **Onboarding:** cuisines, price, neighborhoods and places you already love, which seed the For you sort.
- **Profiles and follows:** follow other users, and see on Browse, Saved and Visited how many people you follow saved a place.

### 5.6 About (`/about`)

A plain-language explanation of how Locals picks, reached from the home page rather than the main nav.

## 6. How the ranking works

### 6.1 Who's a local

Every reviewer gets a localness score from 0 to 1, based on their last three years of reviews:
- **60%:** share of their reviews that are in New York
- **25%:** how steadily they review here over time, as opposed to one burst on a single trip
- **15%:** Google Local Guide status

### 6.2 Scoring each restaurant

Each place gets a local-weighted rating and a tourist-weighted rating from the same reviews, plus text signals (quality language, local versus tourist wording, "meh" language), the star spread, price, and review volume: 20 features in all. A random forest trained on **205 hand-labeled restaurants** turns those into a probability that a place is a safe pick for a local. Places at 0.5 or higher (414 of them) make the live list, ordered by that probability.

### 6.3 How it's evaluated

- The model is only graded on restaurants it didn't train on: 5-fold cross-validation, repeated 10 times with different shuffles (50 tests in total), so one lucky split can't flatter it.
- It ranks a labeled "worth it" place above one that isn't about **70%** of the time (AUC ~0.70). Sorting by Google stars alone gets 60%.
- The shipped model uses 2,000 trees so that retraining is stable: about 11 places move on or off the list between runs, down from about 60.
- **Removed:** distance from Times Square. It added nothing (−0.003 AUC) and pushed good Midtown places down.
- **Tested and not shipped:** an LLM as a second opinion. Claude read each labeled restaurant's reviews and rated it, three runs each, under two prompt wordings. It was consistent (88–97% identical answers across runs) but matched the labels at chance (AUC ~0.51) and added +0.005 to the model. Review text says whether reviewers enjoyed a meal; the model learns whose reviews to trust. The LLM writes the review summaries instead.

## 7. Measurement and privacy

- Help me pick sends four events, `pick_started`, `pick_completed`, `result_action` and `visit_answer`, to `/api/events`. The server validates each one and keeps only whitelisted fields.
- Events carry a random anonymous ID, never coordinates, names or other personal data. Adding `?notrack` to the URL opts a browser out, and localhost doesn't track by default.
- `/metrics` shows the funnel and recent picks to accounts listed in `METRICS_USER_IDS`; everyone else gets a 404.

## 8. Architecture and data

| Layer | Technology | Notes |
|---|---|---|
| Frontend | Next.js 16 (App Router), React 19, TypeScript, Tailwind v4 | Vercel |
| Restaurant API | FastAPI, pandas | Railway; serves `backend/data.csv` from memory. At 414 rows a database isn't needed. |
| User data | Supabase Postgres | Saves, visits, ratings, follows, profiles, `pick_events`. Written only from server routes. |
| Auth | Supabase Auth | Google sign-in |
| Photos | Supabase Storage | One permanently hosted photo per place |
| Model | scikit-learn, pandas | Trained offline; re-scoring is a manual pipeline run |
| Review summaries | Claude API | "What to order", vibe, and heads-up lines per place |

**Data:** public Google Maps listings and reviews, collected with Apify: about 78,000 reviews across about 2,100 New York restaurants, narrowed to the 414 on the live list.

## 9. Risks and open questions

- **The labels are one person's judgment.** The model learns what the founder considers worth it. Real "Did you go?" outcomes will be a fairer benchmark, and the model should be re-tested against them once a few dozen exist.
- **Few users so far.** No metric in §4 has enough volume to read yet. Getting the first 10–20 people through Help me pick comes first.
- **Third-party data.** All restaurant data comes from Google Maps listings. The long-term plan is to grow the localness signal from first-party ratings and visits.
- **Open-now accuracy** depends on listed hours, which can be stale.
- **Static data.** Re-scoring is a manual pipeline run, so the list changes only when someone runs it.

## 10. Key files

```
frontend/app/pick/page.tsx           Help me pick
frontend/app/page.tsx                Home
frontend/app/recommendations/        Browse
frontend/app/restaurant/[id]/        Restaurant page
frontend/app/metrics/page.tsx        Funnel dashboard
frontend/lib/track.ts                Event tracking and "Did you go?"
backend/main.py                      /api/pick, /api/recommendations, /api/restaurant/{id}
pipeline.py, run_pipeline.py         Reviewer scoring, features, model training
update_backend.py                    Pipeline output → backend/data.csv (keeps photos and summaries)
data/labels.csv                      The 205 hand labels
```
