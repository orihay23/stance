<script setup lang="ts">
import { onMounted, onUnmounted, ref } from "vue";
import { Switch } from "@stance/core";
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

const airplaneMode = ref(false);
const invalidSwitch = ref(false);
</script>

<template>
  <Story title="Switch">
    <Variant title="Light + Dark">
      <div class="grid grid-cols-1 gap-8 p-6 md:grid-cols-2">
        <section
          v-for="mode in ['light', 'dark']"
          :key="mode"
          data-theme="neutral"
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
              <Switch>Off</Switch>
              <Switch model-value>On</Switch>
              <Switch disabled>Disabled off</Switch>
              <Switch disabled model-value>Disabled on</Switch>
            </div>
          </div>

          <div>
            <h3 class="mb-2 text-sm font-medium opacity-70">Interactive</h3>
            <Switch v-model="airplaneMode">Airplane mode</Switch>
            <p class="mt-1 text-sm opacity-70">{{ airplaneMode ? "On" : "Off" }}</p>
          </div>

          <div>
            <h3 class="mb-2 text-sm font-medium opacity-70">Invalid + error slot</h3>
            <Switch v-model="invalidSwitch" :invalid="!invalidSwitch">
              Accept terms to continue
              <template #error>You must turn this on to continue.</template>
            </Switch>
          </div>
        </section>
      </div>
    </Variant>

    <Variant title="Narrow container (responsive check)">
      <div class="mx-auto max-w-[240px] space-y-3 border p-4" data-theme="neutral">
        <Switch>A switch with a fairly long label that has to wrap onto multiple lines</Switch>
        <Switch model-value>On, in a narrow column</Switch>
      </div>
    </Variant>
  </Story>
</template>
