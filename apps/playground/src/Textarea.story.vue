<script setup lang="ts">
import { ref } from "vue";
import { Textarea } from "@stance-dev/core";
import { useStoryTheme } from "./useStoryTheme";

const { storyTheme, themes, densityProfiles } = useStoryTheme();

const bio = ref("");
const autoGrowValue = ref("");
const invalidBio = ref("");
</script>

<template>
  <Story title="Textarea">
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
            <h3 class="mb-2 text-sm font-medium opacity-70">Fixed height (native resize handle)</h3>
            <Textarea aria-label="Fixed" placeholder="Fixed 3 rows, drag the corner to resize" />
          </div>

          <div>
            <h3 class="mb-2 text-sm font-medium opacity-70">States</h3>
            <div class="space-y-2">
              <Textarea aria-label="Disabled" disabled placeholder="Disabled" />
              <Textarea aria-label="Readonly" readonly model-value="Can't edit this" />
            </div>
          </div>

          <div>
            <h3 class="mb-2 text-sm font-medium opacity-70">Auto-grow (type to see it grow, capped at 6 rows)</h3>
            <Textarea
              v-model="autoGrowValue"
              aria-label="Auto-grow"
              auto-grow
              :max-rows="6"
              placeholder="Starts at 3 rows, grows up to 6, then scrolls"
            />
          </div>

          <div>
            <h3 class="mb-2 text-sm font-medium opacity-70">Interactive</h3>
            <Textarea v-model="bio" aria-label="Bio" placeholder="Tell us about yourself" />
            <p class="mt-1 text-sm opacity-70">{{ bio.length }} characters</p>
          </div>

          <div>
            <h3 class="mb-2 text-sm font-medium opacity-70">Invalid + error slot</h3>
            <Textarea v-model="invalidBio" aria-label="Bio" :invalid="!invalidBio" placeholder="Required field">
              <template #error>This field is required.</template>
            </Textarea>
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
          <Textarea aria-label="Fixed" placeholder="Fixed 3 rows" />
        </section>
      </div>
    </Variant>

    <Variant title="Narrow container (responsive check)">
      <div class="mx-auto max-w-[240px] space-y-3 border p-4" :data-theme="storyTheme">
        <Textarea aria-label="Fixed narrow" placeholder="Fixed height in a narrow column" />
        <Textarea aria-label="Auto-grow narrow" auto-grow :max-rows="5" placeholder="Auto-grow in a narrow column" />
      </div>
    </Variant>
  </Story>
</template>
