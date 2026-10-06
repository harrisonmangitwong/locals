---
version: 1
slug: "frontend-app-page-tsx"
primary_target: "frontend/app/page.tsx"
related_targets: []
---

## Direction contract

THESIS: The landing page is a 24-hour NYC diner counter, not another boutique-editorial food app (the category rut this page already was). It owns "deciding where to eat, right now, like a regular" instead of "browsing a curated list."

OWN-WORLD: Diner-revival material system. Dark mode = night: near-black warm ground (#1a1310), glowing amber neon headline ("Let's eat."), a lit "Open · deciding now" status pill, orange (not red) outline-tube CTA, laminated overlapping proof cards, a faint checkerboard floor motif fading into the dark. Light mode = the same diner by day: warm sunlit counter ground, the same amber/orange hues as solid fills (no glow), same structure. Fredoka (headline, rounded/friendly-bold) + Space Grotesk (data/UI labels) + Inter (body). Color rationed: amber owns the headline/brand mark only, orange owns the one functional/status action (the CTA and the open-tag's live dot) -- never decorative elsewhere, never red (reads as an error state).

The "Open · deciding now" pill sits above the headline. This is a deliberate, disclosed exception to the craft floor's kicker/eyebrow ban: it was cut once already for that reason, then restored at the user's explicit request, on the judgment that it's a diegetic status badge (part of the diner-sign world, carrying real "decide right now" product meaning) rather than the generic decorative category label the ban targets. Kept to the hero's own two-color rule (neutral ink pill, orange dot only) rather than reintroducing a third color.

STORY: A visitor lands believing this app knows their city block-by-block like a regular, not a database. They see the real locals-vs-tourists rating gap on real NYC restaurants within the first viewport and click through to browse.

FIRST VIEWPORT: Full-bleed diner scene filling the viewport. "Open · deciding now" status pill, then "Let's eat." as the neon headline (glowing in dark, solid fill in light, deepened amber #96640d in light mode specifically for contrast). Subhead copy unchanged. Orange CTA "Browse the picks" (no arrow). Two real restaurant photos (Yopcity, Grandma's Dumpling House) as overlapping laminated menu cards, each with a local-favorite badge and the real locals/tourists rating line, fully revealed on hover (desktop) or scroll-into-view (touch, via the app's existing useScrollActive pattern, correctly scoped to `@media (hover: none)` so it doesn't fight real `:hover`). Footer stat line in tracked uppercase with a ticket-stub tear-line detail.

FORM: Diner Counter / 24-hour neon, candidate #1 of 7 grounded candidates (my top-ranked), assigned-index was #5 (Order Pad); user chose the pick card over the assigned direction, then iterated live: CTA color (red -> green/blue considered and rejected -> orange chosen), a finish-review fix batch (color-rationing leak, clipped card text, banned icon glyph, dark-mode contrast, flat ground, ticket materiality -- all resolved, verdict ship), a post-ship hover bug (in-view leaking onto desktop, fixed), and the open-tag restoration above. Seed key 51a36938.

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance. (Finish review already ran and scored ship on the fix batch; this later round -- hover-scope fix + open-tag restoration -- is a small enough follow-up that it was verified directly rather than re-routed through a fresh reviewer spawn.)
