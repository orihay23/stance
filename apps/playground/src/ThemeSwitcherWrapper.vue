<script setup lang="ts">
import { onMounted, onUnmounted } from "vue";
import { allDensityProfiles, allPalettes, allThemes, compileDensityProfiles, compilePalettes, compileThemes } from "@stance/themes";
import { storyDensity, storyTheme } from "./useStoryTheme";

/**
 * Registered globally via histoire.setup.ts's addWrapper() — wraps every
 * story's rendered output, rather than living inside any individual story
 * file. Histoire's <Story> component (@histoire/plugin-vue 1.0.0-beta.1)
 * has a bug where its slot-processing walk (Story.ts's applyAttrs) treats
 * any non-<Variant> sibling's plain-string vnode children as an iterable
 * list of vnodes — a single interpolated text child like `{{ theme.name }}`
 * gets its "children" string iterated character-by-character and rejoined
 * with commas. That only triggers for content placed *inside* <Story>'s
 * own slot, so this switcher lives one level up instead, as this wrapper's
 * own markup around <slot />, never entering that codepath.
 *
 * Phase 14/D3 (design-docs/theme-axes.md §6): injects the new
 * data-theme-palette/data-theme-density stylesheets alongside the legacy
 * one, rather than replacing it — every existing story still binds only to
 * `data-theme` (the legacy bundled axis, untouched), while new
 * palette/density-aware content (e.g. each component's "Density" variant)
 * can use the new attributes. No element in this codebase carries both a
 * legacy `data-theme` and a new `data-theme-density` at once, so there's
 * no cascade-ordering risk between the two stylesheets to reason about.
 */
let styleEl: HTMLStyleElement | null = null;

onMounted(() => {
  styleEl = document.createElement("style");
  styleEl.textContent = [compileThemes(allThemes), compilePalettes(allPalettes), compileDensityProfiles(allDensityProfiles)].join(
    "\n\n",
  );
  document.head.appendChild(styleEl);
});

onUnmounted(() => {
  styleEl?.remove();
});
</script>

<template>
  <div class="flex items-center gap-4 border-b p-3 text-sm">
    <div class="flex items-center gap-2">
      <label for="story-theme-select" class="font-medium">Theme</label>
      <select id="story-theme-select" v-model="storyTheme" class="rounded border px-2 py-1 capitalize">
        <option v-for="theme in allThemes" :key="theme.name" :value="theme.name">{{ theme.name }}</option>
      </select>
    </div>
    <div class="flex items-center gap-2">
      <label for="story-density-select" class="font-medium">Density</label>
      <select id="story-density-select" v-model="storyDensity" class="rounded border px-2 py-1 capitalize">
        <option v-for="profile in allDensityProfiles" :key="profile.name" :value="profile.name">{{ profile.name }}</option>
      </select>
    </div>
  </div>
  <slot />
</template>
