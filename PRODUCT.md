# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

**Primary — NYC residents** deciding where to eat, especially somewhere unfamiliar: a part of their own city they haven't explored, not just a new city. They don't need to be told Google Maps and Yelp exist; they need a reason to trust a rating from a stranger with no track record and no stake in being right.

**Secondary — visitors to NYC** who want to eat where locals eat, not where a generic "best of" list sends them. The same underlying need (unfamiliar territory, no personal trust network there) as the primary user, just triggered by travel instead of an unexplored neighborhood.

**A third, co-equal audience — recruiters and hiring managers** evaluating this as a portfolio project (the README is explicitly written for this audience). This is not a lesser priority than the consumer product; both are genuinely live goals of the same codebase, confirmed directly rather than inferred.

## Product Purpose

Locals re-scores NYC restaurants by whether the people reviewing them are actually local residents or one-time visitors, instead of taking Google/Yelp star ratings at face value. It re-weights the same public review data everyone already has — no new data source — using signals about each reviewer (geographic concentration, review stability over time, Local Guide status) to produce a local-weighted rating, a tourist-weighted rating, and a trained classifier score that drives the main ranking order.

The problem this solves has two halves, and only one is built:
1. **Trust** — you can't tell if a reviewer is a real local with something at stake, and even a real reviewer's "4 stars" doesn't mean the same thing yours would. Locals vets the data itself against this. Shipped.
2. **Decision paralysis** — even good data still gets handed back as a list of dozens of options to work through yourself. Locals doesn't yet narrow the decision or replace browsing with an answer. Not built.

Success today means both halves eventually working, on a real (if still small) and growing user base, while the codebase itself continues to demonstrate real product and engineering judgment to the recruiter audience.

## Positioning

The mechanism: a per-reviewer localness score (0–1), combining geographic concentration of their reviews (60%), review stability over time vs. a single-trip burst (25%), and Google-verified Local Guide status (15%). This re-weights the same review pool into local-weighted and tourist-weighted ratings per restaurant, and a Random Forest classifier trained on 200 hand-labeled restaurants outputs the probability (`p_safe_pick`) that drives ranking, plus three quantile-based archetype tags (Hidden Gem, Universally Loved, Local Favorite).

The claim a neighboring product can't truthfully copy: Google, Yelp, and TripAdvisor have no incentive to build residency-inference into their own ranking — it would demote inventory they currently rank highly. Beli's friend-graph model solves trust well for the home occasion, but it structurally degrades the moment you're somewhere your friends aren't local to — which is exactly the away/travel occasion. Locals' residency-inference doesn't depend on a personal social graph, so it's the one asset that transfers cleanly from the home occasion to the away occasion. That transfer is the reason the roadmap treats the travel mode ("Trip Mode") as the actual differentiator against Beli, not a nice-to-have extension.

## Operating Context

- Single city today: NYC, 407 live restaurants across ~90 neighborhoods, drawn from a larger scraped pool (~2,055 restaurants) filtered by a review-count threshold and the classifier's confidence.
- Offline batch pipeline, not real-time: Apify scrape → Python scoring pipeline → CSV → manual copy into `backend/data.csv` → manual git push to deploy. A monthly automated job now discovers new restaurants, deliberately scoped to stop at the data files — it does not run the scoring pipeline or touch the live site automatically, and it's hard-budget-capped ($5/month Apify plan).
- Small, early live user base (roughly 8 signed-up users at last count). Growth is manual and organic at this stage (personal outreach, organic content posts), not paid.
- Auth: Google OAuth via Supabase. Core browsing (recommendations feed, restaurant detail pages, public shared lists, the saved/visited pages) is open to signed-out visitors; only actions tied to a personal identity (save, rate/visit, follow, submit a restaurant request) require an account, gated at the point of the action rather than the page.
- Stack (already answered by the codebase, recorded here only as context, not as a decision): Next.js (App Router, TypeScript, Tailwind) on Vercel; FastAPI/pandas on Railway, serving restaurant data from an in-memory CSV rather than a live database at this scale; Supabase (Postgres) for user data; scikit-learn trained offline.

## Capabilities and Constraints

