# Locals roadmap

*Rewritten 2026-10-23. Replaces the August–September roadmap, which led with a digest email and Trip Mode. Since then the product narrowed to one job, "tell me where to go tonight," with Help me pick as the core experience, so the order below follows that.*

**North star:** pick-to-visit rate. Of the people Help me pick sends somewhere, how many actually go (from the "Did you go?" answers on `/metrics`).

## Done recently

- **Redesign.** Every page is on the Luma-style system in `DESIGN.md`. Design audit went from 15/20 to 19/20.
- **Tracking.** Help me pick logs each step to `pick_events`; "Did you go?" asks 2–72 hours after a pick; `/metrics` shows the funnel.
- **Model.**
  - Dropped the Times Square distance feature: it added nothing (−0.003 AUC) and nudged Midtown places down.
  - Trained on all 205 labels with 2,000 trees, so a retrain reshuffles about 11 places instead of about 60.
  - Repeated cross-validation AUC is about 0.70, against 0.60 for Google stars.
- **LLM second opinion: tested, not shipped.** It was consistent across runs but matched the labels at about 0.51 and added +0.005 to the forest. The LLM stays on review summaries.
- **Photos.** All 414 places have permanently hosted photos. `update_backend.py` carries them (and summaries) over on every re-score. A missing photo now shows a gray placeholder, never a stock photo.

## Now: first 10–20 real users

- Send the Help me pick link (no account needed) to friends and NYU people, with one ask: use it the next time you're deciding where to eat.
- Watch `/metrics`: picks started, picks finished, "went" answers.
- Talk to 5 of them for 10 minutes each. What did they pick, did they go, was it worth it, what almost stopped them?
- Write down what you learn. Real numbers and quotes are what interviews will ask about.

## Next

- **Saved-places mode.** Help me pick chooses among places you've already saved. Goes after the forgotten-bookmarks pain directly.
- **Re-test the model against real visits** once a few dozen "Did you go?" answers exist. Real outcomes are a fairer benchmark than one person's labels, for the forest or any future LLM.
- **Relabel the disagreements.** About 20 places where the forest and the LLM disagreed; a second look checks the labels themselves.

## Later

- **MCP server.** Locals as a tool inside AI assistants. Deferred until the data sourcing question below is settled.
- **First-party data.** Grow the localness signal from users' own ratings and visits, and stop relying on new scrapes.
- **Trip Mode.** The visitor use case. Still the long-term differentiator against friend-graph apps, but it depends on resident usage existing first.
- **Second city.** The method is city-agnostic; the code still has an NYC zip map and the NYC timezone hard-coded.

## Parked

- Weekly digest email, push notifications, referral loop: retention tools that only matter once there are users to retain.
- Monetization (booking links, a restaurant-facing data product): parked until there's real traffic.
- Moving `backend/data.csv` into Postgres: not needed at 414 rows.
- Agents that choose for the user: rejected. People want some agency in where they eat.
