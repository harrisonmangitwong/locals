---
name: Locals
description: Eat like a local. Not a tourist.
colors:
  warm-amber: "#c98a1f"
  amber-hover: "#ab7319"
  amber-soft: "rgba(201,138,31,0.12)"
  amber-text: "#9c6c17"
  cta-olive: "#55503a"
  cta-olive-hover: "#413d2c"
  cta-ink: "#f3ece0"
  confirmation-green: "#2d8a56"
  bg-warm: "#f7f1e5"
  bg-card: "#fffdf8"
  bg-subtle: "#efe6d3"
  bg-inset: "#e6dabf"
  ink: "#241f18"
  ink-secondary: "#5c5346"
  ink-muted: "#746a5a"
  hairline: "rgba(36,31,24,0.1)"
  hairline-strong: "rgba(36,31,24,0.18)"
typography:
  display:
    fontFamily: "Bricolage Grotesque, system-ui, sans-serif"
    fontSize: "1.875rem"
    fontWeight: 800
    lineHeight: 1.1
    letterSpacing: "-0.01em"
  body:
    fontFamily: "Plus Jakarta Sans, system-ui, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.5
    letterSpacing: "normal"
rounded:
  sm: "8px"
  md: "10px"
  lg: "16px"
  xl: "16px"
  full: "9999px"
spacing:
  xs: "8px"
  sm: "12px"
  md: "16px"
  lg: "24px"
components:
  button-primary:
    backgroundColor: "{colors.cta-olive}"
    textColor: "{colors.cta-ink}"
    rounded: "{rounded.full}"
    padding: "0 24px"
  button-primary-hover:
    backgroundColor: "{colors.cta-olive-hover}"
  filter-pill-active:
    backgroundColor: "{colors.warm-amber}"
    textColor: "#241f18"
    rounded: "{rounded.full}"
  card-restaurant:
    backgroundColor: "{colors.bg-card}"
    rounded: "{rounded.lg}"
---

# Design System: Locals

## Overview

**Creative North Star: "The Corner Table"**

Locals is built around the feeling of the seat a regular always gets at their neighborhood spot — warm, familiar, quietly earned rather than announced. The system leans editorial (The Infatuation, Eater) over platform-generic: photography carries the argument, type sets the tone, and chrome stays out of the way. Every trust signal on the page — an archetype badge, a localness bar, a "locals rate it 4.4 vs. tourists' 3.8" verdict — is treated as something earned through a real, inspectable rule, never applied as decoration.

The site-wide palette is warm amber-and-cream, with a separate, deliberately muted olive reserved for the one primary call-to-action — a correction from an earlier bright-accent CTA that read as a pop-up ad. It explicitly rejects Yelp/TripAdvisor registers: no gradient text, no glassmorphism, no badges that don't mean something specific. Depth is used sparingly and only in response to interaction — flat by default, lifting only when someone is actually engaging with it.

One surface breaks from this system on purpose: the homepage hero runs its own "24-hour diner counter" visual world, documented separately below as a scoped exception, not a system-wide change.

**Key Characteristics:**
- Photography-first card grid; the food photo is the hero, the UI frames it
- Warm amber/cream site-wide palette, with a distinct muted-olive CTA color reserved for the one primary action
- Bricolage Grotesque (display, 700/800) paired with Plus Jakarta Sans (body) — a bold geometric sans pairing, not a serif
- Shape language is mixed, not absolute: full pills for buttons, tags, and avatars; rounded-xl/2xl rectangles for cards and modals — both are native to the system
- Flat-at-rest surfaces that gain shadow and lift only on hover/interaction
- Every badge, score, and verdict traces back to a real computed rule, never decoration

## Colors

Warm amber-and-cream site-wide, with one quiet olive reserved for the single functional call-to-action.

### Primary
- **Warm Amber** (`#c98a1f`): the app's one true accent. Active filter-pill fill, star ratings, focus rings, link-focus outline, price-slider fill. Used sparingly and consistently — the only saturated warm hue that appears on most screens.
- **Amber Hover** (`#ab7319`): the pressed/hover state of the primary accent.
- **Amber Soft** (`rgba(201,138,31,0.12)`): a translucent wash behind focus rings and the search-input focus glow.

