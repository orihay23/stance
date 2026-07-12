<script setup lang="ts">
import { Separator } from "@stance/core";
import { useStoryTheme } from "./useStoryTheme";

const { storyTheme, densityProfiles } = useStoryTheme();
</script>

<template>
  <Story title="Separator">
    <Variant title="Light + Dark">
      <div class="grid grid-cols-1 gap-8 p-6 md:grid-cols-2">
        <section
          v-for="mode in ['light', 'dark']"
          :key="mode"
          :data-theme="storyTheme"
          :class="['space-y-6 rounded-lg border p-6', mode === 'dark' && 'dark']"
          :style="{
            background: 'var(--stance-color-background)',
            color: 'var(--stance-color-foreground)',
            borderColor: 'var(--stance-color-border)',
          }"
        >
          <h2 class="text-lg font-semibold capitalize">{{ mode }}</h2>

          <div>
            <h3 class="mb-2 text-sm font-medium opacity-70">Horizontal, dividing stacked content</h3>
            <div class="space-y-3">
              <p class="text-sm">Section one</p>
              <Separator />
              <p class="text-sm">Section two</p>
            </div>
          </div>

          <div>
            <h3 class="mb-2 text-sm font-medium opacity-70">Vertical, dividing inline content</h3>
            <div class="flex h-6 items-center gap-3">
              <span class="text-sm">Docs</span>
              <Separator orientation="vertical" />
              <span class="text-sm">Source</span>
              <Separator orientation="vertical" />
              <span class="text-sm">Changelog</span>
            </div>
          </div>
        </section>
      </div>
    </Variant>

    <Variant title="Density">
      <div class="grid grid-cols-1 gap-6 p-6 sm:grid-cols-2 lg:grid-cols-4" data-theme-palette="neutral">
        <section
          v-for="profile in densityProfiles"
          :key="profile.name"
          :data-theme-density="profile.name"
          class="space-y-3 rounded-lg border p-4"
          :style="{
            background: 'var(--stance-color-background)',
            color: 'var(--stance-color-foreground)',
            borderColor: 'var(--stance-color-border)',
          }"
        >
          <h2 class="text-sm font-semibold capitalize">{{ profile.name }}</h2>
          <div class="space-y-3">
            <p class="text-sm">Section one</p>
            <Separator />
            <p class="text-sm">Section two</p>
          </div>
        </section>
      </div>
    </Variant>

    <Variant title="Decorative (aria-hidden, no role)">
      <div class="space-y-4 p-6" :data-theme="storyTheme" :style="{ color: 'var(--stance-color-foreground)' }">
        <p class="text-sm opacity-70">
          For a purely visual rule with no semantic grouping meaning — the surrounding content already conveys the
          separation, so assistive tech should skip right over it.
        </p>
        <div class="space-y-3">
          <p class="text-sm">Above the rule</p>
          <Separator decorative />
          <p class="text-sm">Below the rule</p>
        </div>
      </div>
    </Variant>
  </Story>
</template>
