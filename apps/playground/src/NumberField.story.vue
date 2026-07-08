<script setup lang="ts">
import { ref } from "vue";
import { NumberField } from "@stance/core";
import { useStoryTheme } from "./useStoryTheme";

const { storyTheme } = useStoryTheme();

const quantity = ref<number | undefined>(2);
const quantityDark = ref<number | undefined>(2);

const rating = ref<number | undefined>(5);
const price = ref<number | undefined>(19.99);
const percent = ref<number | undefined>(0.25);
const priceDe = ref<number | undefined>(1234.5);
const invalidValue = ref<number | undefined>(undefined);
</script>

<template>
  <Story title="NumberField">
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
          <label class="block text-sm font-medium" for="quantity-light">Quantity</label>
          <NumberField id="quantity-light" v-model="quantity" :min="0" :max="10" />
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
          <label class="block text-sm font-medium" for="quantity-dark">Quantity</label>
          <NumberField id="quantity-dark" v-model="quantityDark" :min="0" :max="10" />
        </section>
      </div>
    </Variant>

    <Variant title="Min/max constraints">
      <div class="space-y-4 p-6" :data-theme="storyTheme" :style="{ color: 'var(--stance-color-foreground)' }">
        <label class="block text-sm font-medium" for="rating">Rating (1–5)</label>
        <NumberField id="rating" v-model="rating" :min="1" :max="5" />
      </div>
    </Variant>

    <Variant title="Locale-aware formatting (currency, percent, decimals)">
      <div class="space-y-6 p-6" :data-theme="storyTheme" :style="{ color: 'var(--stance-color-foreground)' }">
        <div>
          <label class="mb-1 block text-sm font-medium" for="price">Price (en-US, USD)</label>
          <NumberField id="price" v-model="price" :step="0.01" :format-options="{ style: 'currency', currency: 'USD' }" />
        </div>
        <div>
          <label class="mb-1 block text-sm font-medium" for="percent">Discount (en-US, percent)</label>
          <NumberField id="percent" v-model="percent" :step="0.05" :format-options="{ style: 'percent' }" />
        </div>
        <div>
          <label class="mb-1 block text-sm font-medium" for="price-de">Preis (de-DE)</label>
          <NumberField id="price-de" v-model="priceDe" :step="0.5" locale="de-DE" />
        </div>
      </div>
    </Variant>

    <Variant title="Invalid / error state">
      <div class="space-y-4 p-6" :data-theme="storyTheme" :style="{ color: 'var(--stance-color-foreground)' }">
        <label class="block text-sm font-medium" for="invalid-field">Age</label>
        <NumberField id="invalid-field" v-model="invalidValue" invalid required>
          <template #error>An age is required.</template>
        </NumberField>
      </div>
    </Variant>
  </Story>
</template>
