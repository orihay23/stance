<script setup lang="ts">
import { ref } from "vue";
import { Pagination } from "@stance/core";
import { useStoryTheme } from "./useStoryTheme";

const { storyTheme } = useStoryTheme();

const page = ref(1);
const pickerPage = ref(3);
const pickerPageSize = ref(10);
</script>

<template>
  <Story title="Pagination">
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
            <h3 class="mb-2 text-sm font-medium opacity-70">Standalone (page navigation only)</h3>
            <Pagination v-model:page="page" :total-pages="12" />
          </div>

          <div>
            <h3 class="mb-2 text-sm font-medium opacity-70">First page (Previous disabled)</h3>
            <Pagination :page="1" :total-pages="12" @update:page="() => {}" />
          </div>

          <div>
            <h3 class="mb-2 text-sm font-medium opacity-70">Last page (Next disabled)</h3>
            <Pagination :page="12" :total-pages="12" @update:page="() => {}" />
          </div>
        </section>
      </div>
    </Variant>

    <Variant title="Page-size picker">
      <div class="space-y-6 p-6" :data-theme="storyTheme" :style="{ color: 'var(--stance-color-foreground)' }">
        <h3 class="mb-2 text-sm font-medium opacity-70">
          Renders only when both <code>pageSize</code> and <code>pageSizeOptions</code> are given
        </h3>
        <Pagination
          v-model:page="pickerPage"
          v-model:page-size="pickerPageSize"
          :total-pages="12"
          :page-size-options="[10, 25, 50, 100]"
        />
      </div>
    </Variant>

    <Variant title="Narrow container (responsive check — collapses to 'Page X of Y')">
      <div class="space-y-8 p-6" :data-theme="storyTheme" :style="{ color: 'var(--stance-color-foreground)' }">
        <div v-for="width in [500, 350, 220]" :key="width">
          <h3 class="mb-2 text-sm font-medium opacity-70">{{ width }}px container</h3>
          <div :style="{ width: `${width}px`, border: '1px dashed var(--stance-color-border)', padding: '0.5rem' }">
            <Pagination :page="4" :total-pages="12" @update:page="() => {}" />
          </div>
        </div>
      </div>
    </Variant>
  </Story>
</template>
