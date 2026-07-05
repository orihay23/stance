---
layout: home

hero:
  name: stance
  text: A Vue 3 component library
  tagline: Opinionated, accessible, themeable — built so Tailwind consumers can override styling without specificity fights.
  actions:
    - theme: brand
      text: Getting Started
      link: /getting-started
    - theme: alt
      text: Theming Guide
      link: /theming
    - theme: alt
      text: Browse Components
      link: /components

features:
  - title: Accessible by default
    details: Every component targets WCAG 2.1 AA / Section 508 — correct ARIA roles/states, full keyboard operability, and focus rings that survive theme overrides.
  - title: No !important, ever
    details: Base styles are wrapped in :where() to keep specificity at zero, so a single Tailwind utility class on your side wins by default.
  - title: Runtime theming
    details: Swap themes and light/dark mode with a data-theme attribute and a class — no rebuild required.
  - title: Responsive by default
    details: Container queries handle component-internal layout shifts (like DataTable's card collapse), since these components get dropped into layouts they don't control.
---
