---
target: homepage / landing page
total_score: 24
max_score: 32
na_heuristics: 7,10
p0_count: 1
p1_count: 2
target_identity: "file:/Users/harrisonmwong/Desktop/locals/frontend/app/page.tsx"
target_fingerprint: "sha256:5d47c78f31776137f0cd669e98a274aee5a6698e2e15255f289039307f4ef117"
target_path: /Users/harrisonmwong/Desktop/locals/frontend/app/page.tsx
timestamp: 2026-09-28T23-09-41Z
slug: frontend-app-page-tsx
---
# Locals Homepage — Design Critique

**Method: dual-agent (A: a74196e38440cdb2c · B: a9e6f412ca5f20bd1)**

No browser automation tool available this session -- Assessment A worked from source + screenshot description; Assessment B ran CLI detector only.

## Design Health Score (24/32, Good/75% -- heuristics 7 and 10 marked n/a as genuinely inapplicable to a single-action Persuade landing page)

| # | Heuristic | Score | Key Issue |
|---|-----------|-------|-----------|
| 1 | Visibility of System Status | 2/4 | No loading feedback on click-through to /recommendations (confirmed: no loading.tsx exists) |
| 2 | Match System / Real World | 4/4 | Pitch-perfect vernacular, zero jargon |
| 3 | User Control and Freedom | 3/4 | Persistent nav, no dead ends |
| 4 | Consistency and Standards | 3/4 | Correct tokens, but composition previews none of the product's card-grid/photography identity |
| 5 | Error Prevention | 3/4 | Low bar cleared by simplicity |
| 6 | Recognition Rather Than Recall | 3/4 | Actual differentiator (localness scoring) never appears |
| 7 | Flexibility and Efficiency | n/a | Single-visit, single-action surface |
| 8 | Aesthetic and Minimalist Design | 3/4 | Minimalism removed evidence, not chrome |
| 9 | Error Recovery | 3/4 | No error states exist to fail at |
| 10 | Help and Documentation | n/a | Pre-product-entry landing surface |

## Design Specificity Verdict

Category-interchangeable structurally (generic centered-hero pattern); only copy and color/type tokens are Locals-specific. Zero photography anywhere on the page directly contradicts DESIGN.md's #1 stated principle ("photography carries the argument... the food photo is the hero") and CLAUDE.md's Design Principle #1 ("Photography first"). Detector scan clean (0 findings, exit 0) across page.tsx and SiteHeader.tsx -- this is a composition/judgment gap the mechanical scan can't catch, not a rule violation.

## Priority Issues

**[P0] Zero photography on a "photography-first" product** -- the first screen every visitor and recruiter sees contradicts the product's own stated visual identity. Fix: add at least one real restaurant/dish photo. Command: /impeccable shape

**[P1] No trust evidence before the ask** -- states the trust claim, shows no mechanism/example. Fix: surface one concrete inspectable proof point (real example verdict) instead of just a review count. Command: /impeccable clarify

**[P1] Unexplained empty space below the fold** -- reads as unfinished for the recruiter audience specifically. Fix: anchor hero intentionally or fill with trust evidence. Command: /impeccable layout

**[P2] No loading feedback on the one meaningful action** (confirmed: no app/recommendations/loading.tsx). Command: /impeccable optimize

**[P3] Sign-in affordance competes with primary CTA with no context.** Command: /impeccable distill

## Persona Red Flags

Jordan (Confused First-Timer): no answer to "how does this know who's local?"; About nav link hidden on mobile (confirmed: hidden sm:inline in SiteHeader.tsx), so no explainer reachable from this screen on phone.

NYC Resident deciding tonight (project-specific): reads "48,000+ reviews" with suspicion -- same corpus Google shows; the actual differentiator (residency-inference) never stated plainly enough to beat default skepticism.

Recruiter/Hiring Manager (project-specific): opens homepage having read DESIGN.md's photography-first north star; zero imagery is the clearest signal of doc/product drift, visible on the first screen.

## Minor Observations

- Subhead repeats the H1's tourist-vs-local point rather than layering in a second value prop.
- SiteHeader is client-gated on useCurrentUser(), could briefly flash sign-up pill on slow connections.
- Skip-nav/#main-content wiring is correctly connected end-to-end (verified) -- a genuine strength, easy to get wrong.

## Questions to Consider

1. What does this hero look like with one real dish photo instead of a flat field?
2. Why doesn't the residency-inference differentiator appear anywhere in the homepage copy?
3. Would this page's structure change at all with the headline nouns swapped for a different product?
