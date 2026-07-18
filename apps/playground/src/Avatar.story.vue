<script setup lang="ts">
import { Avatar, type AvatarSize } from "@stance-dev/core";
import { useStoryTheme } from "./useStoryTheme";

const { storyTheme, themes, densityProfiles } = useStoryTheme();

const sizes: AvatarSize[] = ["sm", "md", "lg", "xl"];
</script>

<template>
  <Story title="Avatar">
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
            <h3 class="mb-2 text-sm font-medium opacity-70">Sizes (initials fallback)</h3>
            <div class="flex flex-wrap items-center gap-3">
              <Avatar v-for="size in sizes" :key="size" :size="size" name="Bea Nakamura" />
            </div>
          </div>

          <div>
            <h3 class="mb-2 text-sm font-medium opacity-70">Image (with graceful error fallback)</h3>
            <div class="flex flex-wrap items-center gap-3">
              <Avatar
                src="https://images.example/does-not-exist.jpg"
                name="Amir Osei"
              />
              <p class="max-w-xs text-sm opacity-70">
                This one points at a URL that 404s — it falls back to initials instead of a broken-image icon.
              </p>
            </div>
          </div>

          <div>
            <h3 class="mb-2 text-sm font-medium opacity-70">One-word name and explicit initials override</h3>
            <div class="flex flex-wrap items-center gap-3">
              <Avatar name="Cher" />
              <Avatar name="Devon Reyes-Whitfield" initials="DR" />
            </div>
          </div>

          <div>
            <h3 class="mb-2 text-sm font-medium opacity-70">Purely decorative (no name — generic icon, hidden from AT)</h3>
            <div class="flex flex-wrap items-center gap-3">
              <Avatar />
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
          <div class="flex flex-wrap items-center gap-2">
            <Avatar v-for="size in sizes" :key="size" :size="size" name="Bea Nakamura" />
          </div>
        </section>
      </div>
    </Variant>
  </Story>
</template>
