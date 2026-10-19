---
version: 1
slug: "frontend-app-page-tsx"
primary_target: "frontend/app/page.tsx"
related_targets: ["frontend/app/pick/page.tsx","frontend/components/SiteHeader.tsx"]
---

## Scope
Homepage (Persuade) and Help me pick (Operate: questions, this-or-that, result), plus the shared header and a mobile tab bar. Audience: young, food-curious New Yorkers ~0-5 years in, deciding on a phone in the evening; recruiters (~30 seconds). Craft bar: Apple, The Infatuation/Eater, Linear/Figma/Arc. Must not feel themed/costume, corporate/fintech, or old-media magazine. Keep: the Help me pick flow and locked copy, light + dark first-class, real restaurant photos. Rejected: diner neon, orange/khaki ("Home Depot"), Matchup broadcast.

## Direction contract
THESIS: Locals as a native-feeling iOS app on the web, after the user-pinned reference Luma: a monochrome interface where color comes only from the food photos and small meaningful status tags. Refuses the beige card grid where every control is the same pill.
OWN-WORLD: White ground and near-black ink (dark: near-black ground, white actions). System font (SF on Apple), hierarchy by weight and gray, sentence case, no caps labels. Black pill primary, soft-gray pill secondary, small status tags (green open, purple still in). Feed as Luma rows: rounded square photo with a tag on its edge, name, icon meta lines; no card borders. Floating frosted tab bar on phones. Soft wide shadows only on floating things.
STORY: A visitor sees real NYC places floating around "Let's eat.", taps Help me pick, answers three questions, compares two photos at a time, and lands on a dark, photo-tinted "your pick" screen with what to order and Let's go.
FIRST VIEWPORT: Homepage centered: a collage of real restaurant photos (soft shadows, slight tilts) above "Let's eat." and the locked value-prop line, black pill Help me pick, gray pill Browse all places; below, an "Open right now" section of rows. Result screen: page ground tinted by the pick's blurred photo, rounded cover, name, tag row, white pill Let's go, a row of three soft action tiles.
FORM: User-pinned reference (Luma iOS: typography, color, layout), which supersedes the direction round (seed key e5f3a840; Matchup built and rejected). Signature interaction: the result screen's photo-tinted dark reveal. Motion grammar: iOS-like ease-out fades and lifts (200-280ms), nothing bouncy.
FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance

## Unresolved
Browse, restaurant, saved, visited and profile get tokens, buttons and the tab bar now; their own layouts (Browse as Luma rows) are a follow-up pass.