### Secondary
- **CTA Olive** (`#55503a`): a dedicated, distinct color for the primary call-to-action button, deliberately *not* the amber accent. A gradient-plus-shadow-at-rest version of this button was tried and read as a pop-up-ad "Claim Now" button rather than an app CTA, so it was corrected to flat olive with a fixed light-cream text color, earning its shadow only on hover.

### Tertiary
- **Confirmation Green** (`#2d8a56`): the app's only non-warm hue, reserved entirely for positive confirmation states — the "Saved" pill, a completed action. Never used decoratively.

### Neutral
- **Warm Background** (`#f7f1e5`): the page background. Warm rather than clinical white.
- **Card Background** (`#fffdf8`): card and elevated-surface background, distinct from the page itself.
- **Subtle Sand** (`#efe6d3`) / **Inset Sand** (`#e6dabf`): inset/hover backgrounds for controls (filter pills, pagination, skeleton loading).
- **Ink** (`#241f18`): primary text. Warm near-black, not pure `#000`.
- **Ink Secondary** (`#5c5346`) / **Ink Muted** (`#746a5a`): secondary text and metadata.
- **Hairline** (`rgba(36,31,24,0.1)`) / **Hairline Strong** (`rgba(36,31,24,0.18)`): borders and dividers, translucent against the warm background.

### Named Rules
**The CTA-Is-Not-The-Accent Rule.** The primary call-to-action button uses its own dedicated olive, never the amber accent color — the two are visually and semantically distinct roles (amber = "this is active/notable," olive = "take this one action"), confirmed by the code's own comment after an earlier bright-amber CTA was rejected.

**The Dark-Mode Warmth Rule.** Dark mode is not a desaturated inversion — every warm hue shifts brighter and more saturated (amber `#c98a1f` → `#e0a73a`) to stay warm under low light rather than going cold and gray.

## Typography

**Display Font:** Bricolage Grotesque (weights 700/800, with system-ui, sans-serif fallback)
**Body Font:** Plus Jakarta Sans (with system-ui, sans-serif fallback)

**Character:** A bold geometric-sans pairing — Bricolage Grotesque's heavier weights carry headlines and page titles with confident weight rather than editorial serif flourish; Plus Jakarta Sans handles everything functional. The display face is never used for body copy or UI chrome.

### Hierarchy
- **Display** (800, 1.1 line-height, -0.01em tracking, `.font-display`): page titles, section headlines, and status headlines for empty/error states. Sized per context.
- **Title** (600–700, ~1rem–1.25rem): card names, modal titles, section headings.
- **Body** (400–500, 1rem, 1.5 line-height): descriptions, review text, form copy.
- **Label** (500–600, 0.75–0.875rem): nav links, buttons, metadata, badges — the workhorse size for the dense trust-signal UI (ratings, counts, tags).

### Named Rules
**The Display-Is-Rare Rule.** `.font-display` (Bricolage Grotesque, 800 weight) is reserved for a page's own headline moment — it does not appear in buttons, metadata, form fields, or routine section labels, which stay in Label/Body weight.

## Layout

Card-grid based: a responsive `grid-cols-1` → `md:grid-cols-2` → `lg:grid-cols-3` layout for restaurant listings, with a centered container and consistent page gutters. Density is generous, not dense: cards get real breathing room, internal card padding keeps content off the photo edge. The header is sticky across every page.

Mobile-first throughout — the primary use case is a phone screen while deciding whether to go in. Touch targets hold a 44px minimum floor everywhere (`.cta-btn`, heart buttons, pagination).

## Elevation & Depth

Flat by default; shadow is earned by interaction, not applied as ambient decoration. A restaurant card carries no shadow at rest and gains `--shadow-card-hover` plus a 4px lift only on hover (or, on touch devices, on scroll-into-view via `.in-view` / native `animation-timeline: view()` where supported) — the same logic used for pagination buttons (1px lift) and the primary CTA button (shadow + lift only on hover, press-down on `:active`).