**Confirmed and shipped:** reviewer localness scoring; local/tourist rating split; Random Forest ranking; three quantile-based archetype tags; a personalization toggle (needs 5+ combined saves/ratings before it appears); a follow graph with save-count surfacing on cards; a comparison-based (binary-search) personal ranking flow that replaced an earlier simple three-way reaction system; public shareable saved lists; a restaurant-request intake form; signed-out browsing with action-level sign-in gating.

**Explicitly not yet built, not to be assumed:**
- Trip Mode (the travel-occasion mode) — zero code exists. Scoped in the roadmap as the top-priority next differentiator.
- The decision-paralysis mechanism itself (a conversational/constraint-based query, or anything that narrows to one answer instead of a browsable list) — today's product is still a ranked, filterable list.
- A second city — the scoring methodology is city-agnostic in principle, but the code has NYC-only hardcoding (a Manhattan zip-to-neighborhood map, a single hardcoded tourist-landmark distance feature, NYC timezone for open-now logic) that isn't generalized yet.
- Monetization (booking-link affiliate revenue, a restaurant-facing locals-vs-tourists data product) — parked pending real traffic volume.
- Real-time or self-serve data updates — the batch pipeline is a deliberate choice at this scale (407 rows), not a gap to close soon.

**Terminology:** "localness score" (per reviewer, 0–1); "local-weighted rating" / "tourist-weighted rating" / "tourist_penalty" (per restaurant); "p_safe_pick" (the classifier's output, drives rank order); "archetype" (one of the three earned badges, or none — most restaurants earn no badge).

## Brand Commitments

Name: **Locals**. Live at locals-nyc.com. The name itself carries the product's core thesis, not just a label.

Tone commitment: warm, neighborhood, editorial authority (references: The Infatuation, Eater) — explicitly not corporate-sleek, not gamified, not in the visual or tonal mold of Yelp or TripAdvisor. Full visual-world detail (palette, type, component conventions) lives in `frontend/CLAUDE.md`'s Design Context, not duplicated here.

## Evidence on Hand

- Live dataset: `backend/data.csv`, 407 NYC restaurants, real Google Maps/Places data.
- Larger raw pool: `data/reviews.csv` (73,000+ scraped reviews), `data/restaurants.csv` (~2,055 scraped restaurants) behind the 407 that clear the pipeline's gates.
- 200 hand-labeled restaurants (`data/labels.csv`) used to train the Random Forest classifier.
- **Absence to not fabricate:** no usage analytics have actually been pulled at time of writing. Vercel Analytics is installed but unqueried. Do not invent engagement numbers, retention figures, or conversion rates — state "not yet measured" rather than a plausible-sounding guess.
- **Absence to not fabricate:** no completed user interviews yet. A short interview email was drafted this session for the existing signed-up users; sending and results are not yet confirmed.

## Product Principles

1. **Vet existing data, don't collect new data.** The trust mechanism re-weights the same public review corpus everyone already has. This is the defensibility argument: cheap to have started, structurally awkward for an incumbent to retrofit without undermining their own ranking incentives.
2. **Residents build the density; the away occasion is the actual wedge.** Home-occasion usage is bootstrap-critical — it's what generates the local-review density a neighborhood needs — but it must not quietly become the permanent priority. The travel occasion needs a real ship timeline, not perpetual deferral.
3. **A label must be backed by an inspectable rule.** Archetype tags, localness scores, and every trust signal shown to a user must be a real, recomputable rule against the live dataset — never shown just to have something to show.
4. **Fix retention leaks before chasing new growth surface.** With a small live user base and, historically, no re-engagement channel at all, cheap fixes that bring existing users back outrank heavier speculative builds.
5. **Automation expands data collection, not unreviewed production changes.** The monthly restaurant-discovery job is deliberately scoped to never auto-deploy to the live site and to stay within a hard-capped budget — a human still owns the step that puts anything in front of users.

## Accessibility & Inclusion

44px minimum touch targets, visible focus rings, a skip-to-content link, and `prefers-reduced-motion` disabling custom animation/transition/transform effects app-wide. No additional formal accessibility standard (e.g., a specific WCAG level) has been established as a requirement.
