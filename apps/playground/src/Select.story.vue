<script setup lang="ts">
import { ref } from "vue";
import { Select } from "@stance-dev/core";
import { useStoryTheme } from "./useStoryTheme";

const { storyTheme, themes, densityProfiles } = useStoryTheme();

const fruit = ref("");
const invalidFruit = ref("");
</script>

<template>
  <Story title="Select">
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
            <h3 class="mb-2 text-sm font-medium opacity-70">States</h3>
            <div class="space-y-2">
              <Select aria-label="Default" placeholder="Choose a fruit">
                <option value="apple">Apple</option>
                <option value="banana">Banana</option>
              </Select>
              <Select aria-label="Preselected" model-value="banana">
                <option value="apple">Apple</option>
                <option value="banana">Banana</option>
              </Select>
              <Select aria-label="Disabled" disabled placeholder="Choose a fruit">
                <option value="apple">Apple</option>
                <option value="banana">Banana</option>
              </Select>
            </div>
          </div>

          <div>
            <h3 class="mb-2 text-sm font-medium opacity-70">Interactive</h3>
            <Select v-model="fruit" aria-label="Fruit" placeholder="Choose a fruit">
              <option value="apple">Apple</option>
              <option value="banana">Banana</option>
              <option value="cherry">Cherry</option>
            </Select>
            <p class="mt-1 text-sm opacity-70">Selected: {{ fruit || "(none)" }}</p>
          </div>

          <div>
            <h3 class="mb-2 text-sm font-medium opacity-70">Invalid + error slot</h3>
            <Select v-model="invalidFruit" aria-label="Fruit" placeholder="Choose a fruit" :invalid="!invalidFruit">
              <option value="apple">Apple</option>
              <option value="banana">Banana</option>
              <template #error>You must choose a fruit.</template>
            </Select>
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
          <Select aria-label="Default" placeholder="Choose a fruit">
            <option value="apple">Apple</option>
            <option value="banana">Banana</option>
          </Select>
        </section>
      </div>
    </Variant>

    <Variant title="Narrow container (responsive check)">
      <div class="mx-auto max-w-[240px] space-y-3 border p-4" :data-theme="storyTheme">
        <Select aria-label="Fruit" placeholder="Choose a fruit with a fairly long placeholder">
          <option value="apple">Apple, a fairly long option label</option>
          <option value="banana">Banana</option>
        </Select>
      </div>
    </Variant>
  </Story>
</template>
