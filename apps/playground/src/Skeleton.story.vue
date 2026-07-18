<script setup lang="ts">
import { Skeleton } from "@stance-dev/core";
import { useStoryTheme } from "./useStoryTheme";

const { storyTheme, densityProfiles } = useStoryTheme();
</script>

<template>
  <Story title="Skeleton">
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
            <h3 class="mb-2 text-sm font-medium opacity-70">Pulse (default)</h3>
            <div class="flex items-center gap-3">
              <Skeleton class="h-10 w-10 rounded-full" />
              <div class="space-y-2">
                <Skeleton class="h-3 w-40" />
                <Skeleton class="h-3 w-28" />
              </div>
            </div>
          </div>

          <div>
            <h3 class="mb-2 text-sm font-medium opacity-70">Shimmer</h3>
            <div class="space-y-2">
              <Skeleton variant="shimmer" class="h-4 w-full" />
              <Skeleton variant="shimmer" class="h-4 w-5/6" />
              <Skeleton variant="shimmer" class="h-4 w-2/3" />
            </div>
          </div>

          <div>
            <h3 class="mb-2 text-sm font-medium opacity-70">Card placeholder</h3>
            <div class="space-y-3 rounded-md border p-4" :style="{ borderColor: 'var(--stance-color-border)' }">
              <Skeleton class="h-32 w-full" />
              <Skeleton class="h-4 w-3/4" />
              <Skeleton class="h-3 w-1/2" />
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
          <div class="flex items-center gap-3">
            <Skeleton class="h-10 w-10 rounded-full" />
            <div class="space-y-2">
              <Skeleton class="h-3 w-40" />
              <Skeleton class="h-3 w-28" />
            </div>
          </div>
        </section>
      </div>
    </Variant>
  </Story>
</template>
