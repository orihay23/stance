<script setup lang="ts">
import { onMounted, onUnmounted } from "vue";
import { Button, Tooltip } from "@stance/core";
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
</script>

<template>
  <Story title="Tooltip">
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
            <h3 class="mb-2 text-sm font-medium opacity-70">On a Button (hover or Tab to it)</h3>
            <Tooltip content="Saves your changes">
              <Button>Save</Button>
            </Tooltip>
          </div>

          <div>
            <h3 class="mb-2 text-sm font-medium opacity-70">On a bare icon (needs `focusable` to be keyboard-reachable)</h3>
            <Tooltip content="Info" focusable>
              <span
                class="inline-flex h-6 w-6 items-center justify-center rounded-full border text-xs font-semibold"
                :style="{ borderColor: 'var(--stance-color-border)' }"
                aria-hidden="true"
              >
                i
              </span>
            </Tooltip>
          </div>

          <div>
            <h3 class="mb-2 text-sm font-medium opacity-70">Placements</h3>
            <div class="flex flex-wrap items-center gap-4">
              <Tooltip content="Above" placement="top"><Button variant="secondary" size="sm">Top</Button></Tooltip>
              <Tooltip content="Below" placement="bottom">
                <Button variant="secondary" size="sm">Bottom</Button>
              </Tooltip>
              <Tooltip content="To the left" placement="left">
                <Button variant="secondary" size="sm">Left</Button>
              </Tooltip>
              <Tooltip content="To the right" placement="right">
                <Button variant="secondary" size="sm">Right</Button>
              </Tooltip>
            </div>
          </div>

          <div>
            <h3 class="mb-2 text-sm font-medium opacity-70">Disabled (never shows)</h3>
            <Tooltip content="You'll never see this" disabled>
              <Button variant="ghost">Hover me</Button>
            </Tooltip>
          </div>
        </section>
      </div>
    </Variant>

    <Variant title="Narrow container (responsive check)">
      <div class="mx-auto max-w-[240px] space-y-4 border p-4" data-theme="neutral">
        <Tooltip content="This tooltip stays anchored and readable even in a narrow container.">
          <Button class="w-full">Hover or focus me</Button>
        </Tooltip>
      </div>
    </Variant>
  </Story>
</template>
