<script setup lang="ts">
import { onMounted, onUnmounted } from "vue";
import { allThemes, compileThemes } from "@stance/themes";
import { storyTheme } from "./useStoryTheme";

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
 */
let styleEl: HTMLStyleElement | null = null;

onMounted(() => {
  styleEl = document.createElement("style");
  styleEl.textContent = compileThemes(allThemes);
  document.head.appendChild(styleEl);
});

onUnmounted(() => {
  styleEl?.remove();
});
</script>

<template>
  <div class="flex items-center gap-2 border-b p-3 text-sm">
    <label for="story-theme-select" class="font-medium">Theme</label>
    <select id="story-theme-select" v-model="storyTheme" class="rounded border px-2 py-1 capitalize">
      <option v-for="theme in allThemes" :key="theme.name" :value="theme.name">{{ theme.name }}</option>
    </select>
  </div>
  <slot />
</template>