### Shadow Vocabulary
- **Small** (`--shadow-sm`, `0 1px 2px rgba(36,31,24,0.06)`): quietest step, rarely used alone.
- **Standard** (`--shadow`, `0 2px 8px rgba(36,31,24,0.09)`): default depth for buttons and surfaces that do carry some rest-state shadow (price-slider thumb).
- **Lifted** (`--shadow-lg`, `0 8px 30px rgba(36,31,24,0.14)`): modals, dropdowns.
- **Card Hover** (`--shadow-card-hover`, `0 20px 48px rgba(36,31,24,0.22)`): the hovered/in-view restaurant card specifically — deeper than the generic Lifted step.

Dark mode keeps the same shadow roles but shifts to pure-black shadows at higher opacity (`0.15`–`0.45`), since a warm-tinted shadow reads as muddy on a dark surface.

### Named Rules
**The Earned Shadow Rule.** Shadow only appears in response to state — hover, scroll-into-view, an open dropdown. A surface that shows `--shadow-card-hover` or `--shadow-lg` whether or not anyone is touching it is a mistake, not a stylistic choice.

## Shapes

Mixed, not absolute: the system uses both full pills and rounded rectangles natively, by component role rather than one universal radius. Buttons, tags, avatars, and the "Saved"/badge pills use a full 9999px radius (`rounded-full`, 80+ occurrences across the codebase). Cards use 16px (`rounded-xl`/`rounded-2xl`); modals use 16px (`rounded-2xl`); inputs and smaller controls use 8–12px (`rounded-lg`). Borders are 1px and translucent (the Hairline tokens).

### Named Rules
**The Role-Based Radius Rule.** Radius is assigned by what a shape *is*, not by one blanket invariant: an action a person taps (button, tag, chip, avatar) is a full pill; a container that holds content (card, modal, input) is a rounded rectangle at 8–16px. Neither form is more "correct" — both are native to the shipped system, and a surface should not be forced into a pill just because another component is one.

## Components

Restrained and earned — buttons, cards, and inputs do a single clear state change per interaction, and nothing carries a badge or highlight that isn't backed by a real, checkable fact.

### Buttons
- **Shape:** full pill (`rounded-full`, 9999px), 44px minimum height everywhere tappable.
- **Primary CTA** (`.cta-btn`): CTA Olive fill, fixed light-cream text, `font-semibold`. Flat at rest; hover darkens to Olive Hover, gains the Standard shadow, and lifts/scales slightly (`translateY(-1px) scale(1.03)`); active presses down. Colors live in the class, not inline style, since an inline `backgroundColor` would otherwise beat the class-based hover rule.
- **Filter pill** (`.filter-pill`, toggle-style, e.g. "All restaurants" / "For You"): active state fills with Warm Amber and dark ink text; inactive state sits on Subtle Sand with a hairline border and darkens to Inset Sand on hover.
- **Secondary (Google sign-in):** white background, 1px `#dadce0` border, `#3c4043` text — the one deliberate exception to the app's own palette, borrowing Google's actual brand colors for recognizability.
- **Icon buttons** (save/heart): circular; hover scales to 1.12, a short pop keyframe plays on save, active scales down.
- **Ghost/text links:** no background; opacity-based hover (150ms) is the default link-hover treatment app-wide.

### Chips
- **Style:** small pill, `rounded-full`, colored background derived from the chip's own meaning (never a generic gray), `text-xs font-medium`.
- **Collapse pattern:** `.chip-collapse` keeps all chips in one continuous flex-wrap flow and truncates by max-height (not item count) with a 300ms transition, so wrapping never orphans a chip alone on its row.

### Cards / Containers
- **Corner Style:** 16px radius (`rounded-xl`/`rounded-2xl`).
- **Background:** Card Background on Warm Background page background — always a visible, if subtle, distinction from the page itself.
- **Shadow Strategy:** flat at rest, `--shadow-card-hover` + 4px translateY on hover/in-view (see Elevation & Depth); the photo inside scales 1.03 in sync.
- **Border:** 1px Hairline.

