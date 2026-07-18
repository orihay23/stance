<script setup lang="ts">
import { Breadcrumb, type BreadcrumbItem } from "@stance-dev/core";
import { useStoryTheme } from "./useStoryTheme";

const { storyTheme, themes, densityProfiles } = useStoryTheme();

const items: BreadcrumbItem[] = [
  { label: "Home", href: "/" },
  { label: "Team", href: "/team" },
  { label: "Members", href: "/team/members" },
  { label: "Roles", href: "/team/members/roles" },
  { label: "Editor" },
];
</script>

<template>
  <Story title="Breadcrumb">
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
            <h3 class="mb-2 text-sm font-medium opacity-70">Wide container — every item shown</h3>
            <Breadcrumb :items="items" />
          </div>

          <div>
            <h3 class="mb-2 text-sm font-medium opacity-70">Single item (current page only)</h3>
            <Breadcrumb :items="[{ label: 'Dashboard' }]" />
          </div>

          <div>
            <h3 class="mb-2 text-sm font-medium opacity-70">Two items, no collapsing needed</h3>
            <Breadcrumb :items="[{ label: 'Home', href: '/' }, { label: 'Settings' }]" />
          </div>
        </section>
      </div>
    </Variant>

    <Variant title="Density">
      <div class="grid grid-cols-1 gap-6 p-6 md:grid-cols-2" data-theme-palette="neutral">
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
          <Breadcrumb :items="items" />
        </section>
      </div>
    </Variant>

    <Variant title="Narrow container (responsive check — collapses to '…')">
      <div class="space-y-8 p-6" :data-theme="storyTheme" :style="{ color: 'var(--stance-color-foreground)' }">
        <div v-for="width in [500, 350, 220]" :key="width">
          <h3 class="mb-2 text-sm font-medium opacity-70">{{ width }}px container</h3>
          <div :style="{ width: `${width}px`, border: '1px dashed var(--stance-color-border)', padding: '0.5rem' }">
            <Breadcrumb :items="items" />
          </div>
        </div>
      </div>
    </Variant>
  </Story>
</template>
