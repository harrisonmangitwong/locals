---
name: Locals
description: Where to eat in NYC tonight, as a native-feeling iOS app on the web.
colors:
  ink: "#131517"
  ink-hover: "#2e3135"
  paper: "#f7f4ee"
  white: "#ffffff"
  soft-gray: "#eeeae2"
  soft-gray-pressed: "#e4dfd5"
  ink-secondary: "#66625b"
  ink-muted: "#69655d"
  hairline: "rgba(30,27,22,0.08)"
  hairline-strong: "rgba(19,21,23,0.16)"
  open-green: "#11703a"
  open-green-soft: "#e3f6e9"
  pick-purple: "#6b3fd4"
  pick-purple-soft: "#efe9ff"
  frost: "rgba(247,244,238,0.8)"
  scene-ground: "#0d0e0f"
typography:
  display:
    fontFamily: "-apple-system, BlinkMacSystemFont, SF Pro Text, system-ui, Segoe UI, Roboto, Helvetica Neue, Arial, sans-serif"
    fontSize: "clamp(46px, 8vw, 66px)"
    fontWeight: 700
    lineHeight: 1.08
    letterSpacing: "-0.022em"
  headline:
    fontFamily: "-apple-system, BlinkMacSystemFont, SF Pro Text, system-ui, Segoe UI, Roboto, Helvetica Neue, Arial, sans-serif"
    fontSize: "clamp(26px, 5vw, 44px)"
    fontWeight: 700
    lineHeight: 1.08
    letterSpacing: "-0.022em"
  title:
    fontFamily: "-apple-system, BlinkMacSystemFont, SF Pro Text, system-ui, Segoe UI, Roboto, Helvetica Neue, Arial, sans-serif"
    fontSize: "17px"
    fontWeight: 600
    lineHeight: 1.375
    letterSpacing: "-0.006em"
  body:
    fontFamily: "-apple-system, BlinkMacSystemFont, SF Pro Text, system-ui, Segoe UI, Roboto, Helvetica Neue, Arial, sans-serif"
    fontSize: "16px"
    fontWeight: 400
    lineHeight: 1.5
    letterSpacing: "-0.006em"
  meta:
    fontFamily: "-apple-system, BlinkMacSystemFont, SF Pro Text, system-ui, Segoe UI, Roboto, Helvetica Neue, Arial, sans-serif"
    fontSize: "13px"
    fontWeight: 400
    lineHeight: 1.375
    letterSpacing: "-0.006em"
  label:
    fontFamily: "-apple-system, BlinkMacSystemFont, SF Pro Text, system-ui, Segoe UI, Roboto, Helvetica Neue, Arial, sans-serif"
    fontSize: "11.5px"
    fontWeight: 600
    lineHeight: 1.45
    letterSpacing: "-0.006em"
rounded:
  tag: "6px"
  thumb: "12px"
  tile: "14px"
  photo: "18px"
  cover: "22px"
  pill: "9999px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "14px"
  lg: "24px"
  xl: "36px"
components:
  button-primary:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.white}"
    typography: "{typography.body}"
    rounded: "{rounded.pill}"
    padding: "0 32px"
    height: "50px"
  button-primary-hover:
    backgroundColor: "{colors.ink-hover}"
  button-secondary:
    backgroundColor: "{colors.soft-gray}"
    textColor: "{colors.ink}"
    rounded: "{rounded.pill}"
    padding: "0 32px"
    height: "50px"
  button-secondary-hover:
    backgroundColor: "{colors.soft-gray-pressed}"
  action-tile:
    backgroundColor: "{colors.soft-gray}"
    textColor: "{colors.ink}"
    rounded: "{rounded.tile}"
    height: "64px"
  chip:
    backgroundColor: "{colors.soft-gray}"
    textColor: "{colors.ink}"
    rounded: "{rounded.pill}"
    padding: "0 16px"
    height: "44px"
  chip-selected:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.white}"
    rounded: "{rounded.pill}"
  tag-open:
    backgroundColor: "{colors.open-green-soft}"
    textColor: "{colors.open-green}"
    typography: "{typography.label}"
    rounded: "{rounded.tag}"
    padding: "2px 7px"
  tag-pick:
    backgroundColor: "{colors.pick-purple-soft}"
    textColor: "{colors.pick-purple}"
    typography: "{typography.label}"
    rounded: "{rounded.tag}"
    padding: "2px 7px"
  tab-bar:
    backgroundColor: "{colors.frost}"
    rounded: "{rounded.pill}"
    padding: "4px"
  tab-item-active:
    backgroundColor: "{colors.soft-gray}"
    textColor: "{colors.ink}"
    rounded: "{rounded.pill}"
    padding: "7px 10px 6px"
  place-row-photo:
    rounded: "{rounded.thumb}"
    size: "76px"
  choice-card-hover:
    backgroundColor: "{colors.white}"
    rounded: "28px"
    padding: "10px 10px 14px"
