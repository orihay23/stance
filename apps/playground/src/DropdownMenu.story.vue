<script setup lang="ts">
import { ref } from "vue";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuContextTrigger,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@stance/core";
import { useStoryTheme } from "./useStoryTheme";

const { storyTheme, themes, densityProfiles } = useStoryTheme();

const lightOpen = ref(false);
const darkOpen = ref(false);
const narrowOpen = ref(false);
const lastAction = ref("");
const lightContextOpen = ref(false);
const darkContextOpen = ref(false);
const lastContextAction = ref("");

const densityOpenByProfile = ref<Record<string, boolean>>(
  Object.fromEntries(densityProfiles.map((p) => [p.name, false])),
);
</script>

<template>
  <Story title="DropdownMenu">
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

          <DropdownMenu v-model="lightOpen">
            <DropdownMenuTrigger>Actions</DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem @select="lastAction = 'Edit'">Edit</DropdownMenuItem>
              <DropdownMenuItem @select="lastAction = 'Duplicate'">Duplicate</DropdownMenuItem>
              <DropdownMenuItem disabled @select="lastAction = 'Archive'">Archive (disabled)</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem variant="destructive" @select="lastAction = 'Delete'">Delete</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <p class="text-sm opacity-70">Last action: {{ lastAction || "(none)" }}</p>
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

          <DropdownMenu v-model="darkOpen">
            <DropdownMenuTrigger>Actions</DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem @select="lastAction = 'Edit'">Edit</DropdownMenuItem>
              <DropdownMenuItem @select="lastAction = 'Duplicate'">Duplicate</DropdownMenuItem>
              <DropdownMenuItem disabled @select="lastAction = 'Archive'">Archive (disabled)</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem variant="destructive" @select="lastAction = 'Delete'">Delete</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <p class="text-sm opacity-70">Last action: {{ lastAction || "(none)" }}</p>
        </section>
      </div>
    </Variant>

    <Variant title="Context menu (right-click / long-press)">
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

          <DropdownMenu v-model="lightContextOpen">
            <DropdownMenuContextTrigger v-slot="{ onContextmenu, onTouchstart, onTouchmove, onTouchend, onTouchcancel }">
              <div
                tabindex="0"
                class="flex items-center justify-center rounded-md border border-dashed p-8 text-sm select-none"
                :style="{ borderColor: 'var(--stance-color-border)' }"
                @contextmenu="onContextmenu"
                @touchstart="onTouchstart"
                @touchmove="onTouchmove"
                @touchend="onTouchend"
                @touchcancel="onTouchcancel"
              >
                Right-click (or long-press) here
              </div>
            </DropdownMenuContextTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem @select="lastContextAction = 'Edit'">Edit</DropdownMenuItem>
              <DropdownMenuItem @select="lastContextAction = 'Duplicate'">Duplicate</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem variant="destructive" @select="lastContextAction = 'Delete'">Delete</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <p class="text-sm opacity-70">Last action: {{ lastContextAction || "(none)" }}</p>
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

          <DropdownMenu v-model="darkContextOpen">
            <DropdownMenuContextTrigger v-slot="{ onContextmenu, onTouchstart, onTouchmove, onTouchend, onTouchcancel }">
              <div
                tabindex="0"
                class="flex items-center justify-center rounded-md border border-dashed p-8 text-sm select-none"
                :style="{ borderColor: 'var(--stance-color-border)' }"
                @contextmenu="onContextmenu"
                @touchstart="onTouchstart"
                @touchmove="onTouchmove"
                @touchend="onTouchend"
                @touchcancel="onTouchcancel"
              >
                Right-click (or long-press) here
              </div>
            </DropdownMenuContextTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem @select="lastContextAction = 'Edit'">Edit</DropdownMenuItem>
              <DropdownMenuItem @select="lastContextAction = 'Duplicate'">Duplicate</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem variant="destructive" @select="lastContextAction = 'Delete'">Delete</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <p class="text-sm opacity-70">Last action: {{ lastContextAction || "(none)" }}</p>
        </section>
      </div>
    </Variant>

    <Variant title="Density">
      <div class="grid grid-cols-1 gap-6 p-6 sm:grid-cols-2 lg:grid-cols-4" data-theme-palette="neutral">
        <section
          v-for="profile in densityProfiles"
          :key="profile.name"
          :data-theme-density="profile.name"
          class="rounded-lg border p-4"
          :style="{
            background: 'var(--stance-color-background)',
            color: 'var(--stance-color-foreground)',
            borderColor: 'var(--stance-color-border)',
          }"
        >
          <h2 class="mb-3 text-sm font-semibold capitalize">{{ profile.name }}</h2>
          <DropdownMenu v-model="densityOpenByProfile[profile.name]">
            <DropdownMenuTrigger>Actions</DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem>Edit</DropdownMenuItem>
              <DropdownMenuItem>Duplicate</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem variant="destructive">Delete</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </section>
      </div>
    </Variant>

    <Variant title="Narrow container (responsive check)">
      <div class="mx-auto max-w-[240px] space-y-4 border p-4" :data-theme="storyTheme">
        <DropdownMenu v-model="narrowOpen">
          <DropdownMenuTrigger class="w-full">Actions</DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem>Edit</DropdownMenuItem>
            <DropdownMenuItem>Duplicate</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem variant="destructive">Delete</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </Variant>
  </Story>
</template>
