<script setup lang="ts">
import { ref } from "vue";
import { Button, type ButtonSize, type ButtonVariant } from "@stance/core";
import { useStoryTheme } from "./useStoryTheme";

const { storyTheme, themes, densityProfiles } = useStoryTheme();

const variants: ButtonVariant[] = ["primary", "secondary", "ghost", "destructive"];
const sizes: ButtonSize[] = ["sm", "md", "lg"];

const clickCount = ref(0);
</script>

<template>
  <Story title="Button">
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
            <h3 class="mb-2 text-sm font-medium opacity-70">Variants</h3>
            <div class="flex flex-wrap items-center gap-3">
              <Button v-for="variant in variants" :key="variant" :variant="variant" @click="clickCount++">
                {{ variant }}
              </Button>
            </div>
          </div>

          <div>
            <h3 class="mb-2 text-sm font-medium opacity-70">Sizes</h3>
            <div class="flex flex-wrap items-center gap-3">
              <Button v-for="size in sizes" :key="size" :size="size"> Button {{ size }} </Button>
            </div>
          </div>

          <div>
            <h3 class="mb-2 text-sm font-medium opacity-70">States</h3>
            <div class="flex flex-wrap items-center gap-3">
              <Button>Default</Button>
              <Button disabled>Disabled</Button>
              <Button loading>Loading</Button>
            </div>
          </div>

          <div>
            <h3 class="mb-2 text-sm font-medium opacity-70">Icon-only (requires ariaLabel)</h3>
            <div class="flex flex-wrap items-center gap-3">
              <Button icon-only aria-label="Close" variant="primary">
                <svg viewBox="0 0 20 20" fill="none" width="16" height="16" aria-hidden="true">
                  <path d="M5 5l10 10M15 5L5 15" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
                </svg>
              </Button>
              <Button icon-only aria-label="Close" variant="ghost">
                <svg viewBox="0 0 20 20" fill="none" width="16" height="16" aria-hidden="true">
                  <path d="M5 5l10 10M15 5L5 15" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
                </svg>
              </Button>
            </div>
          </div>

          <div>
            <h3 class="mb-2 text-sm font-medium opacity-70">Destructive × sizes</h3>
            <div class="flex flex-wrap items-center gap-3">
              <Button v-for="size in sizes" :key="size" :size="size" variant="destructive"> Delete </Button>
            </div>
          </div>

          <p class="text-sm opacity-70">Clicks so far: {{ clickCount }}</p>
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
          <div class="flex flex-wrap items-center gap-2">
            <Button v-for="size in sizes" :key="size" :size="size">{{ size }}</Button>
          </div>
        </section>
      </div>
    </Variant>

    <Variant title="Narrow container (responsive check)">
      <div class="mx-auto max-w-[240px] space-y-4 border p-4" :data-theme="storyTheme">
        <Button class="w-full">Full-width primary</Button>
        <div class="flex flex-wrap gap-2">
          <Button v-for="variant in variants" :key="variant" :variant="variant" size="sm">
            {{ variant }}
          </Button>
        </div>
      </div>
    </Variant>
  </Story>
</template>
