## Design Context

### Users
- **Primary**: Young, food-curious New Yorkers, roughly 0–5 years in the city (e.g. recent NYU grads). They have some friends here and use Beli, but they don't like repeating restaurants, their friends haven't been everywhere and fall for TikTok hype too, and they're worn out from scrolling recs, friend lists, and forgotten bookmarks. The job: "help me land on one place I haven't tried that's actually worth it, so I can stop deciding and go."
- **Value prop**: "Most food apps give you endless recs. Locals tells you where to go tonight." Help me pick is the core experience; the ranking model is the engine that chooses its shortlist, not something users are asked to read.
- **Secondary**: Visitors to NYC who want to eat where locals eat, not where TripAdvisor sends them.
- **Tertiary**: Recruiters and hiring managers viewing this as a portfolio project. The design needs to signal "real product" not "weekend hackathon."
- **Context**: Mobile-first. The decision moment is urgent: they're hungry now or planning tonight. The product problem is hype and value for money ("overhyped," "too expensive for what it was"), not tourist traps.

### Brand Personality
- **Voice**: Warm, trustworthy, local
- **Tone**: Like a knowledgeable friend who lives in the neighborhood. Confident but approachable.
- **Emotional goals**: Trust, discovery, belonging

### Aesthetic Direction
The full spec is `DESIGN.md` at the repo root (tokens in its frontmatter, rules in its prose); `.impeccable/design.json` is its machine-readable sidecar. Read it before any UI work. In short:
- **Reference**: Luma's iOS app (user-pinned). Locals should read as a native iOS app that lives on the web. Craft bar: Apple, The Infatuation, Linear.
- **Rejected directions (don't revisit)**: the diner/neon hero, orange-on-khaki, all-beige pills, the sports-broadcast "Matchup", and the old warm-editorial palette with a display face.
- **Anti-references**: generic AI templates, Yelp, TripAdvisor, anything themed, corporate, or old-media.
- **Color**: monochrome. Warm paper ground (#f7f4ee) and near-black ink (#131517) in light mode; near-black ground and white actions in dark mode. Food photos supply the color. Only two tag colors exist: green = open now, purple = still in / your pick.
- **Typography**: the system font only (SF on Apple). Hierarchy by weight (400/600/700) and gray, sentence case, no web fonts.
- **Theme**: system-aware light and dark; every surface follows the theme (including the Help me pick result scene).
- **Icons**: the Lucide-shaped set in `components/Icon.tsx`. No emoji, no second icon set.

### Design Principles
1. **The photo is the only color**: controls are ink, white, or soft gray; anything colored that isn't a photo is a status tag with one meaning.
2. **One primary action per screen**: a single black pill (white on dark grounds), 50px tall; everything else is a soft-gray pill or tile.
3. **Rows, not cards**: places are a 76px rounded photo, a name, and icon meta lines with no box or border. A box appears only as feedback (hover, or the scroll spotlight on phones).
4. **Alive, not static**: everything responds to the pointer, finger, or scroll (lift, press, travelling photos via view transitions), with settling, never bouncy, motion and a full reduced-motion fallback. On phones, scroll stands in for hover.
5. **Respect the decision**: surface where it is, what it is, price, and why it's good, fast. Help me pick is the core experience.

### Working in the code
- **Tokens** live as CSS variables in `frontend/app/globals.css` (`--bg`, `--bg-card`, `--bg-subtle`, `--bg-inset`, `--text`, `--text-secondary`, `--text-muted`, `--cta-bg`/`--cta-text`, `--tag-open-*`, `--tag-pick-*`, `--border`, `--shadow-lg`, `--shadow-float`, `--glass`, `--ease-out`, `--ease-settle`). Use them; don't hard-code hex values. Use `--cta-bg`/`--cta-text` for ink fills; `--accent*`, `--warm*`, `--star-*`, `--success*` are legacy aliases on older pages.
- **Component classes** (in `globals.css`): `.cta-btn` (primary pill), `.soft-btn` (secondary pill), `.tile-btn` (action tile), `.filter-pill` (chip), `.tag` + `.tag-open` / `.tag-pick`, `.row-link` (row that lifts on hover), `.pick-choice` (this-or-that choice), `.rise` with `--i` (staggered arrival), `.scene` (result scene), `.tab-bar` / `.tab-item`.
- **React components**: `PlaceRow`, `ChoiceBody`, `PickPhoto` and the `priceLabel`/`fmtDistance` helpers (`components/PickCard.tsx`); `Icon`; `SiteHeader` (desktop nav plus the phone tab bar); `Collage` (homepage photos); `ScrollSpotlight` (wrap a list of `.row-link`s so the middle row lights up on phones).
- **Motion rules**: give a shared photo `viewTransitionName: p-<restaurant_id>` and change screens through `document.startViewTransition(() => flushSync(update))`; entrance animations that share an element with hover/active transforms use fill `backwards`; scope touch-only behavior with `@media (hover: none)`; add new transforms to the reduced-motion block.
- **Scope**: the homepage and Help me pick are fully on the system. Browse, restaurant detail, Saved, Visited and profile still use older layouts (e.g. `RestaurantCard`); bring them onto the system rather than copying their patterns.
- After a UI change, update `DESIGN.md` if the system itself changed.
