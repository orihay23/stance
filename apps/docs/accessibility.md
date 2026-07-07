<script setup lang="ts">
import { Badge } from "@stance/core";
</script>

# Accessibility

<Badge variant="success">WCAG 2.1 AA</Badge>
<Badge variant="success">Section 508</Badge>

Accessibility is a target every component is built against, not a pass
applied afterward: **WCAG 2.1 AA / Section 508**. A component isn't
considered done until it has correct ARIA roles/states, full keyboard
operability, a visible focus ring that survives theme overrides, and a
passing automated accessibility test in every theme × light/dark
combination — see the Definition of Done in the project's `CLAUDE.md` for
the exact checklist every component is held to.

## What "no `!important`" means for you

Component CSS is written entirely with [`:where()`](https://developer.mozilla.org/en-US/docs/Web/CSS/:where)-wrapped
selectors, which keeps every internal rule at **specificity zero**. Combined
with `tailwind-merge` deduping on each component's `class` prop, this means:

- A single Tailwind utility class you pass always wins over the internal
  default — no `!important`, no extra-specific selector, no fighting the
  library.
- **You inherit the responsibility that comes with that power.** If you
  override a focus-ring color, contrast-checked background, or
  `prefers-reduced-motion` behavior, the library can no longer guarantee the
  result meets AA — the override is now your styling decision. The
  components hand you a compliant default and an unobstructed way to change
  it; they don't (and structurally can't) validate what you change it to.
- This cuts the other way too: if a component's *default* rendering fails an
  accessibility check, that's a bug in the library, not something you're
  expected to work around with your own CSS.

## Keyboard conventions used across every component

| Interaction | Convention |
| --- | --- |
| Tab / Shift+Tab | Moves focus between components normally. Composite widgets (see below) expose exactly one stop in the base Tab sequence, not one per internal item. |
| Enter / Space | Activates the focused control — buttons, checkboxes, toggle items, menu items. This falls out of using real `<button>`/`<input>` elements rather than reimplementing activation semantics. |
| Escape | Closes the nearest open overlay (Dialog, Popover, Tooltip) and returns focus to whatever triggered it — never left stranded on a now-hidden element. |
| Arrow keys (+ Home/End) | Move roving focus *within* a composite widget once it has focus — Tabs (Left/Right, or Up/Down when `vertical`), Dropdown Menu items (Up/Down). Radio groups get the same behavior for free from the native `<input type="radio">` grouping — no reimplementation needed there. |
| Disabled controls | Removed from tab order entirely (native `disabled`), not just visually dimmed with clicks silently swallowed. |

Modal surfaces (Dialog) trap Tab within themselves while open — tabbing off
the last focusable element wraps to the first, and back again in reverse —
so keyboard users can never tab "behind" a modal into the page underneath.

## How this is verified

- **Automated**: every component's test suite runs its rendered output
  through `axe-core`, once per theme and once each for light and dark mode.
  A component isn't merged with a failing axe check in any of those
  combinations.
- **Manual**: test files also carry a keyboard-nav checklist as a doc
  comment (tab order, activation keys, focus-visible appearance) for the
  interaction paths automated testing can't fully cover — jsdom doesn't
  render focus rings or evaluate real layout, so those get a documented
  manual pass alongside the automated one.
- **Screen readers**: state that changes without a visible page navigation —
  a filtered result count, a new pagination page, a toast appearing — is
  announced through a shared visually-hidden `aria-live` region, not just
  updated silently in the DOM. Sort changes are the deliberate exception:
  DataTable/TreeTable update `aria-sort` on the column header rather than
  firing a separate live-region announcement. This follows the [WAI-ARIA
  Authoring Practices sortable-table
  pattern](https://www.w3.org/WAI/ARIA/apg/patterns/table/) — a screen
  reader announces a column header's `aria-sort` change on its own because
  the change happens on the same element that has (or had) focus, the same
  way `aria-expanded`/`aria-pressed` changes are announced without a
  separate live region.
