<script setup lang="ts">
import { ref } from "vue";
import { ToggleGroup, ToggleGroupItem } from "@stance-dev/core";
import { useStoryTheme } from "./useStoryTheme";

const { storyTheme, themes, densityProfiles } = useStoryTheme();

const view = ref("list");
const invalidView = ref<string | undefined>(undefined);
</script>

<template>
  <Story title="ToggleGroup">
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
            <h3 class="mb-2 text-sm font-medium opacity-70">Interactive (tab in, then use arrow keys)</h3>
            <ToggleGroup v-model="view">
              <template #legend>View</template>
              <ToggleGroupItem value="list">List</ToggleGroupItem>
              <ToggleGroupItem value="grid">Grid</ToggleGroupItem>
              <ToggleGroupItem value="gallery">Gallery</ToggleGroupItem>
            </ToggleGroup>
            <p class="mt-1 text-sm opacity-70">Selected: {{ view }}</p>
          </div>

          <div>
            <h3 class="mb-2 text-sm font-medium opacity-70">Disabled group</h3>
            <ToggleGroup model-value="list" disabled>
              <template #legend>View</template>
              <ToggleGroupItem value="list">List</ToggleGroupItem>
              <ToggleGroupItem value="grid">Grid</ToggleGroupItem>
            </ToggleGroup>
          </div>

          <div>
            <h3 class="mb-2 text-sm font-medium opacity-70">One disabled option</h3>
            <ToggleGroup model-value="list">
              <template #legend>View</template>
              <ToggleGroupItem value="list">List</ToggleGroupItem>
              <ToggleGroupItem value="grid" disabled>Grid</ToggleGroupItem>
            </ToggleGroup>
          </div>

          <div>
            <h3 class="mb-2 text-sm font-medium opacity-70">Invalid + error slot</h3>
            <ToggleGroup v-model="invalidView" :invalid="!invalidView">
              <template #legend>View</template>
              <ToggleGroupItem value="list">List</ToggleGroupItem>
              <ToggleGroupItem value="grid">Grid</ToggleGroupItem>
              <template #error>You must choose a view.</template>
            </ToggleGroup>
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
          <ToggleGroup model-value="list">
            <template #legend>View</template>
            <ToggleGroupItem value="list">List</ToggleGroupItem>
            <ToggleGroupItem value="grid">Grid</ToggleGroupItem>
          </ToggleGroup>
        </section>
      </div>
    </Variant>

    <Variant title="Narrow container (responsive check)">
      <div class="mx-auto max-w-[240px] border p-4" :data-theme="storyTheme">
        <ToggleGroup model-value="grid">
          <template #legend>Choose a view with a fairly long legend that has to wrap</template>
          <ToggleGroupItem value="list">List</ToggleGroupItem>
          <ToggleGroupItem value="grid">Grid</ToggleGroupItem>
          <ToggleGroupItem value="gallery">Gallery</ToggleGroupItem>
        </ToggleGroup>
      </div>
    </Variant>
  </Story>
</template>
