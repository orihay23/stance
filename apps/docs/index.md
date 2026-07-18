---
layout: home

hero:
  name: stance
  text: A Vue 3 component library
  tagline: Opinionated, accessible, themeable — built so Tailwind consumers can override styling without specificity fights.
  image:
    src: /logo-icon.png
    alt: stance logo
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

<script setup lang="ts">
import { Card, Grid, Badge } from "@stance-dev/core";
</script>

<div class="stance-showcase">

## Live, in this very page

These aren't screenshots — this `Card`, `Grid`, and `Badge` are the real
`@stance-dev/core` components, themed by the `data-theme` attribute this site
sets on `<html>`. Toggle dark mode (top right) to see them re-theme with
zero rebuild.

<Grid :columns="{ base: 1, md: 3 }" gap="md">
  <Card>
    <h3>Accessible</h3>
    <p>WCAG 2.1 AA targeted, verified with axe-core in every theme × mode.</p>
    <Badge variant="success">axe-clean</Badge>
  </Card>
  <Card>
    <h3>Themeable</h3>
    <p>Every color, radius, and shadow is a CSS custom property.</p>
    <Badge variant="primary">runtime</Badge>
  </Card>
  <Card>
    <h3>Overridable</h3>
    <p>Zero-specificity internals mean your Tailwind classes always win.</p>
    <Badge variant="neutral">no !important</Badge>
  </Card>
</Grid>

</div>

<style scoped>
.stance-showcase {
  max-width: 960px;
  margin: 3rem auto 0;
  padding: 0 24px;
}
</style>