---

# Design System: Locals

## Overview

**Creative North Star: "The Photo Is the Only Color"**

Locals reads as a native iOS app that happens to live on the web, after the user-pinned reference of Luma's iOS app. The interface itself is monochrome: a warm paper ground (softer than pure white next to food photos) with near-black ink in light mode, a near-black ground with white actions in dark mode. Everything that carries color has earned it. Food photographs supply nearly all of it; the rest comes from two small status tags, each of which means exactly one thing.

Hierarchy is built from weight and gray in the platform's own system face, never from a second typeface, caps labels, or decorative chrome. Places appear as rows: a rounded square photo with a tag on its edge, a name, and short icon meta lines, with no card box or border around them. Actions are pills: one black primary, soft-gray secondaries. Shadows exist only on things that float (the collage photos, the tab bar, a row or choice lifted into a card on hover).

The signature moment is the result of Help me pick: the page takes on the chosen restaurant's colors from its own blurred photo (a light wash in light mode, a dimmed dark scene in dark mode), with one pill to go and a row of soft action tiles. Motion follows iOS: things respond under the finger and the pointer, photos travel between screens, arrivals settle softly, and nothing bounces. On phones, scrolling does the work hover does on desktop.

**Key Characteristics:**
- Monochrome UI; color comes only from photos and meaning-bearing tags.
- System font (SF on Apple), hierarchy by weight and gray, sentence case throughout.
- Black primary pill, soft-gray secondary pill, soft-gray chips that flip to ink when selected.
- Place rows and choice cards without containers or borders.
- A photo-tinted result scene that follows the theme (light wash in light mode, dimmed dark in dark mode).
- A floating frosted tab bar on phones.

## Colors

A monochrome ink-on-paper system with two small, semantic color tags; the photographs do the rest.

