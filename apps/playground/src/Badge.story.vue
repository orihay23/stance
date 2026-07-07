<script setup lang="ts">
import { Badge, type BadgeVariant } from "@stance/core";
import { useStoryTheme } from "./useStoryTheme";

const { storyTheme, themes } = useStoryTheme();

const variants: BadgeVariant[] = ["neutral", "primary", "success", "warning", "destructive"];
</script>

<template>
  <Story title="Badge">
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
              <Badge v-for="variant in variants" :key="variant" :variant="variant">{{ variant }}</Badge>
            </div>
          </div>

          <div>
            <h3 class="mb-2 text-sm font-medium opacity-70">Purely decorative (no label)</h3>
            <div class="flex flex-wrap items-center gap-3">
              <span>New feature <Badge variant="primary">New</Badge></span>
            </div>
          </div>

          <div>
            <h3 class="mb-2 text-sm font-medium opacity-70">Conveys meaning (needs a label)</h3>
            <div class="flex flex-wrap items-center gap-3">
              <span
                >Inbox
                <Badge variant="destructive" label="3 unread messages">3</Badge>
              </span>
              <span
                >Status:
                <Badge variant="success" label="Deployment succeeded">●</Badge>
              </span>
            </div>
          </div>
        </section>
      </div>
    </Variant>
  </Story>
</template>