### Inputs / Fields
- **Style:** Subtle Sand background, 1px Hairline border, 8–12px radius.
- **Focus:** border shifts to Warm Amber plus a 3px Amber Soft glow — no default browser outline.

### Navigation
- **Style:** sticky header, Warm Background, 1px Hairline bottom border. Nav links in Label size, secondary-ink at rest, full ink + `font-medium` for the current page — no underline or pill background marks the active state, weight and color alone carry it.

### Modal / Flow overlay (signature component)
Every modal in the system (the rating flow, sign-in prompt, Find People, Follow List) shares one construction: a `fixed inset-0` semi-transparent black backdrop, a centered card at 16px radius (`rounded-2xl`), rendered through a React portal (`createPortal`) into `document.body` so it's never clipped by an animated ancestor. Entrance is a single authored keyframe (`.menu-drop`: fade + slight scale-up from 0.97, 150ms) shared across every modal — no per-modal animation choices.

## Do's and Don'ts

### Do:
- **Do** keep the photo as the largest, first thing a person sees on any card or detail page.
- **Do** use the full pill radius (9999px) for buttons, tags, chips, and avatars; use 8–16px for rectangular containers (cards, modals, inputs) — both are native, pick by component role, not by a single rule.
- **Do** let shadow and lift communicate interactivity — apply `--shadow-card-hover`/`--shadow-lg` only on hover/active/in-view states, never at rest.
- **Do** back every badge, score, or "verdict" sentence with a real, recomputable rule against the live dataset.
- **Do** respect `prefers-reduced-motion` by disabling transform/transition/animation app-wide.
- **Do** keep the primary CTA's color (olive) distinct from the amber accent used everywhere else — they are different semantic roles, not interchangeable warm tones.

### Don't:
- **Don't** use gradient text for emphasis — weight and size carry emphasis in this system.
- **Don't** add glassmorphism or blur-as-decoration.
- **Don't** give a CTA button a gradient or a shadow at rest — the earlier gradient-plus-shadow CTA read as a pop-up ad, not an app action; it was corrected to flat-at-rest, shadow-on-hover.
- **Don't** use bounce or elastic easing on any transition; motion decelerates confidently (`cubic-bezier(0.16, 1, 0.3, 1)` for interaction feedback, `cubic-bezier(0.25, 1, 0.5, 1)` for entrances) and never overshoots.
- **Don't** show an archetype badge, "verified," or trust indicator that isn't backed by an inspectable rule.
- **Don't** reuse the homepage hero's amber-glow/orange-neon diner-counter treatment, Fredoka/Space Grotesk fonts, or checkerboard-floor motif anywhere outside that one surface — it is a scoped exception, not a system-wide addition (see below).

## Homepage Hero Exception: The Diner Counter

The homepage hero (`frontend/app/page.tsx`) intentionally runs its own distinct visual world — a 24-hour NYC diner counter — rather than the site-wide system above. This is a deliberate, scoped surface decision, not a system-wide change, and its tokens (`--diner-*` in `globals.css`) and fonts (Fredoka for the headline, Space Grotesk for data/UI labels, loaded only in `layout.tsx` for this surface) are not part of the reusable system and should not be drawn on by other pages.

Full direction contract, rationale, and finish-review verdict ("ship," all six fixes reverified) live in `.impeccable/surfaces/frontend-app-page-tsx.md`. In short: dark mode renders the counter at night (near-black ground, glowing amber headline, orange-outline-tube CTA); light mode renders the same counter by day (sunlit ground, solid amber/orange fills, no glow) — same structure, same two rationed color roles (amber = headline/brand only, orange = the one CTA action, never decorative elsewhere) in both. No kicker/eyebrow sits above the headline — an earlier version was cut specifically because this project's own craft floor bans that device.

This section exists so a future agent extending the homepage hero has a pointer to the real brief instead of re-deriving the diner world from scratch — it is not an invitation to extend `--diner-*` tokens, Fredoka/Space Grotesk, or the checkerboard motif to any other page.
