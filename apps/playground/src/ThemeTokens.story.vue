<script setup lang="ts">
import { useStoryTheme } from "./useStoryTheme";

const { storyTheme, themes } = useStoryTheme();

const roleTokens = [
  "surface",
  "primary",
  "secondary",
  "accent",
  "muted",
  "destructive",
  "success",
  "warning",
  "info",
] as const;

const flatTokens = ["background", "foreground", "border", "ring"] as const;
const radiusSteps = ["none", "sm", "md", "lg", "xl", "full"] as const;
const shadowSteps = ["sm", "md", "lg", "xl"] as const;
const textSteps = ["xs", "sm", "base", "lg", "xl", "2xl"] as const;
</script>

<template>
  <Story title="Theme Tokens">
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
            <h3 class="mb-2 text-sm font-medium opacity-70">Flat colors</h3>
            <div class="flex flex-wrap gap-3">
              <div v-for="token in flatTokens" :key="token" class="text-center text-xs">
                <div
                  class="h-12 w-16 rounded-md border"
                  :style="{
                    background: `var(--stance-color-${token})`,
                    borderColor: 'var(--stance-color-border)',
                  }"
                />
                <span>{{ token }}</span>
              </div>
            </div>
          </div>

          <div>
            <h3 class="mb-2 text-sm font-medium opacity-70">Color roles (DEFAULT / foreground)</h3>
            <div class="flex flex-wrap gap-3">
              <div v-for="token in roleTokens" :key="token" class="text-center text-xs">
                <div
                  class="flex h-12 w-20 items-center justify-center rounded-md text-xs font-medium"
                  :style="{
                    background: `var(--stance-color-${token})`,
                    color: `var(--stance-color-${token}-foreground)`,
                  }"
                >
                  Ab
                </div>
                <span>{{ token }}</span>
              </div>
            </div>
          </div>

          <div>
            <h3 class="mb-2 text-sm font-medium opacity-70">Radius</h3>
            <div class="flex flex-wrap gap-3">
              <div v-for="step in radiusSteps" :key="step" class="text-center text-xs">
                <div
                  class="h-12 w-12 border"
                  :style="{
                    borderRadius: `var(--stance-radius-${step})`,
                    borderColor: 'var(--stance-color-border)',
                    background: 'var(--stance-color-surface)',
                  }"
                />
                <span>{{ step }}</span>
              </div>
            </div>
          </div>

          <div>
            <h3 class="mb-2 text-sm font-medium opacity-70">Shadow</h3>
            <div class="flex flex-wrap gap-6">
              <div v-for="step in shadowSteps" :key="step" class="text-center text-xs">
                <div
                  class="h-12 w-12 rounded-md"
                  :style="{
                    boxShadow: `var(--stance-shadow-${step})`,
                    background: 'var(--stance-color-surface)',
                  }"
                />
                <span>{{ step }}</span>
              </div>
            </div>
          </div>

          <div>
            <h3 class="mb-2 text-sm font-medium opacity-70">Typography scale</h3>
            <div class="space-y-1">
              <p
                v-for="step in textSteps"
                :key="step"
                :style="{
                  fontSize: `var(--stance-text-${step})`,
                  fontFamily: 'var(--stance-font-sans)',
                }"
              >
                {{ step }} — The quick brown fox
              </p>
            </div>
          </div>
        </section>
      </div>
    </Variant>
  </Story>
</template>
