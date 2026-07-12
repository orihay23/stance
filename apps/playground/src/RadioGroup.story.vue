<script setup lang="ts">
import { ref } from "vue";
import { Radio, RadioGroup } from "@stance/core";
import { useStoryTheme } from "./useStoryTheme";

const { storyTheme, themes, densityProfiles } = useStoryTheme();

const plan = ref("pro");
const invalidPlan = ref<string | undefined>(undefined);
</script>

<template>
  <Story title="RadioGroup">
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
            <h3 class="mb-2 text-sm font-medium opacity-70">Interactive (tab in, then use arrow keys)</h3>
            <RadioGroup v-model="plan">
              <template #legend>Choose a plan</template>
              <Radio value="free">Free</Radio>
              <Radio value="pro">Pro</Radio>
              <Radio value="enterprise">Enterprise</Radio>
            </RadioGroup>
            <p class="mt-1 text-sm opacity-70">Selected: {{ plan }}</p>
          </div>

          <div>
            <h3 class="mb-2 text-sm font-medium opacity-70">Disabled group</h3>
            <RadioGroup model-value="free" disabled>
              <template #legend>Choose a plan</template>
              <Radio value="free">Free</Radio>
              <Radio value="pro">Pro</Radio>
            </RadioGroup>
          </div>

          <div>
            <h3 class="mb-2 text-sm font-medium opacity-70">One disabled option</h3>
            <RadioGroup model-value="free">
              <template #legend>Choose a plan</template>
              <Radio value="free">Free</Radio>
              <Radio value="pro" disabled>Pro (unavailable)</Radio>
            </RadioGroup>
          </div>

          <div>
            <h3 class="mb-2 text-sm font-medium opacity-70">Invalid + error slot</h3>
            <RadioGroup v-model="invalidPlan" :invalid="!invalidPlan">
              <template #legend>Choose a plan</template>
              <Radio value="free">Free</Radio>
              <Radio value="pro">Pro</Radio>
              <template #error>You must choose a plan.</template>
            </RadioGroup>
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
          <RadioGroup model-value="pro">
            <template #legend>Choose a plan</template>
            <Radio value="free">Free</Radio>
            <Radio value="pro">Pro</Radio>
          </RadioGroup>
        </section>
      </div>
    </Variant>

    <Variant title="Narrow container (responsive check)">
      <div class="mx-auto max-w-[240px] border p-4" :data-theme="storyTheme">
        <RadioGroup model-value="pro">
          <template #legend>Choose a plan with a fairly long legend that has to wrap</template>
          <Radio value="free">Free</Radio>
          <Radio value="pro">Pro</Radio>
          <Radio value="enterprise">Enterprise, which also has a long label that wraps</Radio>
        </RadioGroup>
      </div>
    </Variant>
  </Story>
</template>
