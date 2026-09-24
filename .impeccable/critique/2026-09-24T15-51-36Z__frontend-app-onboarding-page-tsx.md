---
target: onboarding preferences page
total_score: 27
max_score: 40
na_heuristics: 
p0_count: 0
p1_count: 3
target_identity: "file:/Users/harrisonmwong/Desktop/locals/frontend/app/onboarding/page.tsx"
target_fingerprint: "sha256:d8476e0f12e5159555d50a12a678745c87f8e0eefb124a8d4e8ca5019037982d"
target_path: /Users/harrisonmwong/Desktop/locals/frontend/app/onboarding/page.tsx
timestamp: 2026-09-24T15-51-36Z
slug: frontend-app-onboarding-page-tsx
---
# Onboarding Preferences Page — Design Critique

**Method: dual-agent (A: ae1484cf9d14b0583 · B: a34915aeb55e0ea0c)**

Browser visualization was unavailable this session (no browser automation tool exposed) — Assessment A worked from source + a factual description of the screenshot shared; Assessment B ran the CLI detector only.

## Design Health Score

| # | Heuristic | Score | Key Issue |
|---|-----------|-------|-----------|
| 1 | Visibility of System Status | 2/4 | Price slider's default visual state misrepresents itself; Finish ends with zero acknowledgment |
| 2 | Match System / Real World | 4/4 | Real neighborhood names, plain "per person" framing, no internal jargon leaks into copy |
| 3 | User Control and Freedom | 3/4 | Skip always present; but no way back to "no preference" once the price slider is touched |
| 4 | Consistency and Standards | 3/4 | Chip styling is system-consistent; touch-target sizing is inconsistent within this one page |
| 5 | Error Prevention | 3/4 | Range-constrained slider, debounced search, toggle-only selections; slider default invites a false assumption |
| 6 | Recognition Rather Than Recall | 4/4 | Popular chips + typeahead everywhere; nothing to memorize |
| 7 | Flexibility and Efficiency | 2/4 | Popular-chip shortcuts exist; no power-user path beyond that |
| 8 | Aesthetic and Minimalist Design | 4/4 | Strongest heuristic — single column, no boxed containers, one solid-fill element on the page |
| 9 | Error Recovery | 1/4 | Every network call on this page swallows failures silently |
| 10 | Help and Documentation | 1/4 | One intro sentence is the entirety of contextual help |
| **Total** | | **27/40** | **Acceptable** (top of band) |

## Design Specificity Verdict

Mixed, leaning reskinned-generic. Token layer (color, type, radius) is genuinely Locals and DESIGN.md-compliant; option sets are computed from the real 407-restaurant dataset. But the shape/voice is interchangeable SaaS-onboarding skeleton, and "Photography first" survives in exactly one place (RestaurantPicker thumbnails) across an otherwise all-text/chrome page. Detector ran clean (0 findings, exit 0) across all 4 files -- no false positives to reconcile. No browser overlay available this session.

## Priority Issues

**[P1] Price slider's default state visually contradicts its own label** (confirmed against source)
- PriceSlider.tsx: `shown = value ?? 40` renders the track filled/thumb positioned at 40% even when `value === null`, while the label correctly says "No preference set."
- Fix: render an unfilled/neutral track when value is null. Command: /impeccable harden

**[P1] Every failure path on this page is silent** (confirmed)
- `/api/filters`, `/api/profile/preferences`, `/api/onboarding/complete` all swallow failures via empty catch blocks.
- Fix: keep the non-blocking redirect, add one inline failure notice. Command: /impeccable harden

**[P1] Two controls fall below the product's own 44px touch-target commitment** (confirmed)
- Header "Skip for now" has no padding/height class; neighborhood/restaurant remove-pills use py-1 (~24-28px).
- Fix: apply Chip.tsx's existing min-h-[44px] treatment to both. Command: /impeccable audit

**[P2] Cuisine expand/collapse (.filter-expand) missing from prefers-reduced-motion allowlist** (confirmed)
- globals.css lists .hours-body but not .filter-expand, despite PRODUCT.md's "app-wide" reduced-motion commitment.
- Fix: add .filter-expand/.filter-expand-inner to that selector list. Command: /impeccable harden

**[P3] Finish ends the flow with no acknowledgment**
- Silent redirect on success or failure alike; no closing moment for a "knowledgeable friend" brand voice.
- Fix: brief transitional message before redirect. Command: /impeccable onboard

## Persona Red Flags

**Jordan (Confused First-Timer)**: price slider's misleading default reads as "the system already picked something," no baseline to detect it's a bug.

**Casey (Distracted Mobile User)**: Skip is both out of thumb reach and undersized; state lives only in useState, lost on interruption with no warning.

**Maya -- "The Hungry-Now NYC Local"** (project-specific, from CLAUDE.md): four full preference sections stand between signup and her first recommendation, with no indication of how long this will take.

## Minor Observations

- Cuisine (8) and popular-neighborhood (10) default-visible chip counts both exceed the ≤4-per-decision-point guideline.
- Once touched, price slider's $0 is ambiguous (real filter vs. "no strong preference").
- RestaurantPicker's search dropdown has no keyboard arrow-key navigation.
- Secondary text contrast (~5.4:1) comfortably passes WCAG AA.

## Questions to Consider

1. Why configure four preference categories before the user sees a single recommendation, given the stated "hungry now" urgency?
2. What would this page sound like in the brand's actual stated voice vs. standard product-copy?
3. Could the data-driven specificity (real cuisine/neighborhood lists) extend into more visual/photographic treatment to match "Photography first"?
