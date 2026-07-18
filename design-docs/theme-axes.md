# Theme color/density axis split — design doc

Status: proposed, not yet implemented. Written ahead of implementation per
CLAUDE.md's TreeTable/Combobox precedent — Phase 14, given this is an
architecture change to already-shipped theme code that ~40 component test
files, Histoire, VitePress, and the visual-regression suite all read from
via `allThemes`. No token/component code in this pass.

**Correction to the request's framing, stated up front rather than silently
absorbed**: the request describes "neutral, plus the two themes from Phase
9" — three themes total. The actual shipped set is **four**:
`neutral`, `serious`, `fun`, and `crisp` (`packages/themes/src/themes/`).
`crisp` was added in a later phase without every downstream reference being
updated — `apps/visual-tests/tests/visual.spec.ts:7`'s own comment still
says `"3 themes × light/dark = 6 combinations"` when the actual matrix run
today is 4 × 2 = 8 (364 existing baseline PNGs bear this out). This doc
treats all 4 as in scope for decomposition, and flags the stale comment as a
one-line fix to pick up in the build order below.

## 1. Token audit — which tokens belong to which axis?

Walking every field in `packages/themes/src/types.ts` against the 4 shipped
theme files:

**Color-axis (all of `ThemeColorTokens`)**: `background`, `foreground`,
`surface` (+ `foreground`/`hover`/`active`), `overlay`, `border`, `ring`,
`primary`, `secondary`, `accent`, `muted`, `destructive`, `success`,
`warning`, `info` (+ each role's `hover`/`active`). Every value in every
theme file is a color literal — no exceptions, no judgment call needed here.

**Density-axis**: `ThemeRadiusTokens`, `ThemeSpacingTokens`,
`ThemeTypographyTokens` in full — same conclusion, every value is a
dimension/weight/line-height, never a color.

Also density-axis, but **not currently part of `Theme` at all**: the
`--stance-control-*` custom properties (`Button.vue`, `Checkbox.vue`,
`Radio.vue`, `Switch.vue` — box sizes, switch track width/thumb travel,
button min-heights). These were added in the Phase 8 Tier 3 fix for
"density isn't themeable" (`consistency-audit-2026-07.md` §2.10) as bare
`var(--stance-control-x, 1.25rem)` escape hatches with hardcoded fallbacks —
no theme ever actually sets them, so today all 4 themes render identical
control geometry despite having 4 different spacing/radius scales. This is
exactly the kind of gap that stays invisible while density can't be
selected independently, and becomes visibly broken the moment it can (see
§5). **Judgment call: these need to become a real `ThemeControlTokens`
group under the density axis as part of this phase**, not left as
unwired escape hatches — flagged here, resolved in the build order (§6, D2).

**Ambiguous, resolved: `ThemeShadowTokens`.** The request specifically asked
this be resolved rather than guessed. Evidence from the 4 existing themes:

- Every shadow value's color component is literal `oklch(0% 0 0 / <alpha>)`
  — pure black, in all 4 themes, at both light and dark. No theme tints its
  shadows to match its palette (there's no rose-tinted shadow in `fun`
  despite `fun` having a rose accent).
- Shadow *shape* (blur radius, spread, layering) is what actually varies
  between themes, and it tracks personality, not palette: `serious` uses
  flat, barely-there shadows ("a 1px border reads better than a soft
  drop-shadow once a screen is full of rows"); `fun` uses wide, diffuse
  blur; `neutral` and `crisp` use near-identical "standard" shadows despite
  having entirely different color palettes (`crisp.ts`'s own comment: "the
  personality here lives in color, radius, and density rather than shadow
  shape" — i.e. crisp's author already treated shadow *shape* as
  density-owned and independent of crisp's color identity).
- Shadow *opacity magnitude* also changes between light and dark within a
  single theme (e.g. `neutral`: `sm` alpha 0.05 light → 0.3 dark), but that
  ratio is roughly consistent across all 4 themes' light→dark jumps — it's
  a mode concern, not a palette concern.

**Resolution: shadow is a single-axis, density-owned token**, with a fixed
neutral (black) color, sidestepping the tinted-shadow question entirely
per the request's suggested escape hatch — and it's not really an escape
hatch, it's what the data already shows. Because shadow's magnitude still
needs to differ between light and dark, `DensityProfile` (§3) carries its
own `{ light: ThemeShadowTokens; dark: ThemeShadowTokens }` pair,
structurally mirroring today's `ThemeModeTokens.shadow` but detached from
`ThemeColorTokens` — this is the one place the light/dark mode toggle
reaches into density-owned tokens rather than color-owned ones (see §2).

**Explicitly out of scope for this phase, flagged rather than silently
folded in**: `--stance-motion-duration` (~15 components' transition
timing). It's a dimension-shaped value, which would suggest density, but
no current theme varies it — every theme compiles to the same flat
`0.15s` default, unlike radius/spacing which already differ per theme
today. Making it density-owned now would be new scope invented by this
phase, not a decomposition of anything that currently exists. Recommend
leaving it a flat global escape hatch; revisit only if a future density
profile genuinely wants different motion (e.g. a hypothetical energetic
personality with snappier transitions).

## 2. Naming and API shape

**Axis names: `palette` (color) and `density` (personality/spacing/radius/
shadow-shape).** Not `color`/`scale` — "density" isn't invented for this
doc, it's already the word CLAUDE.md and the consistency audit use for this
exact axis ("themes vary radius/shadow/density too"; "if density is a real
theme axis"), so reusing it keeps the codebase's existing vocabulary intact
rather than introducing a synonym. "Palette" over "color" because a theme's
color axis is a *coordinated set* of ~14 roles, not one value — "palette"
signals that; "color" reads like a single prop value (as in, confusable
with `data-theme-color="blue"` meaning one hex).

**Selection: two independent attributes, not one combined value.**

```html
<div data-theme-palette="vivid" data-theme-density="compact" class="dark">
```

rather than `data-theme="vivid-compact"`. Reasoning:

- Independent selection is the entire stated point of this phase. A
  combined string still requires the consumer to know which
  palette-density pairs exist as valid strings — it doesn't actually
  deliver "pick each axis separately," it just renames the old bundling
  problem with a hyphen. Two attributes are what "independent" concretely
  means at the API surface.
- CSS output is simpler with two attributes: `compilePalette` emits
  `[data-theme-palette="x"]` / `[data-theme-palette="x"].dark` rule pairs
  (colors + shadow's mode-dependent alpha... no, shadow is density-owned,
  so palette rules are colors only), `compileDensity` emits
  `[data-theme-density="y"]` (radius/spacing/typography/control, mode-
  independent) plus `[data-theme-density="y"].dark` (shadow only, mode-
  dependent — see §1). The browser's normal cascade combines whichever
  palette and density attributes are present on the same element or an
  ancestor; nothing bespoke has to compute the cross product. A combined
  `data-theme="x-y"` value would need one rule block per *pair*, which is
  the combinatorial blowup this doc's §4 is explicitly trying to avoid —
  baking it into the selector shape would make that blowup unavoidable at
  the CSS level, not just the test-baseline level.
- Backward compatibility (§3) is easier with two independent attributes
  underneath: a legacy `data-theme="neutral"` selector can be a pure alias
  that also stamps the two new attributes' worth of values, without any
  string-parsing.

**This is a genuine compiler rewrite, not a relabeling** — flagging that
explicitly since it's easy to undersell. `compileTheme(theme: Theme)` today
returns one CSS string per theme; it becomes two functions
(`compilePalette`, `compileDensity`) each returning their own rule pairs,
and `compileThemes`/`compileDensityProfiles` replace the single
`compileThemes(allThemes)` call sites (Histoire's global style injection,
VitePress's `ThemeStyles.vue`).

**Dark mode: stays orthogonal to both axes, as a toggle rather than a
third "pick one of N" axis.** This is already the existing precedent, not
a new decision — today's `ThemeModeTokens` already separates
mode-*independent* (`radius`/`spacing`/`typography`) from mode-*dependent*
(`colors`/`shadow`) fields within one `Theme`, and `.dark` is a single
class toggle that works identically regardless of which theme is active.
Continuing that pattern: `.dark` is a boolean the consumer sets however
they already do (matching `prefers-color-scheme`, a manual toggle,
whatever), and it modifies whichever palette + density are currently
selected, together. Structurally this is `palette × density × mode`, but
`mode` is different in kind from the other two — it only ever has 2
values, every component's CSS already keys off a bare `.dark` class match,
and there's no product need for "3+ mode variants" the way there's a real
product need for 4+ palettes or density profiles. Treating it as a binary
toggle rather than an enumerable axis keeps the combinatorial analysis in
§4 to a 2-axis problem (palette × density) with mode doubling whichever
combinations get tested, exactly as it does today.

## 3. Backward compatibility for the existing 4 themes

Decomposing each shipped theme into its palette + density parts, density
names chosen to describe the actual spacing/radius/shadow-shape rather than
reusing the old theme names (so a consumer can genuinely pick, say, `fun`
palette + `compact` density without the naming implying that's an unusual
combination):

| Old theme | → palette (unchanged name) | → density (new name) | Density rationale |
|---|---|---|---|
| `neutral` | `neutral` | `regular` | today's default scale — the baseline everything else is described relative to |
| `serious` | `serious` | `compact` | "roughly half of neutral's radius," "shifted down about one notch" spacing, flat shadows |
| `fun` | `fun` | `relaxed` | "roughly double neutral's radius," roomier spacing, soft diffuse shadows |
| `crisp` | `crisp` | `comfortable` | crisp's own comment: "slightly denser than neutral, roomier than serious — in between the two" |

Palette names are kept identical to today's theme names deliberately —
their color identity is genuinely what "neutral"/"serious"/"fun"/"crisp"
describe, and keeping the name stable minimizes churn for anything that
already refers to a theme by name (docs prose, this design doc's own
audit, existing component comments that say things like "the same hues as
neutral"). Density names are new because reusing e.g. `serious` as a
density-profile name would misleadingly imply a `fun`-palette-plus-
`serious`-density combo is somehow contradictory, when the whole point of
this phase is that it isn't.

**Migration path — a decision for approval, not something to pick
silently.** Three options, ranked:

1. **(Recommended) Alias + dev-mode deprecation warning, no forced
   removal date yet.** `data-theme="neutral"` keeps compiling to the exact
   same CSS output as today (verified byte-for-byte in D1's tests, §6) via
   a `legacyThemes` compatibility table mapping each of the 4 old names to
   its `{ palette, density }` pair. A one-time dev-mode `console.error`
   (matching the existing pattern components already use for other
   required-prop/deprecation-style warnings, e.g. `Sheet.vue`'s missing-
   `title` check) fires when `compileLegacyTheme`/the old `allThemes` entry
   point is used, pointing at a migration doc. No stated removal version
   yet — revisit once real consumer adoption data exists.
2. Same alias, but with a stated removal target (e.g. "removed in 2.0").
   More honest about intent, but nothing in this codebase has shipped a
   major version yet, so committing to a deprecation timeline now is
   choosing a number with no data behind it. Not recommended for *this*
   phase; worth revisiting once there's an actual 1.0/2.0 cadence (the
   phase-13 prompt's own "after this phase" note already flagged an
   upcoming versioning phase — that's the more natural place to attach a
   removal date, not this one).
3. Breaking change, immediate migration required. Rejected outright — this
   is exactly the "don't silently break existing usage" case CLAUDE.md's
   request calls out by name.

**Recommendation: option 1.**

## 4. Combinatorial scope

**The real numbers, not estimates.** Today: 4 palettes × 2 modes = 8 combos
per component is the existing "themed" matrix (both the ~40 component test
files' `describe.each(themes)` axe blocks, and
`visual.spec.ts`'s `THEMED_CAPTURE_PATTERN` captures). 364 baseline PNGs
exist today; the last full visual-regression run took ~40 minutes.

If density became a second fully-enumerated axis at the same 4-way
cardinality, naive full coverage is 4 palettes × 4 densities × 2 modes = 32
combos per component — a 4x multiplier on both the baseline count (364 →
~1450+) and CI runtime (~40min → likely 2.5–3hrs), for a phase whose actual
functional surface area (two independent CSS custom-property groups) is
much smaller than a 4x cost increase justifies.

**Recommendation: curated coverage, not full combinatorial coverage — with
the two test surfaces (unit/axe vs. visual) split differently, since they
protect against different things:**

- **Unit/axe matrix (`describe.each(themes)`, ~40 files, jsdom, cheap):**
  keep exactly today's shape — all 4 *palettes* × 2 modes, 8 combos,
  unchanged. This surface exists to catch color-contrast/ARIA regressions;
  density tokens don't affect either, so multiplying this matrix by density
  buys nothing here. **Add one narrow, targeted addition**: a single extra
  test per component pairing the default palette with one *non-default*
  density (e.g. `neutral` palette + `compact` density) at both modes —
  specifically aimed at the §5 risk (a component that silently assumed
  color and density tokens always change together). This is 2 extra runs
  per component, not 8.
- **Visual regression (Playwright/Lost Pixel, the expensive surface):**
  keep today's palette × mode matrix exactly as-is (zero baseline-count
  change from that axis — `THEMED_CAPTURE_PATTERN`'s existing "light"/
  "dark" captures keep looping `allPalettes` exactly like they loop
  `allThemes` today). **Add one new variant per component**, analogous to
  the existing "Narrow container (responsive check)" variant every simple
  component already has: a "Density" variant showcasing the *default*
  palette across all 4 density profiles, light mode only (density doesn't
  affect color contrast, so a dark-mode density pass buys nothing). This
  adds roughly 4 new baselines per component that opts in — additive to
  the existing count, not multiplicative with it.
- **Explicitly not tested or showcased**: the actual cross combinations
  (`vivid`-equivalent palette × `compact` density, etc.) work via the token
  system — any palette's CSS custom properties and any density profile's
  CSS custom properties are structurally independent rule blocks that
  combine via the ordinary cascade, so nothing stops a consumer from using
  any pairing — but they aren't individually baselined or shown in
  Histoire. **Named residual risk, not silently accepted**: a bug that
  only manifests in a specific non-default-palette × non-default-density
  intersection would not be caught by this curated matrix. §5's component
  audit found no current evidence of such a bug class existing, but the
  audit method (grep for CSS declarations combining a color var and a
  density var) can't prove a negative — stating the gap outright rather
  than implying full coverage.

**`allThemes`'s replacement shape.** The flat list becomes two flat lists
plus the legacy shim from §3:

```ts
export interface ColorPalette {
  name: string;
  light: ThemeColorTokens;
  dark: ThemeColorTokens;
}

export interface DensityProfile {
  name: string;
  radius: ThemeRadiusTokens;
  spacing: ThemeSpacingTokens;
  typography: ThemeTypographyTokens;
  control: ThemeControlTokens; // new — see §1
  shadow: {
    light: ThemeShadowTokens;
    dark: ThemeShadowTokens;
  };
}

export const allPalettes: readonly ColorPalette[]; // neutral, serious, fun, crisp
export const allDensityProfiles: readonly DensityProfile[]; // regular, compact, relaxed, comfortable

/**
 * Back-compat only: the 4 originally-shipped {palette, density} pairings,
 * shaped like today's Theme[] so existing `allThemes` consumers keep
 * working unmodified until migrated (§3, §6/D1).
 */
export const legacyThemes: readonly Theme[];
```

Every current `allThemes` consumer (Histoire's `useStoryTheme.ts`/
`ThemeSwitcherWrapper.vue`, VitePress's `ThemeStyles.vue`, `visual.spec.ts`,
and the ~40 component test files) keeps working unmodified against
`legacyThemes` through D1–D2 of the build order below, and gets migrated to
`allPalettes`/`allDensityProfiles` explicitly in D3–D4 rather than needing
a single flag-day rewrite across ~45 files.

## 5. Component-level risk

Beyond Phase 9's "no component hardcodes a theme-specific value" audit
(which only ever varied palette, since density wasn't independently
selectable), this phase surfaces two categories of *new* risk:

1. **Hardcoded, non-tokenized dimensions that don't respond to density at
   all today.** `Dialog.vue` (`max-width: 32rem`), `PopoverContent.vue`
   (`20rem`), `Tooltip.vue` (`16rem`), plus (per
   `consistency-audit-2026-07.md` §2.10, only partially fixed) Toast's
   18/24rem widths, DatePicker's 18rem dialog / 2rem cells, Avatar's size
   scale, ProgressBar's 0.5rem track, and Badge's hardcoded
   `line-height: 1.25`. The Phase 8 Tier 3 fix for §2.10 tokenized
   *control* geometry (Button/Checkbox/Radio/Switch — confirmed via grep,
   §1) but not *overlay* geometry. This was invisible risk before (no
   consumer could select "compact" independently of "serious," so nobody
   would notice Dialog staying 32rem regardless), and becomes a visible,
   reportable bug the moment density is independently selectable — a
   `compact`-density consumer would get a shrunk Button next to a
   full-size Dialog. **Recommend tokenizing these as a prerequisite
   sub-phase (D2 below), not deferring them silently** — shipping
   independent density selection while half of density's own token
   surface doesn't exist yet would ship a documented feature that's
   visibly incomplete on day one.
2. **Shadow's neutral-color assumption (§1) needs to become a written
   constraint, not just an implicit fact about 4 data points.** The audit
   found no component that recomputes or tints a shadow value — every
   `box-shadow` usage is a single `var(--stance-shadow-*)` reference — so
   there's no current bug. But that's only true because every existing
   density profile happens to author neutral-black shadows; nothing
   currently *enforces* it. Recommend documenting "density profiles author
   neutral-color shadows only" as an explicit authoring rule (in the
   Theming Guide rewrite, D5) rather than leaving it an unstated pattern a
   future 5th density profile could quietly break.

No other component-level coupling between color and density tokens was
found — `radius`/`spacing` usage is consistently independent
`var(--stance-radius-*)`/`var(--stance-spacing-*)`, never combined with a
color token in the same CSS declaration, across every component checked.

## 6. Recommended build order

Sub-phases, each independently reviewable — stopping for review after D1
specifically, since D1 contains every genuinely hard decision made in this
doc; D2 onward is comparatively mechanical once D1's shape is approved.

- **D1**: Type/compiler rewrite only. `ColorPalette`/`DensityProfile`/
  `ThemeControlTokens` types, `compilePalette`/`compileDensity` replacing
  `compileTheme`, the two-attribute (`data-theme-palette`/
  `data-theme-density`) selector output, decomposing the 4 existing themes
  per §3's table, plus the `legacyThemes` back-compat shim and its
  dev-mode deprecation warning. No visible behavior change for any
  existing consumer — verified by diffing compiled CSS output byte-for-byte
  against today's `compileTheme` output for all 4 legacy combos. Also
  picks up the one-line stale-comment fix in `visual.spec.ts:7` ("3
  themes" → accurate count) as a trivial rider.
- **D2**: Tokenize the hardcoded dimensions flagged in §5.1 (Dialog/
  Popover/Tooltip/Toast/DatePicker/Avatar/ProgressBar/Badge) into real
  `ThemeControlTokens`-owned custom properties, populated by all 4 density
  profiles. Blocks D3 from shipping a feature that's visibly incomplete.
- **D3**: Wire the two independent attributes into Histoire's switcher
  (two dropdowns instead of one), VitePress's `ThemeStyles.vue`, and the
  visual-tests registry per §4's curated matrix (existing palette × mode
  captures unchanged; new "Density" variant added per component). Generate
  the new baselines.
- **D4**: Update the ~40 component test files' `describe.each(themes)`
  blocks to read from `allPalettes` (renaming, no behavior change) plus
  add the one targeted palette×density cross-check per file from §4.
- **D5**: Docs — Theming Guide rewritten to explain palette and density as
  separately selectable, a migration guide for `data-theme="neutral"`-style
  consumers, the shadow neutral-color authoring rule from §5.2, and a
  CLAUDE.md conventions update recording the new `data-theme-palette`/
  `data-theme-density` attributes and `--stance-{category}-{token}` control
  additions.

## D3 rollout status: complete (35/35)

D3's "Density" variant (curated matrix, §4) now covers all 35 shipped
components. The first pass shipped 26 — every component that renders
inline. The remaining 9 — Combobox, CommandPalette, Dialog, DropdownMenu,
Popover, Sheet, Toast, Tooltip, DatePicker — all teleport their open
content to the shared overlay root (`getOverlayRoot()`), outside the DOM
subtree of whatever section triggered them, which surfaced a real gap
rather than a wiring gap:

`useOverlayThemeContext.ts`'s `detectThemeContext()` (in
`packages/core/src/utils/theme-context.ts`) is the mechanism that lets
teleported content inherit ambient theming — it walks up from the
triggering element via `.closest()`. It originally only checked for the
legacy `data-theme`/`.dark`, with no equivalent path for the new
`data-theme-palette`/`data-theme-density` attributes. A teleported panel
given only the new attributes on its trigger's ancestry (no legacy
`data-theme`) would have opened with **undefined color custom
properties** — `var(--stance-color-*)` has no fallback (§1 of this doc:
"raw color tokens don't have inline fallback"), so the panel would render
with broken/invisible coloring, not just a stale theme.

Fixed by extending `ThemeContext`/`detectThemeContext()` to detect
`data-theme-palette`/`data-theme-density` independently (each may sit at
a different ancestor level — see §2's two-attribute rationale), keeping
`.dark` resolution tied to whichever color-carrying ancestor (legacy
`data-theme`, else `data-theme-palette`) is present, since every existing
usage co-locates them on one element. The 9 components' templates were
updated to bind the two new attributes alongside their existing
`:data-theme`/`.dark` bindings — purely additive, since the new bindings
resolve to `undefined` (and Vue omits the attribute) until a
`data-theme-density` ancestor actually exists, so every pre-existing
single-axis capture is unaffected.

Toast's shared-region-per-app constraint (see `apps/playground/src/
Toast.story.vue`'s own comment: `ToastRegion` themes from wherever it's
*mounted*, not from whichever section triggered a given toast) meant its
Density variant needed a different shape than the other 8: one
`ToastRegion` per density section (each independently reading its own
`data-theme-density` from its own mount point) rather than one shared
region — `useToast()`'s module-level store fans a single `show()` call out
to all of them at once, so one capture already shows all four densities
side by side.

## D4 status: complete

All ~37 component test files' `describe.each(themes)` axe blocks now read
from `allPalettes` (renamed to `describe.each(palettes)`, `data-theme` →
`data-theme-palette`), unchanged 4×2=8 combos per component — see §4's
rationale for why the axe/visual matrix stays palette-only. Each file also
gained one targeted cross-check per §4: neutral palette + compact density,
both modes, aimed at catching a component that silently assumed color and
density tokens always change together (none found). A shared
`packages/core/tests/theme-test-utils.ts` holds the compilation helpers so
this logic isn't duplicated 37 times.

## D5 status: complete (docs only) — plus a discovered cascade-layers gap, fixed below

`apps/docs/theming.md` is rewritten for the two-axis model: token table
split by axis, `ColorPalette`/`DensityProfile` shapes, `compilePalette`/
`compileDensity` API, the shadow neutral-color authoring rule from §5.2 (now
a written constraint, not just an implicit fact about 4 data points), and a
migration guide from `data-theme` (the §3 decomposition table). CLAUDE.md's
Theme architecture and Conventions sections are updated to match — density's
new `ThemeControlTokens` category, the two selector attributes, and the
8-combination Definition-of-Done line clarified as palette×mode (density is
curated per §4, not part of that count).

**A real, unrelated bug was found and documented rather than fixed while
writing the "Overriding a component's styling" section**: CLAUDE.md's
core claim ("a single Tailwind utility class on the consumer's side wins by
default... via `:where()` wrapping") does not currently hold under Tailwind
v4's default setup. Tailwind v4 compiles its own utilities into
`@layer utilities`; stance's `:where()` component CSS is plain, unlayered
CSS. Per the CSS cascade-layers spec, an unlayered rule always wins over a
layered one regardless of specificity — so a Tailwind utility class
currently loses to a stance default even though `:where()` keeps the
latter at specificity zero. **Verified directly, not just theorized**:
adding Tailwind's `p-8` to a stance `<Button>`'s `class` prop does not
change its rendered padding.

This affects every component, not just the one story (Toast's Density
variant, see D3's status note above) that originally surfaced it — it's a
general property of how stance's CSS and Tailwind v4's CSS currently
compose, not specific to `position` or any other single property.

A concrete fix was identified but deliberately not implemented in this
pass, since it's a build-pipeline change to `packages/core` plus a
consumer-facing setup requirement — a decision that needs explicit sign-off
before shipping, not something to fold into a "docs" sub-phase:

1. `packages/core`'s build wraps its compiled CSS output in a named layer
   (`@layer stance { ... }`) instead of shipping it unlayered.
2. Consumers add one line to their own global CSS, before their Tailwind
   import, establishing `stance` as lower-priority than `utilities` in the
   overall cascade-layer order, restoring "a Tailwind utility wins" without
   `!important` or any specificity workaround. **This sketch undersold the
   exact ordering** — see "Cascade-layers fix: complete" below for the
   corrected 5-layer order and the real regression that naive ordering
   caused.

Both `apps/docs/theming.md` and `CLAUDE.md` document current behavior
honestly (a plain non-Tailwind-utility CSS override, or an inline style,
works today; a Tailwind utility class currently doesn't) rather than
repeating the previously-unverified "always wins" claim. Flagged here as
the next decision point once D1–D5 review lands.

## Cascade-layers fix: complete

The gap documented in D5 above is fixed. Two halves, both required:

1. **Library side**: `packages/core/vite.config.ts` gained a
   `wrapStylesheetInLayer("stance")` Rollup plugin, hooked into
   `generateBundle` with `order: "post"` (Vite's own internal CSS-emission
   plugin adds the stylesheet asset to the bundle in its own `generateBundle`
   hook, which otherwise runs after any normal user plugin regardless of
   array position — `order: "post"` is what actually guarantees this hook
   sees the finished asset rather than running before it exists, confirmed
   by first observing the hook fire against an empty bundle without it).
   `@stance-dev/core/style.css` now ships as one `@layer stance { ... }` block
   instead of unlayered CSS.
2. **Consumer side**: a bare `@layer theme, base, stance, components,
   utilities;` statement, before importing Tailwind and stance's CSS.
   Cascade-layer priority is order-of-first-appearance across the *whole
   page*, not something a library can pin from inside its own stylesheet —
   layering stance's CSS without this consumer-side declaration doesn't fix
   anything by itself.

**`stance`'s position in that list is load-bearing in both directions, not
just "somewhere before utilities" — this was caught by the full
visual-regression suite, not reasoned out in advance.** The first attempt
declared `@layer stance, base, components, utilities;` (`stance` *first*,
lowest priority overall) on the theory that lowest-priority is simply
"before utilities." That passed the `p-8`-on-a-Button spot-check, but the
full 502-test visual-regression run came back with 343 failures — Accordion
had silently lost its divider borders, and diffing the screenshots showed
why: Tailwind's `base` layer holds its preflight reset (which zeroes out
borders among other things), and with `stance` ordered *before* `base`,
that reset now outranked stance's own `border-bottom` declaration in
`AccordionItem.vue`, something no isolated Button/padding check would have
surfaced. The fix was reordering to `theme, base, stance, components,
utilities` — `stance` *after* `base` (so stance's real styles beat the raw
reset) but still *before* `utilities` (so a Tailwind utility class still
overrides a stance default) — re-verified with the full suite afterward:
502/502 passing, zero regressions. Recorded here as the reason every doc
below gives this specific 5-layer order rather than a shorter, more
"obvious"-looking one — copying a shortened version is very likely to
reintroduce the Accordion-class of bug silently, since a narrow spot-check
(like the `p-8` repro) won't catch it.

`apps/playground/src/style.css` (this repo's own dev playground, a real
consumer of `@stance-dev/core`) was updated to the fixed setup, so Histoire's
own screenshots demonstrate correct override behavior rather than just the
library's internal test suite.

**Verified end-to-end, not just at the CSS-text level**: a Playwright
repro adds Tailwind's `p-8` utility class to a live `<Button>`'s `class`
prop and reads back `getComputedStyle(...).paddingLeft`. Without the
consumer-side `@layer` declaration, the padding is unchanged (the original
bug). With the corrected declaration, padding becomes `32px` (`p-8`'s
`2rem`), matching Tailwind's utility exactly — and a second repro confirms
`AccordionItem`'s `border-bottom-width` is back to `1px`, not the `0px` the
first (wrong-order) attempt produced.

Updated to match: `apps/docs/theming.md`'s "Overriding a component's
styling" section (now describes the fix and the required setup line
instead of the gap), `getting-started.md`'s Tailwind setup section (the
`@layer` line added to the copy-pasteable snippet), `accessibility.md`'s
"What no `!important` means for you" section, and CLAUDE.md's "No
`!important` anywhere" constraint.
