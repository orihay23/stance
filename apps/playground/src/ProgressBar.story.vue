<script setup lang="ts">
import { ref } from "vue";
import { ProgressBar } from "@stance/core";
import { useStoryTheme } from "./useStoryTheme";

const { storyTheme, themes, densityProfiles } = useStoryTheme();

const lightValue = ref(40);
const darkValue = ref(65);
</script>

<template>
  <Story title="ProgressBar">
    <Variant title="Light + Dark">
      <div class="grid grid-cols-1 gap-8 p-6 md:grid-cols-2">
        <section
          :data-theme="storyTheme"
          class="space-y-6 rounded-lg border p-6"
          :style="{
            background: 'var(--stance-color-background)',
            color: 'var(--stance-color-foreground)',
            borderColor: 'var(--stance-color-border)',
          }"
        >
          <h2 class="text-lg font-semibold">Light</h2>

          <div>
            <h3 class="mb-2 text-sm font-medium opacity-70">Determinate</h3>
            <ProgressBar :value="lightValue" label="Upload progress">
              <template #default="{ percent }">
                <span class="text-sm opacity-70">{{ Math.round(percent) }}%</span>
              </template>
            </ProgressBar>
            <input v-model.number="lightValue" type="range" min="0" max="100" class="mt-2 w-full" />
          </div>

          <div>
            <h3 class="mb-2 text-sm font-medium opacity-70">Indeterminate</h3>
            <ProgressBar indeterminate label="Loading" />
          </div>
        </section>

        <section
          :data-theme="storyTheme"
          class="dark space-y-6 rounded-lg border p-6"
          :style="{
            background: 'var(--stance-color-background)',
            color: 'var(--stance-color-foreground)',
            borderColor: 'var(--stance-color-border)',
          }"
        >
          <h2 class="text-lg font-semibold">Dark</h2>

          <div>
            <h3 class="mb-2 text-sm font-medium opacity-70">Determinate</h3>
            <ProgressBar :value="darkValue" label="Upload progress">
              <template #default="{ percent }">
                <span class="text-sm opacity-70">{{ Math.round(percent) }}%</span>
              </template>
            </ProgressBar>
            <input v-model.number="darkValue" type="range" min="0" max="100" class="mt-2 w-full" />
          </div>

          <div>
            <h3 class="mb-2 text-sm font-medium opacity-70">Indeterminate</h3>
            <ProgressBar indeterminate label="Loading" />
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
          <ProgressBar :value="60" label="Upload progress" />
        </section>
      </div>
    </Variant>

    <Variant title="Narrow container (responsive check)">
      <div class="mx-auto max-w-[240px] space-y-4 border p-4" :data-theme="storyTheme">
        <ProgressBar :value="72" label="Storage used" />
        <ProgressBar indeterminate label="Syncing" />
      </div>
    </Variant>
  </Story>
</template>
