# Versioning policy

`@stance/core` (and `@stance/themes`, if published — see the Phase 16
package-scope decision) follow [semver](https://semver.org/), but 0.x semver
technically permits a breaking change in any minor bump. This doc states a
stricter policy we hold ourselves to voluntarily, because that's already how
every feature in this codebase has actually shipped — this is a write-down
of existing practice, not a new constraint.

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

## 1.0.0 is a separate decision

Reaching `1.0.0` is tied to **API stability** — the theme axes, component
prop surfaces, and slot conventions no longer needing structural revision —
not to component count or feature completeness. The component set is
already fairly complete under `0.x`; that's deliberate, and this doc does
not set a date or a checklist for `1.0.0`. That's a future decision made
separately, when it's actually time to make it.
