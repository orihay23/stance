<script setup lang="ts">
import { onMounted, onUnmounted, ref } from "vue";
import { ProgressBar } from "@stance/core";
import { compileTheme, neutral } from "@stance/themes";

let styleEl: HTMLStyleElement | null = null;

onMounted(() => {
  styleEl = document.createElement("style");
  styleEl.textContent = compileTheme(neutral);
  document.head.appendChild(styleEl);
});

onUnmounted(() => {
  styleEl?.remove();
});

const lightValue = ref(40);
const darkValue = ref(65);
</script>

<template>
  <Story title="ProgressBar">
    <Variant title="Light + Dark">
      <div class="grid grid-cols-1 gap-8 p-6 md:grid-cols-2">
        <section
          data-theme="neutral"
          class="space-y-6 rounded-lg border p-6"
          :style="{
            background: 'var(--stance-color-background)',
            color: 'var(--stance-color-foreground)',
            borderColor: 'var(--stance-color-border)',
          }"
        >
          <h2 class="text-lg font-semibold">Light</h2>

          <div>
            <h3 class="mb-2 text-sm font-medium opacity-70">Determinate</h3>
            <ProgressBar :value="lightValue" label="Upload progress">
              <template #default="{ percent }">
                <span class="text-sm opacity-70">{{ Math.round(percent) }}%</span>
              </template>
            </ProgressBar>
            <input v-model.number="lightValue" type="range" min="0" max="100" class="mt-2 w-full" />
          </div>

          <div>
            <h3 class="mb-2 text-sm font-medium opacity-70">Indeterminate</h3>
            <ProgressBar indeterminate label="Loading" />
          </div>
        </section>

        <section
          data-theme="neutral"
          class="dark space-y-6 rounded-lg border p-6"
          :style="{
            background: 'var(--stance-color-background)',
            color: 'var(--stance-color-foreground)',
            borderColor: 'var(--stance-color-border)',
          }"
        >
          <h2 class="text-lg font-semibold">Dark</h2>

          <div>
            <h3 class="mb-2 text-sm font-medium opacity-70">Determinate</h3>
            <ProgressBar :value="darkValue" label="Upload progress">
              <template #default="{ percent }">
                <span class="text-sm opacity-70">{{ Math.round(percent) }}%</span>
              </template>
            </ProgressBar>
            <input v-model.number="darkValue" type="range" min="0" max="100" class="mt-2 w-full" />
          </div>

          <div>
            <h3 class="mb-2 text-sm font-medium opacity-70">Indeterminate</h3>
            <ProgressBar indeterminate label="Loading" />
          </div>
        </section>
      </div>
    </Variant>

    <Variant title="Narrow container (responsive check)">
      <div class="mx-auto max-w-[240px] space-y-4 border p-4" data-theme="neutral">
        <ProgressBar :value="72" label="Storage used" />
        <ProgressBar indeterminate label="Syncing" />
      </div>
    </Variant>
  </Story>
</template>
