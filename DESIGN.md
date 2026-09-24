---
name: Locals
description: Eat like a local. Not a tourist.
colors:
  sunbaked-terracotta: "#d95030"
  terracotta-hover: "#c44528"
  terracotta-soft: "rgba(217,80,48,0.08)"
  terracotta-text: "#c0451f"
  muted-gold: "#b8860b"
  muted-gold-soft: "rgba(184,134,11,0.08)"
  confirmation-green: "#2d8a56"
  confirmation-green-soft: "rgba(45,138,86,0.08)"
  warm-cream: "#faf8f5"
  card-white: "#ffffff"
  subtle-sand: "#f0ece7"
  inset-sand: "#e8e4de"
  ink: "#1a1814"
  ink-secondary: "#6b6560"
  ink-muted: "#6f6a64"
  hairline: "rgba(26,24,20,0.08)"
  hairline-strong: "rgba(26,24,20,0.15)"
typography:
  display:
    fontFamily: "DM Serif Display, Georgia, serif"
    fontSize: "clamp(1.5rem, 4vw, 2.25rem)"
    fontWeight: 400
    lineHeight: 1.15
    letterSpacing: "normal"
  body:
    fontFamily: "Plus Jakarta Sans, system-ui, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.5
    letterSpacing: "normal"
rounded:
  sm: "8px"
  md: "12px"
  lg: "16px"
  full: "9999px"
spacing:
  xs: "8px"
  sm: "12px"
  md: "16px"
  lg: "24px"
components:
  button-primary:
    backgroundColor: "{colors.sunbaked-terracotta}"
    textColor: "#ffffff"
    rounded: "{rounded.full}"
    padding: "12px 24px"
  button-primary-hover:
    backgroundColor: "{colors.terracotta-hover}"
  button-secondary:
    backgroundColor: "#ffffff"
    textColor: "#3c4043"
    rounded: "{rounded.full}"
    padding: "12px 16px"
  card-restaurant:
    backgroundColor: "{colors.card-white}"
    rounded: "{rounded.lg}"
---

# Design System: Locals

## Overview

**Creative North Star: "The Corner Table"**

Locals is built around the feeling of the seat a regular always gets at their neighborhood spot — warm, familiar, quietly earned rather than announced. The system leans editorial (The Infatuation, Eater) over platform-generic: photography carries the argument, type sets the tone, and chrome stays out of the way. Every trust signal on the page — an archetype badge, a localness bar, a "locals rate it 4.4 vs. tourists' 3.8" verdict — is treated as something that was earned through a real, inspectable rule, never applied as decoration.

The palette is warm and sun-worn (terracotta, cream, muted gold) rather than the cool, saturated primaries of a typical consumer-app template, and it explicitly rejects Yelp and TripAdvisor's registers: no gradient text, no glassmorphism, no badges that don't mean something specific. Depth is used sparingly and only in response to interaction — the interface is flat by default and only lifts when a person is actually engaging with it.

**Key Characteristics:**
- Photography-first card grid; the food photo is the hero, the UI frames it
- Warm, sun-worn palette (terracotta / cream / muted gold) instead of platform-generic primaries
- Serif display type (DM Serif Display) paired with a humanist sans body (Plus Jakarta Sans)
- Pill-shaped buttons and tags throughout; no sharp corners anywhere in the system
- Flat-at-rest surfaces that gain shadow and lift only on hover/interaction
- Every badge, score, and verdict traces back to a real computed rule, never decoration

## Colors

Warm and sun-worn — terracotta, cream, and a muted gold accent — deliberately outside the cool blues and saturated brand-primaries most consumer apps default to.

### Primary
- **Sunbaked Terracotta** (`#d95030`): the app's one true accent. Primary buttons, star ratings, active nav state, focus rings, the archetype-badge underline. Used sparingly and consistently — it is the only saturated color that appears on most screens.
- **Terracotta Hover** (`#c44528`): the pressed/hover state of the primary accent — always darker, never a different hue.
- **Terracotta Soft** (`rgba(217,80,48,0.08)`): a translucent wash of the accent, used behind focus rings and soft highlight states.

