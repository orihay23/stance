<script setup lang="ts">
import { computed, ref } from "vue";
import { Button, CommandPalette, CommandPaletteItem } from "@stance-dev/core";
import { useStoryTheme } from "./useStoryTheme";

const { storyTheme, densityProfiles } = useStoryTheme();

const COMMANDS = [
  "New File",
  "Open Settings",
  "Toggle Sidebar",
  "Toggle Dark Mode",
  "Go to Definition",
  "Find in Files",
];

function filterCommands(query: string) {
  return COMMANDS.filter((c) => c.toLowerCase().includes(query.toLowerCase()));
}

const lightOpen = ref(false);
const lightQuery = ref("");
const lightOptions = computed(() => filterCommands(lightQuery.value));
const lightLastCommand = ref("");

const darkOpen = ref(false);
const darkQuery = ref("");
const darkOptions = computed(() => filterCommands(darkQuery.value));

const densityOpenByProfile = ref<Record<string, boolean>>(
  Object.fromEntries(densityProfiles.map((p) => [p.name, false])),
);
const densityQuery = ref("");
const densityOptions = computed(() => filterCommands(densityQuery.value));
const darkLastCommand = ref("");
</script>

<template>
  <Story title="CommandPalette">
    <Variant title="Light + Dark">
      <div class="grid grid-cols-1 gap-8 p-6 md:grid-cols-2">
        <section
          :data-theme="storyTheme"
          class="space-y-4 rounded-lg border p-6"
          :style="{
            background: 'var(--stance-color-background)',
            color: 'var(--stance-color-foreground)',
            borderColor: 'var(--stance-color-border)',
          }"
        >
          <h2 class="text-lg font-semibold">Light</h2>
          <Button @click="lightOpen = true">Open command palette</Button>
          <CommandPalette
            v-model="lightOpen"
            v-model:input-value="lightQuery"
            label="Command palette"
            placeholder="Type a command…"
          >
            <CommandPaletteItem
              v-for="command in lightOptions"
              :key="command"
              :label="command"
              :disabled="command === 'Toggle Sidebar'"
              @select="lightLastCommand = command"
            >
              {{ command }}
            </CommandPaletteItem>
          </CommandPalette>
          <p class="text-sm opacity-70">Last command: {{ lightLastCommand || "(none)" }}</p>
        </section>

        <section
          :data-theme="storyTheme"
          class="dark space-y-4 rounded-lg border p-6"
          :style="{
            background: 'var(--stance-color-background)',
            color: 'var(--stance-color-foreground)',
            borderColor: 'var(--stance-color-border)',
          }"
        >
          <h2 class="text-lg font-semibold">Dark</h2>
          <Button @click="darkOpen = true">Open command palette</Button>
          <CommandPalette
            v-model="darkOpen"
            v-model:input-value="darkQuery"
            label="Command palette"
            placeholder="Type a command…"
          >
            <CommandPaletteItem
              v-for="command in darkOptions"
              :key="command"
              :label="command"
              :disabled="command === 'Toggle Sidebar'"
              @select="darkLastCommand = command"
            >
              {{ command }}
            </CommandPaletteItem>
          </CommandPalette>
          <p class="text-sm opacity-70">Last command: {{ darkLastCommand || "(none)" }}</p>
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
          <Button size="sm" @click="densityOpenByProfile[profile.name] = true">Open command palette</Button>
          <CommandPalette
            v-model="densityOpenByProfile[profile.name]"
            v-model:input-value="densityQuery"
            label="Command palette"
            placeholder="Type a command…"
          >
            <CommandPaletteItem v-for="command in densityOptions" :key="command" :label="command">
              {{ command }}
            </CommandPaletteItem>
          </CommandPalette>
        </section>
      </div>
    </Variant>
  </Story>
</template>
