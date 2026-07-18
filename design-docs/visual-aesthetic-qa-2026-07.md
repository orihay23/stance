# Visual Aesthetic QA — Findings Report (stance)

## Context

This is the **review-and-plan** deliverable for the Visual Aesthetic QA task: a
prioritized, per-component list of aesthetic issues with concrete, implementable
fixes, precise enough that a Sonnet instance in Claude Code could apply each one
without re-deriving the judgment. **No code is changed** — this file is the
findings report.

Basis for the review (what I actually inspected, not guessed):
- Token architecture: `packages/themes/src/types.ts`, `compile.ts`, all 4 density
  profiles (`density/{regular,compact,relaxed,comfortable}.ts`) and the 4 source
  themes they derive from (`themes/{neutral,serious,fun,crisp}.ts`).
- Component CSS: Button, Input, Checkbox, Radio, Switch, Badge, Avatar,
  ProgressBar, Card, Toast, Calendar (read in full), plus a repo-wide grep of
  hardcoded `rem` dimensions across all 40+ `.vue` files.
- Baselines under `apps/visual-tests/tests/visual.spec.ts-snapshots/` (502 PNGs):
  Switch/Checkbox/Card/Dialog/Tooltip density captures, and light+dark palette
  captures for Card/Badge. Matrix confirmed as 4 palettes × 2 modes +
  neutral-palette/light-only density captures (per `theme-axes.md` §4).

