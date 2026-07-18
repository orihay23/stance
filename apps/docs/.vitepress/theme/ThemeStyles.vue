<script setup lang="ts">
import { allDensityProfiles, allPalettes, allThemes, compileDensityProfiles, compilePalettes, compileThemes } from "@stance-dev/themes";

// Declarative <style> rendering (not document.head.appendChild) so this
// works identically during VitePress's SSR prerender and on the client —
// Vue just serializes the tag with this textContent as part of the
// server-rendered HTML, no `document` access required.
//
// Compiles every theme, not just the active one — the docs site's
// data-theme attribute currently only ever gets set to "neutral" (no
// theme-name picker UI exists yet, just a light/dark toggle), but this
// keeps the compiled CSS ready for every theme in `allThemes` rather than
// needing to remember to update this file each time a new one ships.
//
// Phase 14/D3 (design-docs/theme-axes.md §6): also compiles the new
// data-theme-palette/data-theme-density stylesheets, even though no docs
// page sets those attributes yet — same "ready before it's used" rationale
// as the legacy compileThemes(allThemes) line above.
const css = [compileThemes(allThemes), compilePalettes(allPalettes), compileDensityProfiles(allDensityProfiles)].join(
  "\n\n",
);
</script>

<template>
  <component :is="'style'" v-html="css" />
</template>
