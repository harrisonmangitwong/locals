# Monthly scraper request safeguards

The old 15-new-place limit applied only to details. Discovery submitted every
search term first (the current list has 68 terms, not 66), at 20 results each.
Deduplicating the returned dataset does not limit already submitted paid work.
The October 1 successful Actions job is not evidence of its actual charge.

The monthly job now bounds discovery input before calling Apify. Defaults:

| Environment variable | Default |
| --- | ---: |
| MAX_DISCOVERY_SEARCH_TERMS | 3 |
| MAX_DISCOVERY_PLACES_PER_SEARCH | 10 |
| MAX_DISCOVERY_RESULTS_PER_RUN | 30 |
| MAX_NEW_PLACES_PER_RUN | 5 |
| MAX_REVIEWS_PER_NEW_PLACE | 10 |

Edit the workflow environment to configure the scheduled job, or set environment
variables for local use. All values must be non-negative integers; invalid values
fail before any API call. Zero in any discovery/detail limit disables the job;
zero reviews allows details without reviews. The aggregate discovery ceiling is
enforced by selecting at most floor(total / per-search) terms, reducing the
per-search limit when total is smaller. Unused remainder is intentionally not
spent. Search subsets rotate by UTC calendar month; limited discovery means
incomplete coverage, and deferred places are not guaranteed to appear again.
New place IDs are sorted before the detail cap for reproducible selection.

These are request ceilings, **not a hard $5 monthly spend guarantee**. At the
user's illustrative $4/1,000 listing rate, 30 listings imply approximately $0.12
in listing charges alone. Verify current account-specific actor pricing, detail,
review, startup/minimum and platform charges, and whether actor-side limits are
honored. Check actual Apify run usage and invoices for October; no billing was
queried by this change. Also check the account billing-cycle dates and remaining
credit. Manual reruns, other actors, and the separate bulk scrape_google_maps.py
entry point consume the same account budget. The concurrency group serializes
this workflow but does not prevent repeated runs or enforce a billing ledger.
Use Apify account spending controls or disable the schedule if a strict dollar
ceiling is required. Do not infer actual cost from dataset rows or job success.

The schedule remains `0 13 1 * *` (13:00 UTC on each month's first day), and only
the three raw data files are committed. No scoring, backend update, or publishing
is added. The workflow runs offline regression tests before its paid scrape.
Run tests locally with:

```sh
python -m unittest discover -s tests -p 'test_scraper_budget.py'
```

Tests replace the API client with mocks and never submit Apify requests.
