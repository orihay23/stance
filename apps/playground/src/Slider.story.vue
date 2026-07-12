<script setup lang="ts">
import { ref } from "vue";
import { Slider } from "@stance/core";
import { useStoryTheme } from "./useStoryTheme";

const { storyTheme, densityProfiles } = useStoryTheme();
const densityVolumeByProfile = ref<Record<string, number>>(Object.fromEntries(densityProfiles.map((p) => [p.name, 40])));

const volume = ref(40);
const volumeDark = ref(40);

const verticalValue = ref(60);

const price = ref(75);
const discount = ref(0.25);

const rating = ref(3);
const disabledValue = ref(50);
</script>

<template>
  <Story title="Slider">
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
          <label class="block text-sm font-medium" for="volume-light">Volume ({{ volume }})</label>
          <Slider id="volume-light" v-model="volume" :min="0" :max="100" />
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
          <label class="block text-sm font-medium" for="volume-dark">Volume ({{ volumeDark }})</label>
          <Slider id="volume-dark" v-model="volumeDark" :min="0" :max="100" />
        </section>
      </div>
    </Variant>

    <Variant title="Vertical orientation">
      <div class="p-6" :data-theme="storyTheme" :style="{ color: 'var(--stance-color-foreground)' }">
        <label class="mb-2 block text-sm font-medium" for="vertical">Level ({{ verticalValue }})</label>
        <Slider id="vertical" v-model="verticalValue" orientation="vertical" :min="0" :max="100" />
      </div>
    </Variant>

    <Variant title="Locale-aware aria-valuetext (currency, percent)">
      <div class="space-y-6 p-6" :data-theme="storyTheme" :style="{ color: 'var(--stance-color-foreground)' }">
        <div>
          <label class="mb-1 block text-sm font-medium" for="price">Price (USD)</label>
          <Slider
            id="price"
            v-model="price"
            :min="0"
            :max="200"
            :step="5"
            :format-options="{ style: 'currency', currency: 'USD' }"
          />
        </div>
        <div>
          <label class="mb-1 block text-sm font-medium" for="discount">Discount</label>
          <Slider id="discount" v-model="discount" :min="0" :max="1" :step="0.05" :format-options="{ style: 'percent' }" />
        </div>
      </div>
    </Variant>

    <Variant title="Min/max/step">
      <div class="p-6" :data-theme="storyTheme" :style="{ color: 'var(--stance-color-foreground)' }">
        <label class="mb-2 block text-sm font-medium" for="rating">Rating ({{ rating }} of 1–5)</label>
        <Slider id="rating" v-model="rating" :min="1" :max="5" :step="1" />
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
          <label class="block text-sm font-medium" :for="`volume-${profile.name}`">Volume</label>
          <Slider :id="`volume-${profile.name}`" v-model="densityVolumeByProfile[profile.name]" :min="0" :max="100" />
        </section>
      </div>
    </Variant>

    <Variant title="Disabled">
      <div class="p-6" :data-theme="storyTheme" :style="{ color: 'var(--stance-color-foreground)' }">
        <label class="mb-2 block text-sm font-medium" for="disabled-slider">Disabled</label>
        <Slider id="disabled-slider" v-model="disabledValue" disabled />
      </div>
    </Variant>
  </Story>
</template>
