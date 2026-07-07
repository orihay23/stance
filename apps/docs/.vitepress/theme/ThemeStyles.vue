<script setup lang="ts">
import { allThemes, compileThemes } from "@stance/themes";

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
const css = compileThemes(allThemes);
</script>

<template>
  <component :is="'style'" v-html="css" />
</template>
