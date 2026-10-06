---
version: 1
slug: "frontend-app-page-tsx"
primary_target: "frontend/app/page.tsx"
related_targets: []
---

## Direction contract

THESIS: The landing page is a 24-hour NYC diner counter, not another boutique-editorial food app (the category rut this page already was). It owns "deciding where to eat, right now, like a regular" instead of "browsing a curated list."

OWN-WORLD: Diner-revival material system. Dark mode = night: near-black warm ground (#1a1310), glowing amber neon headline ("Let's eat."), orange (not red) outline-tube CTA, laminated overlapping proof cards, a faint checkerboard floor motif fading into the dark. Light mode = the same diner by day: warm sunlit counter ground, the same amber/orange hues as solid fills (no glow), same structure. Fredoka (headline, rounded/friendly-bold) + Space Grotesk (data/UI labels) + Inter (body). Color rationed: amber owns the headline/brand mark only, orange owns the one functional CTA action — never the reverse, never decorative elsewhere. No kicker/eyebrow above the headline (craft-floor ban) — an earlier "OPEN · DECIDING NOW" tag was cut from the shipped build for this reason.

STORY: A visitor lands believing this app knows their city block-by-block like a regular, not a database. They see the real locals-vs-tourists rating gap on real NYC restaurants within the first viewport and click through to browse.

FIRST VIEWPORT: Full-bleed diner scene filling the viewport (not a short text block floating above dead page space). "Let's eat." as the neon headline (glowing in dark, solid fill in light, deepened amber #96640d in light mode specifically for contrast -- the direct --accent reuse measured 1.79:1 and was rejected). Subhead copy unchanged. Orange outline/solid CTA "Browse the picks" (no arrow). Two real restaurant photos (Yopcity, Grandma's Dumpling House) as overlapping laminated menu cards, each with a local-favorite badge and the real locals/tourists rating line, fluid width so they never overflow the mobile viewport. Footer stat line (73,000+ reviews / 2,000+ restaurants) in tracked uppercase.

FORM: Diner Counter / 24-hour neon, candidate #1 of 7 grounded candidates (my top-ranked), assigned-index was #5 (Order Pad); user chose the pick card over the assigned direction, then iterated the CTA color live (red -> green/blue considered and rejected -> orange chosen) before the build. Seed key 51a36938.

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance.
