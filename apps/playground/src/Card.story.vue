<script setup lang="ts">
import { ref } from "vue";
import { Card, type CardVariant } from "@stance/core";
import { useStoryTheme } from "./useStoryTheme";

const { storyTheme, themes, densityProfiles } = useStoryTheme();

const variants: CardVariant[] = ["elevated", "outlined", "flat"];
const clickCount = ref(0);
</script>

<template>
  <Story title="Card">
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
            <div class="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <Card v-for="variant in variants" :key="variant" :variant="variant">
                <template #header="{ headingTag }">
                  <component :is="headingTag" class="text-base font-semibold capitalize">{{ variant }}</component>
                </template>
                A simple card body with some placeholder copy to check line length and padding.
              </Card>
            </div>
          </div>

          <div>
            <h3 class="mb-2 text-sm font-medium opacity-70">Default slot only (no header/footer)</h3>
            <Card>Just body content — no header or footer wrapper is rendered.</Card>
          </div>

          <div>
            <h3 class="mb-2 text-sm font-medium opacity-70">Header + footer composition</h3>
            <Card>
              <template #header="{ headingTag }">
                <component :is="headingTag" class="text-base font-semibold">Invoice #1042</component>
                <p class="text-sm opacity-70">Due July 12</p>
              </template>
              <p>$1,240.00 outstanding across 3 line items.</p>
              <template #footer>
                <div class="flex justify-end gap-2">
                  <button class="text-sm underline" type="button">View</button>
                  <button class="text-sm underline" type="button">Pay now</button>
                </div>
              </template>
            </Card>
          </div>
        </section>
      </div>
    </Variant>

    <Variant title="Interactive cards (button / link)">
      <div class="space-y-6 p-6" :data-theme="storyTheme" :style="{ color: 'var(--stance-color-foreground)' }">
        <p class="text-sm opacity-70">Clicks so far: {{ clickCount }}</p>
        <div class="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Card interactive @click="clickCount++">
            <template #header="{ headingTag }">
              <component :is="headingTag" class="text-base font-semibold">Clickable button card</component>
            </template>
            Tab to me and press Enter or Space.
          </Card>

          <Card href="https://example.com" target="_blank" rel="noreferrer">
            <template #header="{ headingTag }">
              <component :is="headingTag" class="text-base font-semibold">Link card</component>
            </template>
            Renders as a real &lt;a href&gt; — opens example.com.
          </Card>

          <Card interactive disabled>
            <template #header="{ headingTag }">
              <component :is="headingTag" class="text-base font-semibold">Disabled card</component>
            </template>
            Not reachable via click or keyboard.
          </Card>
        </div>
      </div>
    </Variant>

    <Variant title="Equal-height cards in a row (footer pinned to bottom)">
      <div class="grid grid-cols-1 gap-4 p-6 sm:grid-cols-3" :data-theme="storyTheme" style="align-items: stretch">
        <Card>
          <template #header="{ headingTag }">
            <component :is="headingTag" class="text-base font-semibold">Short</component>
          </template>
          One line of body copy.
          <template #footer>
            <span class="text-sm opacity-70">Footer</span>
          </template>
        </Card>
        <Card>
          <template #header="{ headingTag }">
            <component :is="headingTag" class="text-base font-semibold">Medium</component>
          </template>
          A couple of lines of body copy that run a bit longer than the neighboring card, to check
          that footers still align across the row.
          <template #footer>
            <span class="text-sm opacity-70">Footer</span>
          </template>
        </Card>
        <Card>
          <template #header="{ headingTag }">
            <component :is="headingTag" class="text-base font-semibold">Long</component>
          </template>
          This card has the most body copy of the three, spanning several lines so we can confirm
          the body area grows to fill the available height and every footer still lines up along
          the bottom edge of the row regardless of content length.
          <template #footer>
            <span class="text-sm opacity-70">Footer</span>
          </template>
        </Card>
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
          <Card>
            <template #header="{ headingTag }">
              <component :is="headingTag" class="text-base font-semibold">Invoice #1042</component>
            </template>
            $1,240.00 outstanding.
          </Card>
        </section>
      </div>
    </Variant>

    <Variant title="Narrow container (responsive check)">
      <div class="mx-auto max-w-[240px] space-y-4 border p-4" :data-theme="storyTheme">
        <Card>
          <template #header="{ headingTag }">
            <component :is="headingTag" class="text-base font-semibold">Narrow card</component>
          </template>
          Content should wrap normally and padding should stay comfortable at this width.
          <template #footer>
            <span class="text-sm opacity-70">Footer</span>
          </template>
        </Card>
      </div>
    </Variant>
  </Story>
</template>
