# Versioning policy

`@stance/core` and `@stance/themes` (both published — see "What gets
published" below) follow [semver](https://semver.org/), but 0.x semver
technically permits a breaking change in any minor bump. This doc states a
stricter policy we hold ourselves to voluntarily, because that's already how
every feature in this codebase has actually shipped — this is a write-down
of existing practice, not a new constraint.

## What gets published

Both `@stance/core` and `@stance/themes` are published, independently
versioned (not `fixed`/`linked` in Changesets — they change for different
reasons on different cadences: a new component doesn't need a themes
release, a new palette doesn't need a core release). This isn't a style
choice: `@stance/core`'s own compiled CSS is 100% `var(--stance-*,
fallback)` references — it contains zero `data-theme*` selectors and zero
actual token *values*. Real palette/density CSS only exists once a
consumer calls `compilePalettes`/`compileDensityProfiles` (or the legacy
`compileThemes`) from `@stance/themes` and includes the result. Without
`@stance/themes`, `@stance/core`'s components render structurally but
carry no theme at all. `apps/docs` (the theme picker), `apps/playground`,
and `apps/visual-tests` stay private/unpublished — they're consumers and
tooling, not library surface.

## What "additive by default" has meant in practice

Every mode-prop we've added defaults to prior behavior rather than changing
it out from under existing consumers: `DataTable`'s `selectionMode`,
`paginationMode`, and `Grid`'s `responsiveMode` all default to "off"/the
original single behavior, and existing props kept working unmodified when
a new mode was introduced alongside them. The Phase 14 `data-theme="..."`
→ `data-theme-palette`/`data-theme-density` split is the clearest example:
the old attribute still compiles to byte-identical CSS via the
`legacyThemes` shim (`@stance/themes`), with a dev-mode-only deprecation
warning pointing at the migration guide — nothing broke silently. This
policy just names that pattern so it's a commitment, not a habit.

## Version bump meanings

- **Patch (`0.x.PATCH`)**: bug fixes, accessibility fixes, new density or
  palette values that don't rename or remove an existing token, doc-only
  changes.
- **Minor (`0.x.MINOR`)**: new components, new opt-in props/features, new
  first-party palettes/density profiles. This is the default, easy choice —
  the vast majority of Phase 1–15 work would have been a minor bump.
- **A real breaking change** (removing the `legacyThemes` shim is the
  concrete example on the table right now; renaming or removing an existing
  `--stance-*` token would be another): reserved for a **deliberate,
  called-out release**, never something that rides along silently inside a
  routine minor bump. A breaking release must:
  - Ship its own dedicated changeset entry described as a breaking change
    (not lumped into an unrelated feature's changeset)
  - Come with a migration note in the changelog and, for anything
    consumer-facing, an update to the relevant docs page
  - Wait at least **6 minor releases** after the deprecation warning first
    shipped, so there's a real window for consumers to see the warning and
    migrate before it's acted on. For `legacyThemes` specifically: the
    warning shipped in Phase 14/D1 (the first published version, `0.1.0`,
    already includes it), so the shim cannot be removed before `0.7.0` at
    the earliest — and even then, only as its own explicit, migration-noted
    release, not automatically once that version number is reached.

This 6-minor floor is a starting number, not a law of nature — it can be
revisited if real adoption data suggests otherwise, but the point is that
some stated floor exists rather than "whenever it's convenient."

## Changesets: never select "major" pre-1.0

This part of the policy is stricter than it might first read, and it's
stricter *because we checked, not because we assumed*: Changesets does
**not** have a "0.x-aware" mode that keeps a `major`-flagged changeset
inside the `0.x` line. Verified directly (`changeset status` against a
scratch `major` changeset on a `0.0.0` package): it proposes `0.0.0` →
`1.0.0`, a real major release, exactly per strict semver — under strict
semver, going from `0.x` to `1.0.0` *is* the major bump. There is no config
flag to change this.

Given that, and given the "1.0.0 is a separate decision" stance below, the
practical rule is: **while pre-1.0, no changeset in this repo ever selects
`major`.** A breaking change pre-1.0 (per the section above) still uses
`minor` — it's the largest bump pre-1.0 permits, it stays called-out via its
own dedicated changeset and migration note, and it does not accidentally
graduate the package to `1.0.0` as a side effect of someone picking the
intuitive-sounding bump level. `major` is reserved for the actual, deliberate
1.0.0 graduation itself, decided the way the next section describes — never
picked casually for an in-0.x breaking change.

## 1.0.0 is a separate decision

Reaching `1.0.0` is tied to **API stability** — the theme axes, component
prop surfaces, and slot conventions no longer needing structural revision —
not to component count or feature completeness. The component set is
already fairly complete under `0.x`; that's deliberate, and this doc does
not set a date or a checklist for `1.0.0`. That's a future decision made
separately, when it's actually time to make it.
