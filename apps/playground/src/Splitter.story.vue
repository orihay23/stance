<script setup lang="ts">
import { ref } from "vue";
import { Splitter, SplitterPane } from "@stance/core";
import { useStoryTheme } from "./useStoryTheme";

const { storyTheme, themes } = useStoryTheme();

const horizontalSizes = ref([30, 70]);
const verticalSizes = ref([40, 60]);
const threePaneSizes = ref([20, 30, 50]);
const constrainedSizes = ref([50, 50]);

const paneStyle = {
  padding: "1rem",
  height: "100%",
  boxSizing: "border-box" as const,
  background: "var(--stance-color-muted, rgba(127,127,127,0.08))",
};
</script>

<template>
  <Story title="Splitter">
    <Variant title="Light + Dark (horizontal)">
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
            <h3 class="mb-2 text-sm font-medium opacity-70">
              Two panes — drag the divider or focus it and use ArrowLeft/ArrowRight
            </h3>
            <Splitter v-model="horizontalSizes" :style="{ height: '200px', border: '1px solid var(--stance-color-border)' }">
              <SplitterPane>
                <div :style="paneStyle">Pane A ({{ Math.round(horizontalSizes[0]!) }}%)</div>
              </SplitterPane>
              <SplitterPane>
                <div :style="paneStyle">Pane B ({{ Math.round(horizontalSizes[1]!) }}%)</div>
              </SplitterPane>
            </Splitter>
          </div>
        </section>
      </div>
    </Variant>

    <Variant title="Vertical orientation">
      <div class="p-6" :data-theme="storyTheme" :style="{ color: 'var(--stance-color-foreground)' }">
        <h3 class="mb-2 text-sm font-medium opacity-70">
          Focus the divider and use ArrowUp/ArrowDown to resize
        </h3>
        <Splitter
          v-model="verticalSizes"
          orientation="vertical"
          :style="{ height: '320px', width: '400px', border: '1px solid var(--stance-color-border)' }"
        >
          <SplitterPane>
            <div :style="paneStyle">Top pane ({{ Math.round(verticalSizes[0]!) }}%)</div>
          </SplitterPane>
          <SplitterPane>
            <div :style="paneStyle">Bottom pane ({{ Math.round(verticalSizes[1]!) }}%)</div>
          </SplitterPane>
        </Splitter>
      </div>
    </Variant>

    <Variant title="3+ panes">
      <div class="p-6" :data-theme="storyTheme" :style="{ color: 'var(--stance-color-foreground)' }">
        <h3 class="mb-2 text-sm font-medium opacity-70">Each divider only resizes its own adjacent pair</h3>
        <Splitter v-model="threePaneSizes" :style="{ height: '220px', border: '1px solid var(--stance-color-border)' }">
          <SplitterPane>
            <div :style="paneStyle">Sidebar ({{ Math.round(threePaneSizes[0]!) }}%)</div>
          </SplitterPane>
          <SplitterPane>
            <div :style="paneStyle">Main ({{ Math.round(threePaneSizes[1]!) }}%)</div>
          </SplitterPane>
          <SplitterPane>
            <div :style="paneStyle">Inspector ({{ Math.round(threePaneSizes[2]!) }}%)</div>
          </SplitterPane>
        </Splitter>
      </div>
    </Variant>

    <Variant title="Min/max constraints">
      <div class="p-6" :data-theme="storyTheme" :style="{ color: 'var(--stance-color-foreground)' }">
        <h3 class="mb-2 text-sm font-medium opacity-70">
          Left pane is clamped to 20%–60% — try arrowing past those bounds
        </h3>
        <Splitter v-model="constrainedSizes" :style="{ height: '200px', border: '1px solid var(--stance-color-border)' }">
          <SplitterPane :min="20" :max="60">
            <div :style="paneStyle">Constrained ({{ Math.round(constrainedSizes[0]!) }}%)</div>
          </SplitterPane>
          <SplitterPane>
            <div :style="paneStyle">Flexible ({{ Math.round(constrainedSizes[1]!) }}%)</div>
          </SplitterPane>
        </Splitter>
      </div>
    </Variant>
  </Story>
</template>