### Secondary
- **Muted Gold** (`#b8860b`): a second, quieter warm accent reserved for a specific meaning — score/weight breakdowns (e.g. the About page's "Most / Some / Minor" localness-signal explainer). Not used as a general-purpose accent; its rarity is what keeps it legible as "this number matters."

### Tertiary
- **Confirmation Green** (`#2d8a56`): the app's only non-warm hue, reserved entirely for positive confirmation states — the "Saved" pill, a completed action. Never used decoratively.

### Neutral
- **Warm Cream** (`#faf8f5`): the page background. Warm rather than clinical white — paper, not screen.
- **Card White** (`#ffffff`): card and elevated-surface background, distinct from the page itself.
- **Subtle Sand** (`#f0ece7`): inset/hover backgrounds for controls (filter chips, pagination at rest).
- **Inset Sand** (`#e8e4de`): the darkest neutral step, used for skeleton loading states.
- **Ink** (`#1a1814`): primary text. Warm near-black, not pure `#000`.
- **Ink Secondary** (`#6b6560`) / **Ink Muted** (`#6f6a64`): secondary text and metadata — two closely related warm grays rather than one flat gray.
- **Hairline** (`rgba(26,24,20,0.08)`) / **Hairline Strong** (`rgba(26,24,20,0.15)`): borders and dividers, translucent against the warm background rather than a flat gray line.

### Named Rules
**The One Accent Rule.** Sunbaked Terracotta is the only color allowed to mean "act here." Muted Gold and Confirmation Green each carry one narrow, specific meaning and never substitute for the primary accent.

**The Dark-Mode Warmth Rule.** Dark mode is not a desaturated inversion — every warm hue shifts brighter and slightly more saturated (`#d95030` → `#e06b4d`) to stay warm under low light rather than going cold and gray.

## Typography

**Display Font:** DM Serif Display (with Georgia, serif fallback)
**Body Font:** Plus Jakarta Sans (with system-ui, sans-serif fallback)

**Character:** An editorial pairing — a classic serif for moments that carry the brand's voice (page titles, the restaurant name on its detail page, "How was [restaurant]?") against a clean humanist sans for everything functional. The serif is never used for body copy or UI chrome; the sans never carries a headline.

### Hierarchy
- **Display** (400, `clamp(1.5rem, 4vw, 2.25rem)`, 1.15 line-height, DM Serif Display): page titles and restaurant names — `.font-display`, applied via `text-xl` through `text-4xl` depending on context.
- **Title** (600–700, 1.125–1.25rem): section headings, modal titles, card names.
- **Body** (400–500, 1rem, 1.5 line-height): descriptions, review text, form copy.
- **Label** (500–600, 0.75–0.875rem): nav links, buttons, metadata, badges — the workhorse size for most of the interface, since the app is dense with small pieces of trust signal (ratings, counts, tags).

### Named Rules
**The One Serif Moment Rule.** DM Serif Display appears only where the brand is speaking directly — a page title or a restaurant's own name — never in a button, a metadata line, or a form field. Its rarity is what keeps it feeling authored rather than decorative.

## Layout

Card-grid based: a responsive `grid-cols-1` → `md:grid-cols-2` → `lg:grid-cols-3` layout for restaurant listings, with a `max-w-7xl` centered container and consistent `px-4 sm:px-6` page gutters. Detail and content pages (About, restaurant detail body copy) narrow to `max-w-2xl`–`max-w-lg` for readability.

Density is generous, not dense: cards get real breathing room (`gap-6`), and internal card padding (`p-4`) keeps content from touching the photo edge. The header is sticky (`sticky top-0`) across every page, keeping navigation and the sign-in/account affordance reachable without re-orienting on scroll.

Mobile-first throughout — the primary use case is a phone screen while standing outside a restaurant deciding whether to go in. Non-essential nav items (About) hide below the `sm` breakpoint; touch targets hold a 44px minimum floor everywhere.

## Elevation & Depth

Flat by default; shadow is earned by interaction, not applied as ambient decoration. A restaurant card carries no shadow at rest in its default definition and gains `shadow-lg` plus a 4px lift only on hover — the same logic used for pagination buttons (a 1px lift) and the primary button (a shadow appears only on hover, and the button presses down 1px on `:active`). Nothing in the system uses a shadow simply to look "raised."

### Shadow Vocabulary
- **Ambient** (`0 1px 2px rgba(26,24,20,0.05)`): the quietest step; rarely used at rest.
- **Standard** (`0 2px 8px rgba(26,24,20,0.07)`): default resting elevation for cards and buttons that do carry some depth.
- **Lifted** (`0 8px 30px rgba(26,24,20,0.10)`): the hover/active state — modals, dropdowns, and a hovered restaurant card.

Dark mode keeps the same three-step vocabulary but shifts to pure-black shadows at roughly double the opacity (`0.15` / `0.20` / `0.30`), since a warm-tinted shadow reads as muddy on a dark surface.

### Named Rules
**The Earned Shadow Rule.** Shadow only appears in response to state — hover, focus, an open dropdown. A surface that shows the same shadow whether or not anyone is touching it is a mistake, not a stylistic choice.

## Shapes

Rounded throughout, never sharp: cards and photos use a 16px radius, modals and dropdowns 16px, inputs and smaller controls 8–12px, and every button, tag, and pill uses a full/9999px radius. No element in the system uses a 0px or 4px corner. Borders are 1px and translucent (the Hairline tokens) rather than a flat, opaque gray line — a border should feel like a soft edge in warm light, not a ruled line on paper.

### Named Rules
**The No Sharp Corners Rule.** Every rectangle in the interface is rounded at 8px or more; every action (button, tag, chip) is a full pill. A 0px-radius rectangle reads as a spreadsheet, not a neighborhood.

## Components

Restrained and earned, nothing decorative — buttons, cards, and inputs do their job in a single clear state change per interaction (color, lift, or scale, not several at once), and nothing carries a badge or highlight that isn't backed by a real, checkable fact.

### Buttons
- **Shape:** full pill (`rounded-full`, 9999px), 44px minimum height everywhere a button is tappable.
- **Primary** (`.cta-btn`): Sunbaked Terracotta fill, white text, `font-semibold`. Hover darkens to Terracotta Hover and gains the Standard shadow; active presses down 1px. This is the only button style with a persistent background fill.
- **Secondary (Google sign-in):** white background, 1px `#dadce0` border, `#3c4043` text — the one deliberate exception to the app's own palette, since it borrows Google's actual brand colors for recognizability rather than reskinning the sign-in action.
- **Icon buttons** (save/heart): circular, semi-transparent black backdrop over a photo (`rgba(0,0,0,0.45)`) when inactive, Sunbaked Terracotta fill when active; hover scales to 1.12, a short pop keyframe plays on save.
- **Ghost/text links:** no background; `hover:opacity-75` (or `-70`/`-80`/`-85`/`-90` by context) with a 150ms transition is the default link-hover treatment app-wide.

### Chips (archetype badges, filter pills)
- **Style:** small pill, `rounded-full`, colored background derived from the archetype's own token (never a generic gray), `text-xs font-medium`.
- **State:** tap-to-reveal pattern — a chip expands an explanatory line below it via a grid-rows transition (250ms) rather than a popover, so the explanation stays in-flow.

### Cards / Containers
- **Corner Style:** 16px radius.
- **Background:** Card White on Warm Cream page background — always a visible, if subtle, distinction from the page itself.
- **Shadow Strategy:** flat at rest, Lifted shadow + 4px translateY on hover (see Elevation & Depth).
- **Border:** 1px Hairline.
- **Internal Padding:** 16px (`p-4`), photo bleeds to the card edge above it.

### Inputs / Fields
- **Style:** Subtle Sand background, 1px Hairline border, 8–12px radius.
- **Focus:** border shifts to Sunbaked Terracotta plus a 3px Terracotta Soft glow (`box-shadow: 0 0 0 3px var(--accent-soft)`) — no default browser outline.

### Navigation
- **Style:** sticky header, Warm Cream background, 1px Hairline bottom border. Logo in Display type; nav links in Label size, `text-secondary` at rest, full Ink + `font-medium` for the current page — no underline or pill background marks the active state, weight and color alone carry it.
- **Signed-out state:** a compact, Google-branded "Sign up" pill appears after the nav links, using the same secondary-button treatment as the sign-in modal, so a visitor with no account still has a persistent, low-friction path in.
- **Mobile:** the About link hides below `sm`; everything else stays visible at reduced text size (`text-xs` → `text-sm`).

### Modal / Flow overlay (signature component)
Every modal in the system (the rating flow, the sign-in prompt, the account dropdown) shares one construction: a `fixed inset-0` semi-transparent black backdrop (`rgba(0,0,0,0.5)`), a centered card using the Lifted shadow and 16px radius, rendered through a React portal into `document.body` so it's never clipped or mis-positioned by an animated ancestor. Entrance is a single authored keyframe (`menu-drop`: fade + slight scale-up from 0.97, 150ms) — no separate per-modal animation choices. Dismissal is backdrop click or Escape, consistently.

## Do's and Don'ts

### Do:
- **Do** keep the photo as the largest, first thing a person sees on any card or detail page — UI elements frame it, they never sit on top of it in a way that obscures it.
- **Do** use the full pill radius (9999px) for every button, tag, and badge; use 8–16px for every rectangular container.
- **Do** let shadow and lift communicate interactivity — apply the Lifted shadow only on hover/active states, never at rest.
- **Do** back every badge, score, or "verdict" sentence with a real, recomputable rule against the live dataset.
- **Do** respect `prefers-reduced-motion` by disabling transform/transition/animation app-wide, not just the large ones.

### Don't:
- **Don't** use gradient text for emphasis — weight and size carry emphasis in this system.
- **Don't** add glassmorphism or blur-as-decoration; the one backdrop blur in the system (`backdrop-filter: blur(4px)` on photo-overlay badges) exists to keep small white text legible over a busy photo, not for atmosphere.
- **Don't** introduce a second saturated accent color for a new feature — Muted Gold and Confirmation Green are already spoken for; a new meaning gets a new usage of Sunbaked Terracotta or a neutral, not a third hue.
- **Don't** use bounce or elastic easing on any transition; every authored motion in this system decelerates confidently (`cubic-bezier(0.16, 1, 0.3, 1)` for interaction feedback, `cubic-bezier(0.25, 1, 0.5, 1)` for entrances) and never overshoots.
- **Don't** show an archetype badge, "verified," or trust indicator that isn't backed by an inspectable rule — an empty state (no badge at all) is correct and expected for most restaurants.