### Primary
- **Ink** (`{colors.ink}`): body text, headings, and the primary action fill. In dark mode the roles invert: text is near-white (#f5f5f7) and the primary action is white (#ffffff) with ink text. Hover deepens to **Ink Hover** (`{colors.ink-hover}`; dark: #e4e4e7).

### Secondary
- **Open Green** (`{colors.open-green}` on `{colors.open-green-soft}`): only the "Open now" status tag. Dark mode: #5fd68a on #163322.

### Tertiary
- **Pick Purple** (`{colors.pick-purple}` on `{colors.pick-purple-soft}`): only "Still in" (the surviving contender in this-or-that) and "Your pick" on the result. Dark mode: #b89cff on #2a2140.

### Neutral
- **Paper** (`{colors.paper}`): page ground, a warm off-white chosen over pure white, which read as harsh next to the photos. Dark mode ground #101112.
- **White** (`{colors.white}`): card surfaces (a row lifted on hover) and text on the ink primary pill.
- **Soft Gray** (`{colors.soft-gray}`): secondary pills, chips at rest, action tiles, active tab, the select field, notices, row hover wash. Dark: #232427.
- **Soft Gray Pressed** (`{colors.soft-gray-pressed}`): hover state for every soft-gray control, photo placeholders, slider track. Dark: #2d2e32.
- **Ink Secondary** (`{colors.ink-secondary}`): meta lines, counts, the value-prop line, inactive tab labels. Dark: #a1a3a8.
- **Ink Muted** (`{colors.ink-muted}`): fine print (review-count line, "or" between choices, list numerals). Dark: #8e9096.
- **Hairline** (`{colors.hairline}`): the header's bottom rule, the footer's top rule, dividers between "What to order" items, the tab bar's edge. **Hairline Strong** (`{colors.hairline-strong}`) for hover borders on legacy controls.
- **Frost** (`{colors.frost}`): the tab bar's translucent fill (dark: rgba(30,31,34,0.72)).
- **Scene Ground** (`{colors.scene-ground}`): base of the result scene in dark mode, under the blurred photo. In light mode the scene keeps the paper ground, and its grays run darker (secondary #45413b, muted #4a463f) because they sit on a photo wash: measured 5.2:1 or better across sampled restaurants, where the page grays dropped to 3.1:1.

### Named Rules
**The Photo Is the Only Color Rule.** No accent hue exists for decoration, links, or emphasis. If something is colored and it is not a photograph, it is a status tag.

**The One Meaning Rule.** Green means open now. Purple means still in or your pick. Neither color is ever used for anything else, and no third tag color is added without a third meaning.

**The Inverted Action Rule.** The primary action is ink on light grounds and white on dark grounds (including the result scene in dark mode); it is never a hue.

## Typography

**Display Font:** the system face (SF Pro on Apple; -apple-system, BlinkMacSystemFont, system-ui, Segoe UI, Roboto fallbacks)
**Body Font:** the same system face

**Character:** One family, no web fonts. Display is the same face set heavier and tighter, so the product feels native rather than branded. The whole page carries a slight negative tracking (-0.006em).

### Hierarchy
- **Display** (700, 46px / 58px / 66px by breakpoint, 1.08, -0.022em): the homepage headline "Let's eat." only.
- **Headline** (700, 26 to 44px, 1.08, -0.022em): screen titles in Help me pick ("What sounds good?", "Which sounds better tonight?") and the result's restaurant name, balanced.
- **Section heading** (600, 21px, -0.015em): homepage section heads such as "Open right now".
- **Title** (600, 17px): in-flow section heads (Craving, Price, Your shortlist, What to order). Place names in rows are 600 at 16px; choice names 600 at 18 to 20px.
- **Body** (400, 15 to 17px, 1.5; long prose capped near 60ch): value-prop line, vibe and heads-up paragraphs.
- **Meta** (400, 13px, tabular numerals): icon meta lines under a place name, hints under the primary action.
- **Label** (600, 11 to 11.5px): status tags and tab-bar labels. Sentence case, never uppercase.

### Named Rules
**The Weight-and-Gray Rule.** Hierarchy comes from weight (400 / 600 / 700) and from ink versus secondary gray. No second typeface, no color for emphasis.

**The Sentence-Case Rule.** No uppercase labels, no tracked-out kickers or eyebrows above headings. A heading stands on its own.

## Layout

Mobile first, single column on phones, with content rails of 48rem (homepage rows, footer) and 64rem (Help me pick). Page gutters are 16px, 24px from 640px up. The homepage is centered: a collage box (230px tall on phones up to 440px on large screens) of six real restaurant photos placed at fixed percentages with slight tilts (-7 to 6 degrees), then the display headline, value-prop line, and the two pills (stacked full-width on phones, side by side from 640px). "Open right now" sits below as rows in one column, two from 640px.

Help me pick on desktop is a two-column grid: preferences on the left, a sticky 380px shortlist on the right. The this-or-that is two photos with a centered "or" between; the result is cover photo left (sticky), facts and actions right. On phones the primary action lives in a sticky bottom bar on the page ground; flows that own the bottom of the screen hide the tab bar.

Short screens (a phone in landscape, under 500px tall) get the same layout tightened rather than a different one: the homepage collage caps at a third of the screen with smaller photos so the headline and both pills stay above the fold, and sticky covers cap at the screen height minus the header. Where the pointer is coarse, the desktop nav pills grow to 44px; with a mouse they stay compact. Range sliders are a full 44px touch row with the 6px track drawn inside.

Rhythm: 4px base. Tags gap 4px, chips and pills 8 to 10px apart, rows use a 14px photo-to-text gap and 20 to 24px between rows, sections 32 to 36px apart. Touch targets are at least 44px; primary and secondary pills are 50px tall.

## Elevation & Depth

Flat by default. Depth is reserved for things that float above the page; rows, chips, pills and tiles have no shadow. Light-mode shadows are soft and wide; dark mode deepens their opacity and adds a 1px light ring to collage photos so edges don't melt into the ground.

### Shadow Vocabulary
- **Collage float** (`box-shadow: 0 16px 38px rgba(0,0,0,0.16)`; dark adds `0 0 0 1px rgba(255,255,255,0.08)` at 0.45 opacity): homepage photo tiles.
- **Tab bar float** (`box-shadow: 0 10px 34px rgba(0,0,0,0.14), 0 2px 6px rgba(0,0,0,0.06)`): the floating tab bar.
- **Lift** (`box-shadow: 0 12px 36px rgba(0,0,0,0.12)`, `--shadow-lg`; dark 0.5 opacity): a place row or this-or-that choice lifted into a white card on hover (or, on phones, at the middle of the screen while scrolling), with a 3px rise; also under the chosen choice's ring.
- **Cover** (`box-shadow: 0 24px 60px rgba(0,0,0,0.45)`): the result's cover photo over the scene.

### Named Rules
**The Only-Floating-Things Rule.** A shadow means the element floats over the page. Nothing resting in the flow gets one.

**The Native Material Rule.** The tab bar's frosted blur (saturate 180%, blur 20px) is iOS's own material, used there only. No other surface is translucent or blurred, except the result scene's backdrop photo.

## Shapes

Soft, continuous corners keyed to object size: 6px on tags, 12px on row thumbnails, 14px on action tiles, 18px on choice photos and collage tiles, 22px on the result cover. Every action, chip, and the tab bar is a full pill. Borders are almost absent: only the header and footer hairlines, the tab bar's edge, and list dividers. Photos are always clipped to their radius with a soft-gray placeholder behind them.

## Components

### Buttons
Quiet, large, and unmistakable: there is only one black pill on a screen.
- **Shape:** full pill (`{rounded.pill}`), 50px minimum height, 600 weight, 15 to 16px.
- **Primary:** ink fill, white text (white fill, ink text in dark mode). One per screen: Help me pick, Let's go.
- **Secondary:** soft-gray fill, ink text, no border (Browse all places, Just pick for me).
- **Hover / Active:** fill darkens one step (150ms ease-out); press scales to 0.98. Disabled primary drops to 35% opacity.
- **Compact (`.is-compact`):** 44px instead of 50px, for an action inside a list row (Accept on a follow request). Still a full touch target; never the page's primary.
- **Action tiles:** soft-gray 14px-radius tiles, 64px tall, a 19px icon over a 13px/600 label, in a row of three (Details, Share, Pick again). Press scales to 0.97.

### Chips
- **Style:** soft-gray pill, no border, 15px/500, 44px tall.
- **State:** selected flips to the primary ink fill with white text (inverted in dark). Used for cuisine, price, and either/or answers; an "Anything" chip is selected when nothing else is.

### Status Tags
- **Style:** small 6px-radius label (11.5px/600, 2px 7px padding), sitting on a photo's edge or in a tag row.
- **Variants:** Open (green) and Still in / Your pick (purple). On the dark-mode scene they become translucent dark fills with pale text (#8ff0b2 on rgba(10,40,22,0.62); #ddd0ff on rgba(34,22,64,0.62)).

### Place Row
The list unit for places. A 76px rounded-square photo with an optional tag overlapping its bottom edge, then the name (16px/600, up to two lines) and up to three icon meta lines (map pin: neighborhood and distance; utensils: cuisine and price; star: "Locals rate it 4.6"). No container, no border. When the row is a link, hover lifts it 3px into a white 16px-radius card with the large soft shadow and slowly zooms the photo; tap presses it to 0.985.

### This-or-That Choice
A whole choice is one button: a large 18px-radius photo (144px / 224px / 288px tall by breakpoint) with facts beneath it, including a "Known for" or "The vibe" line. No box at rest; on hover the whole choice lifts 3px into a white 28px-radius card with the Lift shadow and the photo zooms slightly, the same behavior as shortlist rows. The chosen choice keeps the card with a 2px ink ring; the passed one fades to 35% and scales to 0.97. The incoming contender fades up.

### Inputs / Fields
- **Search:** a soft-gray full pill, 44px, no border, a search icon inside on the left and a clear button on the right; focus deepens the fill one step.
- **Select:** soft-gray fill, no border, 12px radius, 15px text, 12px by 16px padding.
- **Slider:** 6px pill track in soft-gray-pressed with an ink fill, 20px ink thumb ringed in the ground color.
- **Focus:** a 2px ink outline offset 2px everywhere (4px on choice cards).

### Navigation
- **Header:** sticky, 56px, page ground with a hairline bottom rule. Wordmark "Locals" in 19px/700 system type. On desktop, text links in 14px pills: active is soft-gray with ink 600, inactive is secondary gray 500. Sign in is a quiet gray pill.
- **Tab bar (phones):** a floating frosted pill 14px above the safe area, centered, holding five tabs (Home, Pick, Browse, Saved, Visited). Each tab is a 20px Lucide-shaped icon over an 11px/600 label; the active tab gets a soft-gray pill and ink color with a heavier icon stroke (2.25 versus 1.9). The page gains bottom padding so the bar never covers content.

### Result Scene (signature)
The pick is revealed on a scene tinted by the restaurant's own photo, and the scene follows the theme rather than switching it. Light mode: the photo, blurred 60px, saturated 1.5x and brightened slightly at 70% opacity, sits behind a paper scrim (55% to 90% #f7f4ee, top to bottom), so ink text holds contrast and the page takes on the place's colors; soft grays become frosted white (62% / 86%). Dark mode: the photo is blurred 60px, saturated 1.7x and dimmed to 32% brightness behind a scrim from 25% to 60% black, and tokens re-map (ink becomes white, soft grays white at 12 to 18%). The tinted layer covers one screen plus 160px and fades out through a mask into the ground below; it is requested as a thumbnail, since it is blurred anyway. Over it in both: the 22px-radius cover photo, the name in Headline, icon meta lines, the purple and green tags, the Let's go pill, the three action tiles, then What to order, The vibe, Heads up, and a Close second row.

### Motion
Two curves. **Ease Out** (`--ease-out`, cubic-bezier(0.22, 1, 0.36, 1)) for state changes at 150 to 280ms: color fills, fades, presses. **Ease Settle** (`--ease-settle`, cubic-bezier(0.2, 0.9, 0.25, 1), fast start and a long soft settle with no overshoot) for arrivals and lifts at 320 to 900ms.
- **Press:** everything tappable gives under the finger: pills and rows 0.985 to 0.98, chips 0.95, action tiles 0.97, tabs 0.92.
- **Lift:** rows and choices rise 3px into a white card with the Lift shadow (320ms settle) while the photo slowly zooms (1.05 to 1.07 over 420 to 520ms).
- **Rise:** a short sequence of siblings (`.rise`, at most about seven) fades up 14px, 60ms apart, via `--i`.
- **Collage:** photos drop into their tilt one after another (70ms apart), then drift by depth with the pointer and with scroll.
- **Travel:** the restaurant photo carries its `view-transition-name` (`p-<restaurant_id>`) from shortlist to choice to result cover through the View Transitions API (460ms settle); everything without a partner fades out in 200ms or rises in.
- **Reduced motion:** state changes stay, movement goes: no transforms, view transitions, or staggered arrivals.
- Animations that share an element with `:hover` or `:active` transforms fill `backwards`, never `both`, so the end state never pins the transform.

### Touch: scroll stands in for hover
Phones have no hover, so scrolling drives the same responses. The homepage collage moves with page scroll by depth (nearer photos rise faster, the pile straightens over the first 600px). In row lists (Open right now, Your shortlist), the single row whose center is nearest the middle of the screen (within 22% of the viewport height) gets the hover treatment (white card, large soft shadow, 3px lift, photo zoom) via `.is-focus`, one row at a time.

### Scope Limits
Today the system is fully expressed on the homepage, Help me pick and the restaurant page (which reuses the result scene: tinted backdrop, sticky cover, one Get directions pill, Save / Share / Call tiles, then The local take, What to order, The vibe, Heads up, Hours and info, and More in the neighborhood as rows) and Browse (a sticky soft-pill search with a sideways-scrolling chip row, where many-valued filters are native selects dressed as chips that flip to ink when set; places as rows in two columns from 768px, each with quiet 44px save and been-here icon buttons; soft-pill pagination). Saved and Visited use the same rows (Visited adds your rank as a leading numeral and your score and tags under each row, grouped under its verdict); About is a single reading column with the scoring factors as a hairline-divided list. Profiles (public and your own) open with a centered header: a 96px avatar (a soft-gray disc with the initial when there is no photo), the name in display type, a quiet follower line, and the one action (Follow, or soft Public profile / Share); the public list below uses the rows, and your own page continues as a hairline settings list with inline editing. Onboarding (a sticky Finish bar on phones), sign-in (wordmark, value prop, Google's neutral pill) and follow requests (rows with a compact soft Accept and a quiet decline icon) are on the system too; every surface now is.

## Do's and Don'ts

### Do:
- **Do** let photographs carry the color; keep every control ink, white, or soft gray.
- **Do** use exactly one black (or, on dark grounds, white) primary pill per screen, 50px tall.
- **Do** use the green tag only for "Open now" and the purple tag only for "Still in" / "Your pick".
- **Do** show places as rows: 76px rounded photo, name, icon meta lines, no container.
- **Do** build hierarchy with the system face at 400 / 600 / 700 and ink versus secondary gray.
- **Do** use iOS-style ease-out (cubic-bezier(0.22, 1, 0.36, 1)) at 150 to 280ms for fades, lifts and presses, and drop them under reduced motion.
- **Do** keep touch targets at least 44px.

### Don't:
- **Don't** load a web font or introduce a second typeface; the system face is the brand.
- **Don't** put card boxes, borders, or resting shadows around rows or choices.
- **Don't** add an accent hue for links, emphasis, or decoration.
- **Don't** write uppercase labels, kickers, or eyebrows above headings.
- **Don't** use glass or blur anywhere except the phone tab bar and the result scene's photo backdrop.
- **Don't** use emoji or mixed icon sets; icons are the Lucide-shaped set at a shared stroke.
- **Don't** use bouncy or overshooting motion.
