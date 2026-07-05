<script setup lang="ts">
import { onMounted, onUnmounted } from "vue";
import { Card, Grid } from "@stance/core";
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

const items = Array.from({ length: 6 }, (_, i) => i + 1);
</script>

<template>
  <Story title="Grid">
    <Variant title="Container mode (responds to its own width)">
      <div class="space-y-8 p-6" data-theme="neutral" :style="{ color: 'var(--stance-color-foreground)' }">
        <p class="text-sm opacity-70">
          Same Grid config (base: 1, sm: 2, lg: 3) in three different container widths — column
          count tracks each container's own rendered width, not the viewport.
        </p>
        <div v-for="width in [1000, 600, 300]" :key="width">
          <h3 class="mb-2 text-sm font-medium opacity-70">{{ width }}px container</h3>
          <div :style="{ width: `${width}px`, border: '1px dashed var(--stance-color-border)', padding: '0.5rem' }">
            <Grid responsive-mode="container" :columns="{ base: 1, sm: 2, lg: 3 }" gap="md">
              <Card v-for="item in items" :key="item">
                <template #header="{ headingTag }">
                  <component :is="headingTag" class="text-base font-semibold">Card {{ item }}</component>
                </template>
                Item {{ item }} content.
              </Card>
            </Grid>
          </div>
        </div>
      </div>
    </Variant>

    <Variant title="Viewport mode (responds to browser width)">
      <div class="space-y-4 p-6" data-theme="neutral" :style="{ color: 'var(--stance-color-foreground)' }">
        <p class="text-sm opacity-70">
          Same columns config as the container-mode example, but tracking viewport width — resize
          the browser window to see the column count change (sm=640px, md=768px, lg=1024px,
          xl=1280px), regardless of how wide this particular container happens to be.
        </p>
        <Grid responsive-mode="viewport" :columns="{ base: 1, sm: 2, lg: 3 }" gap="md">
          <Card v-for="item in items" :key="item">
            <template #header="{ headingTag }">
              <component :is="headingTag" class="text-base font-semibold">Card {{ item }}</component>
            </template>
            Item {{ item }} content.
          </Card>
        </Grid>
      </div>
    </Variant>

    <Variant title="Skipped breakpoints (base + lg only)">
      <div class="p-6" data-theme="neutral" :style="{ color: 'var(--stance-color-foreground)' }">
        <p class="mb-4 text-sm opacity-70">
          columns={ base: 1, lg: 4 } — holds at 1 column through sm/md, jumps to 4 at lg and stays
          there through xl (no sm/md/xl override needed).
        </p>
        <Grid responsive-mode="viewport" :columns="{ base: 1, lg: 4 }" gap="sm">
          <Card v-for="item in items" :key="item">Card {{ item }}</Card>
        </Grid>
      </div>
    </Variant>

    <Variant title="Gap scale">
      <div class="space-y-8 p-6" data-theme="neutral" :style="{ color: 'var(--stance-color-foreground)' }">
        <div v-for="gap in ['xs', 'sm', 'md', 'lg', 'xl'] as const" :key="gap">
          <h3 class="mb-2 text-sm font-medium opacity-70">gap="{{ gap }}"</h3>
          <Grid :columns="{ base: 3 }" :gap="gap">
            <Card v-for="item in [1, 2, 3]" :key="item">{{ item }}</Card>
          </Grid>
        </div>
      </div>
    </Variant>
  </Story>
</template>
