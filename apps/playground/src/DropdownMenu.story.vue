<script setup lang="ts">
import { ref } from "vue";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@stance/core";
import { useStoryTheme } from "./useStoryTheme";

const { storyTheme, themes } = useStoryTheme();

const lightOpen = ref(false);
const darkOpen = ref(false);
const narrowOpen = ref(false);
const lastAction = ref("");
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
