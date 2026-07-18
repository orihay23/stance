<script setup lang="ts">
import { computed, ref } from "vue";
import { Checkbox } from "@stance-dev/core";
import { useStoryTheme } from "./useStoryTheme";

const { storyTheme, themes, densityProfiles } = useStoryTheme();

const basicChecked = ref(false);
const invalidChecked = ref(false);

// "Select all" demo: the parent checkbox is indeterminate when some but
// not all children are checked, exercising indeterminate the way a real
// consumer would drive it.
const items = ref([
  { label: "Apples", checked: true },
  { label: "Bananas", checked: false },
  { label: "Cherries", checked: false },
]);
const allChecked = computed(() => items.value.every((item) => item.checked));
const someChecked = computed(() => items.value.some((item) => item.checked));
const parentIndeterminate = computed(() => someChecked.value && !allChecked.value);

function toggleAll(value: boolean) {
  items.value.forEach((item) => (item.checked = value));
}
</script>

<template>
  <Story title="Checkbox">
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
            <h3 class="mb-2 text-sm font-medium opacity-70">States</h3>
            <div class="flex flex-col gap-3">
              <Checkbox>Unchecked</Checkbox>
              <Checkbox model-value>Checked</Checkbox>
              <Checkbox indeterminate>Indeterminate</Checkbox>
              <Checkbox disabled>Disabled</Checkbox>
              <Checkbox disabled model-value>Disabled + checked</Checkbox>
            </div>
          </div>

          <div>
            <h3 class="mb-2 text-sm font-medium opacity-70">Interactive</h3>
            <Checkbox v-model="basicChecked">Click or press Space to toggle</Checkbox>
            <p class="mt-1 text-sm opacity-70">Checked: {{ basicChecked }}</p>
          </div>

          <div>
            <h3 class="mb-2 text-sm font-medium opacity-70">Invalid + error slot</h3>
            <Checkbox v-model="invalidChecked" :invalid="!invalidChecked">
              I agree to the terms
              <template #error>You must agree to continue.</template>
            </Checkbox>
          </div>

          <div>
            <h3 class="mb-2 text-sm font-medium opacity-70">Select-all (real indeterminate usage)</h3>
            <div class="flex flex-col gap-2">
              <Checkbox
                :model-value="allChecked"
                :indeterminate="parentIndeterminate"
                @update:model-value="toggleAll"
              >
                Select all
              </Checkbox>
              <div class="ml-6 flex flex-col gap-2">
                <Checkbox v-for="item in items" :key="item.label" v-model="item.checked">
                  {{ item.label }}
                </Checkbox>
              </div>
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
          <div class="flex flex-col gap-2">
            <Checkbox>Unchecked</Checkbox>
            <Checkbox model-value>Checked</Checkbox>
          </div>
        </section>
      </div>
    </Variant>

    <Variant title="Narrow container (responsive check)">
      <div class="mx-auto max-w-[240px] space-y-3 border p-4" :data-theme="storyTheme">
        <Checkbox>A checkbox with a fairly long label that has to wrap onto multiple lines</Checkbox>
        <Checkbox model-value>Checked in a narrow column</Checkbox>
      </div>
    </Variant>
  </Story>
</template>
