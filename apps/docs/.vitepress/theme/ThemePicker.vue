<script setup lang="ts">
import { onMounted, ref, watch } from "vue";
import { allDensityProfiles, allPalettes } from "@stance-dev/themes";
import { Popover, PopoverContent, PopoverTrigger, Select, ToggleGroup, ToggleGroupItem } from "@stance-dev/core";

/**
 * Global palette/density picker for the docs site — re-themes the whole
 * page (nav, prose, every embedded component), not a sandboxed story. The
 * light/dark toggle is deliberately NOT duplicated here: VitePress's own
 * built-in appearance toggle already applies a `dark` class to `<html>`,
 * which is exactly the orthogonal third axis stance's own components
 * expect (theme-axes.md §2) — nothing new needed for that piece.
 *
 * Lives inside a Popover rather than rendering the Select/ToggleGroup
 * inline in the nav bar: the nav row is already fairly full (search, page
 * links, appearance toggle, social icon), and a Select plus a 4-option
 * ToggleGroup with full-word density labels doesn't fit there without
 * either being cramped or overflowing — confirmed by hand. A single
 * compact trigger button keeps this component's footprint in the nav row
 * to roughly the same size as the existing appearance toggle, while the
 * actual controls get a floating panel with real room.
 *
 * Persistence + the no-flash-of-default-theme fix both key off the same
 * two localStorage entries; the actual pre-hydration application happens
 * in the inline <script> in config.ts's `head`, which runs before Vue (and
 * before this component) even exists. This component's job is: reflect
 * whatever the inline script already applied (read the live DOM attributes
 * on mount, not localStorage again — they're the same value once the inline
 * script has run, and reading the DOM is one less place to keep in sync),
 * and update both the DOM and localStorage when the user changes a control.
 */

const PALETTE_KEY = "stance-docs-palette";
const DENSITY_KEY = "stance-docs-density";

const open = ref(false);
const palette = ref(allPalettes[0]!.name);
const density = ref(allDensityProfiles[0]!.name);

// Reads the live attribute rather than localStorage directly — the inline
// anti-FOUC script (config.ts) already resolved localStorage vs. default
// before this component ever mounts, so the DOM is the single source of
// truth for "what's actually active right now."
onMounted(() => {
  const root = document.documentElement;
  palette.value = root.getAttribute("data-theme-palette") ?? palette.value;
  density.value = root.getAttribute("data-theme-density") ?? density.value;
});

watch(palette, (value) => {
  document.documentElement.setAttribute("data-theme-palette", value);
  localStorage.setItem(PALETTE_KEY, value);
});

watch(density, (value) => {
  document.documentElement.setAttribute("data-theme-density", value);
  localStorage.setItem(DENSITY_KEY, value);
});
</script>

<template>
  <Popover v-model="open" placement="bottom-end">
    <PopoverTrigger variant="ghost" size="sm">Theme</PopoverTrigger>
    <PopoverContent class="stance-theme-picker">
      <label class="stance-theme-picker__field">
        <span class="stance-theme-picker__label">Palette</span>
        <Select v-model="palette">
          <option v-for="p in allPalettes" :key="p.name" :value="p.name" class="stance-theme-picker__option">
            {{ p.name }}
          </option>
        </Select>
      </label>

      <div class="stance-theme-picker__field">
        <span class="stance-theme-picker__label" aria-hidden="true">Density</span>
        <ToggleGroup v-model="density" class="stance-theme-picker__density">
          <!--
            The visible label above duplicates this for sighted users only
            (aria-hidden) — ToggleGroup's own legend is what a screen
            reader actually announces via aria-labelledby, so it stays
            real but visually hidden rather than removed, avoiding two
            competing accessible names for the same group.
          -->
          <template #legend>
            <span class="stance-visually-hidden">Density</span>
          </template>
          <ToggleGroupItem
            v-for="d in allDensityProfiles"
            :key="d.name"
            :value="d.name"
            class="stance-theme-picker__option"
          >
            {{ d.name }}
          </ToggleGroupItem>
        </ToggleGroup>
      </div>
    </PopoverContent>
  </Popover>
</template>

<style>
.stance-theme-picker {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  min-width: 14rem;
}

.stance-theme-picker__field {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 0.375rem;
}

.stance-theme-picker__label {
  font-size: 0.75rem;
  font-weight: 500;
  color: var(--stance-color-muted-foreground);
}

.stance-theme-picker__option {
  text-transform: capitalize;
}

.stance-theme-picker__density {
  /* Collapses the gap the visually-hidden legend would otherwise leave
     above the options row (ToggleGroup's default column layout puts a
     gap between legend and options regardless of the legend's own
     rendered size). */
  gap: 0;
}

.stance-theme-picker__density :where(.stance-toggle-group__options) {
  /* All 4 density names in one row don't fit within PopoverContent's own
     density-driven max-width (20rem at "regular") — deliberately not
     widening the popover to force a fit, since that cap exists for
     reading comfort generally; wrapping to a second row respects it
     while still fitting "Comfortable" without clipping (found by hand:
     it clipped against the panel's own edge, not the viewport's). */
  flex-wrap: wrap;
  width: auto;
}
</style>
