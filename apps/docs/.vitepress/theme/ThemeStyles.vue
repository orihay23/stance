<script setup lang="ts">
import { compileTheme, neutral } from "@stance/themes";

// Declarative <style> rendering (not document.head.appendChild) so this
// works identically during VitePress's SSR prerender and on the client —
// Vue just serializes the tag with this textContent as part of the
// server-rendered HTML, no `document` access required.
const css = compileTheme(neutral);
</script>

<template>
  <component :is="'style'" v-html="css" />
</template>