**A11y guardrail:** none of the fixes below touch color, contrast, focus-ring, or
hit-target minimums (the Switch/Pagination sizing fixes preserve or increase
target size). The one color tension I found is pre-existing and intentional
(warning role's dark-on-amber foreground) — flagged, not "fixed toward prettier."

---

## Root-cause pattern (read this first)

Phase 14/D2 tokenized the **outer** dimensions of controls (`--stance-control-*`:
box-size, switch-width, control heights, overlay max-widths, avatar sizes,
calendar cell, progress-track). But many **inner** sub-element dimensions were
left hardcoded — icon glyph sizes, indicator dots, the switch thumb, fixed
optical-centering offsets — and a couple of components/sub-parts were never wired
to density tokens at all (Pagination; Calendar's weekday/nav rows). 

Result: the outer control resizes with density while its internal parts keep a
fixed px size, so **proportions drift** — indicators read oversized at `compact`
and undersized/lost at `relaxed`. Almost every finding below is an instance of
this one pattern. A single coordinated sweep — make each inner dimension relative
to the owning `--stance-control-*` token (via `calc()`/`%`/`1em`/`1lh`), or add
the missing token — resolves most of them.

---

## Priority 1 — real inconsistencies, multiple components / most visible

### 1.1 Switch thumb doesn't scale with density — HIGH
- **File:** `packages/core/src/components/Switch.vue` (`.stance-switch__thumb`, lines 153–163)
- **Combos:** every density except `regular`. Worst at `relaxed` (thumb floats
  undersized in the track) and `compact`/`comfortable` (thumb ≥ track inner
  height, bulges/overflows). Confirmed in `switch-density-{compact,relaxed,
  comfortable,regular}` baselines.
- **What's wrong:** the thumb hardcodes `width/height: 1rem` and insets
  `top/left: 0.0625rem`, but the track height = `--stance-control-box-size`
  (compact 1rem/16px, regular 1.25rem/20px, relaxed 1.5rem/24px, comfortable
  1.125rem/18px). So the 16px thumb sits in tracks of 16–24px inner height. At
  `relaxed` there's a visible ring of empty track around a too-small thumb; at
  `compact` the thumb equals/exceeds the ~13px inner track height and looks like
  it's overflowing. Only `regular` (20px track, 16px thumb) is tuned.
- **Fix:** size the thumb from the box-size token —
  `width/height: calc(var(--stance-control-box-size, 1.25rem) - 0.25rem)` (≈2px
  inset per side), keeping `top/left: 0.0625rem`. The existing
  `--stance-control-switch-thumb-travel` token already equals `switchWidth −
  boxSize` for all 4 profiles (verified: 1.25/1/1.5/1.125rem), so the checked
  position stays flush with **no token change**. Verify the right-edge is flush
  after, tuning the `-0.25rem` inset if needed.

### 1.2 Selection indicators (checkbox check, radio dot) hardcoded — MEDIUM
- **Files:** `Checkbox.vue` (`.stance-checkbox__check-icon`/`__dash-icon`, `0.875rem`, lines 184–191); `Radio.vue` (inner dot `0.625rem`, lines 136–137)
- **Combos:** most visible at `relaxed` (indicator small inside the larger box);
  slightly oversized at `compact`.
- **What's wrong:** both indicators are fixed px while the box =
  `--stance-control-box-size`. Radio dot is 50% of the box at `regular`, but
  ~42% at `relaxed` (1.5rem box) and ~62% at `compact` (1rem box) — the dot's
  visual weight drifts across densities instead of staying proportional.
- **Fix:** express as a fraction of the box token, anchored to today's regular
  ratio: check icon `calc(var(--stance-control-box-size, 1.25rem) * 0.7)`; radio
  dot `calc(var(--stance-control-box-size, 1.25rem) * 0.5)`.

### 1.3 Optical-centering offset is a fixed 2px — MEDIUM
- **Files:** `Checkbox.vue:136`, `Radio.vue:92`, `Switch.vue:109` — all
  `.stance-*__control { margin-top: 0.125rem }`
- **Combos:** drifts across all densities; most noticeable at `relaxed` vs `compact`.
- **What's wrong:** the comment says this "optically centers the box against the
  label's first line at typical font-size/line-height," but it's a constant while
  density changes **both** text size (compact base 14px → relaxed 17px) **and**
  line-height (compact 1.15 → relaxed 1.6). The half-leading above the first text
  line grows with density, so a fixed 2px increasingly under-centers the control
  relative to the label at `relaxed`, and slightly over-centers at `compact`.
- **Fix:** make it track the first-line half-leading, e.g.
  `margin-top: max(0px, calc((1lh - var(--stance-control-box-size, 1.25rem)) / 2))`
  (needs an explicit `line-height` on the root so `1lh` is defined — the root
  currently sets none). If `1lh` is undesirable, at minimum scale the offset with
  a density token rather than leaving it constant.

### 1.4 Calendar: weekday header + nav buttons skip density; day cells don't — MEDIUM
- **File:** `packages/core/src/components/Calendar.vue`
- **Combos:** worst at `relaxed`; coincidentally fine at `compact`.
- **What's wrong:** `.stance-calendar__cell` (day cells) correctly uses
  `var(--stance-control-calendar-cell-size, 2rem)` (regular 2 / relaxed 2.5 /
  compact 1.75 / comfortable 1.875rem) — good. But **siblings** don't:
  `.stance-calendar__weekday` height (line 391) and `.stance-calendar__nav-button`
  (lines 347–348) are hardcoded `1.75rem`, and the grid `gap` is a hardcoded `2px`
  (lines 378, 384). At `relaxed`, day cells grow to 2.5rem while the weekday
  header row stays 1.75rem → header/body column rhythm misaligns and nav buttons
  look undersized against tall cells. (At `compact` the cell happens to equal
  1.75rem, hiding the bug.)
- **Fix:** weekday height → `var(--stance-control-calendar-cell-size, 2rem)`;
  nav-button size → `var(--stance-control-height-sm, 2rem)` (or the cell token);
  grid gap → `var(--stance-spacing-xs, 0.25rem)`. DatePicker composes Calendar, so
  it inherits the fix automatically.

### 1.5 Pagination ignores density entirely — MEDIUM
- **File:** `packages/core/src/components/Pagination.vue` (lines 157–158, 193–194, 219)
- **Combos:** all — pagination renders identically at `compact` and `relaxed`.
- **What's wrong:** page buttons hardcode `min-width: 2rem; height: 2rem`, and
  prev/next `min-width: 4.5rem`, with no `--stance-control-*` reference. Every
  neighboring control resizes with density but the pager stays fixed, so it looks
  out of scale in a `compact` or `relaxed` layout.
- **Fix:** height + min-width → `var(--stance-control-height-sm, 2rem)`; scale
  inter-button gaps with `--stance-spacing-*`. Keep the ≥2rem effective size so
  the 44px-ish touch target isn't regressed at `compact` (a11y).

---

## Priority 2 — isolated / lower severity

### 2.1 Badge vertical padding hardcoded — LOW
- **File:** `Badge.vue:48` — `padding: 0.125rem var(--stance-spacing-sm, 0.5rem)`
- Horizontal padding scales with density, vertical is a fixed 2px. At `relaxed`
  (larger type + 1.35 line-height) the pill reads vertically cramped relative to
  its now-roomier horizontal padding.
- **Fix:** vertical → `var(--stance-spacing-xs, 0.25rem)` (0.125/0.25/0.375rem
  across compact/regular/relaxed — proportional), or a small `calc` of it.

### 2.2 Toast close button + icon hardcoded — LOW
- **File:** `Toast.vue` (`.stance-toast__close` `1.25rem`, its `svg` `0.875rem`, lines 115–141)
- Toast body scales (min/max width + padding via tokens) but the dismiss target
  is fixed, so it shrinks relatively at `relaxed`. Minor.
- **Fix:** tie the close-button box to a control/spacing token; scale the glyph
  with it (or `1em`).

### 2.3 Icon glyphs hardcoded ~1rem across many components — LOW (batch)
- **Files (from grep):** `Select.vue` chevron, `Collapsible.vue`,
  `AccordionHeader.vue` chevron, `Breadcrumb.vue` separator, `ComboboxInput.vue`,
  `NumberField.vue`/`DatePicker.vue` steppers, `TreeTable.vue` toggles — all
  hardcode `1rem` (or `0.875rem`) icon sizes.
- Individually minor and acceptable at `regular`/`comfortable`, but collectively
  iconography doesn't track the text beside it as density changes.
- **Fix:** introduce one `--stance-control-icon-size` token (density-owned) or
  standardize on `1em` for inline icons, then sweep. Lower priority than 1.x
  because these sit next to text that itself only changes modestly.

### 2.4 Input height is padding-derived; Button height is token-derived — LOW
- **Files:** `Input.vue` (no `min-height`; height = `padding-block` +
  line-height) vs `Button.vue` (`min-height: var(--stance-control-height-*)`).
- A common Input+Button row ("email + Save") won't stay height-matched across
  densities because the two compute height differently.
- **Fix:** give `.stance-input-wrapper` a `min-height: var(--stance-control-height-md, 2.5rem)`
  so inputs and buttons track together, or document the pairing constraint.

---

## Observations that are NOT bugs (stated to prevent re-litigation)

- **`comfortable` typography is byte-identical to `regular`** (same `fontSize` and
  `lineHeight`; only spacing/radius/control differ — see `crisp.ts` vs
  `neutral.ts`). So `comfortable` reads as "regular with tighter padding," not a
  distinct type rhythm. Defensible per crisp's stated identity ("denser spacing,
  same type"). Flag for a product call, don't silently change.
- **`fun`/`relaxed` soft shadows are NOT too heavy.** Checked `card-...-fun`
  light and dark: the diffuse shadow reads airy/appropriate, not clashing. No action.
- **Nesting radius is correct.** Button `radius-md` inside Card `radius-lg` keeps
  inner < outer across all densities. No action.
- **Color/contrast:** reviewed token values + light and dark renders (Card
  fun/serious/crisp, Badge crisp-dark). No contrast regression spotted. The
  lowest-contrast pairing is `muted-foreground` on `muted` (dark "neutral" badge,
  weekday headers, descriptions) but it clears AA; the automated axe matrix (4
  palettes × 2 modes) already guards this axis. The warning role's deliberate
  dark-on-amber foreground exists to clear AA — **do not soften it.**

---

## Coverage gaps (be honest about what isn't baselined)

- **Density baselines are neutral-palette, light-mode only** (`visual.spec.ts`
  loops `allThemes[0]` for any non-`light`/`dark` capture). So the prompt's
  requested "extreme combo" (e.g. `compact` density × a vivid palette, or any
  dark-mode density) is **not in the baseline set**. Findings 1.1–1.5 are reasoned
  from token math + component CSS + the neutral-light density captures; they'd
  benefit from a fresh screenshot at e.g. `fun` palette × `compact` density,
  dark. I did not spin up the dev server to generate these (read-only review) —
  flagging rather than fabricating an assessment.
- **Tooltip "Density" captures don't appear to surface an open tooltip.** The four
  `tooltip-density-*` snapshots differ by hash but visually show only the trigger
  buttons — so tooltip overlay geometry across densities (`tooltipMaxWidth`
  14/15/16/18rem) is effectively unverified. Confirm the variant actually opens
  the panel before trusting those baselines.

---

## Systemic recommendation (single root-cause fix)

One coordinated pass, not dozens of patches: **audit every hardcoded px/rem
sub-dimension that lives inside a control whose outer size is already a
`--stance-control-*` token, and make it relative** (a fraction of the owning
token, `1em`, or `1lh`) — or add the one missing token where none exists
(icon-size; Pagination height). Sequence by impact:

1. **1.1 Switch thumb** — most visibly broken; token math already lines up.
2. **1.4 Calendar** + **1.5 Pagination** — whole sub-parts/components that skip
   density; highest "this looks unfinished" payoff.
3. **1.2 / 1.3** — indicator ratios + optical offset (Checkbox/Radio/Switch).
4. **2.x** — Badge/Toast/icon-token sweep + Input height, as cleanup.

Scope is small and mechanical once 1.1's `calc`-from-token approach is accepted:
it touches Switch, Checkbox, Radio, Calendar, Pagination, Badge, Toast, Input,
plus an optional icon-size token in `themes/src/types.ts` + `compile.ts` if 2.3
is taken on.

## Verification (for whoever implements)

- After each fix, regenerate the affected component's density baselines and
  eyeball at all 4 densities (Switch/Calendar/Pagination especially).
- Add the missing extreme-combo capture the coverage gap calls out (e.g. `fun` ×
  `compact`, dark) at least for Switch/Calendar to lock in the proportional fix.
- Re-run the axe matrix (unchanged 4 palettes × 2 modes) to confirm no
  contrast/hit-target regression from the sizing changes.
