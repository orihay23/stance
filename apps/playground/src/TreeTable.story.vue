<script setup lang="ts">
import { ref } from "vue";
import { TreeTable, type TreeTableColumn, type TreeTableSortState } from "@stance/core";
import { useStoryTheme } from "./useStoryTheme";

const { storyTheme, themes, densityProfiles } = useStoryTheme();
const densityExpandedByProfile = ref<Record<string, Array<string | number>>>(
  Object.fromEntries(densityProfiles.map((p) => [p.name, ["packages"]])),
);

interface FileNode {
  /** Full path — used as `row-key`. Plain `name` isn't unique on its own: this tree has two "package.json" files at different levels. */
  path: string;
  name: string;
  kind: "folder" | "file";
  size: string;
  children?: FileNode[];
}

function makeTree(): FileNode[] {
  return [
    {
      path: "packages",
      name: "packages",
      kind: "folder",
      size: "—",
      children: [
        {
          path: "packages/core",
          name: "core",
          kind: "folder",
          size: "—",
          children: [
            {
              path: "packages/core/src",
              name: "src",
              kind: "folder",
              size: "—",
              children: [
                {
                  path: "packages/core/src/components",
                  name: "components",
                  kind: "folder",
                  size: "—",
                  children: [
                    { path: "packages/core/src/components/Button.vue", name: "Button.vue", kind: "file", size: "3.1 KB" },
                    { path: "packages/core/src/components/Input.vue", name: "Input.vue", kind: "file", size: "2.4 KB" },
                  ],
                },
                { path: "packages/core/src/index.ts", name: "index.ts", kind: "file", size: "1.8 KB" },
              ],
            },
            { path: "packages/core/package.json", name: "package.json", kind: "file", size: "0.6 KB" },
          ],
        },
        {
          path: "packages/themes",
          name: "themes",
          kind: "folder",
          size: "—",
          children: [{ path: "packages/themes/neutral.ts", name: "neutral.ts", kind: "file", size: "4.2 KB" }],
        },
      ],
    },
    { path: "README.md", name: "README.md", kind: "file", size: "1.1 KB" },
    { path: "package.json", name: "package.json", kind: "file", size: "0.4 KB" },
  ];
}

const columns: TreeTableColumn<FileNode>[] = [
  { key: "name", header: "Name", sortable: true, filterable: true },
  { key: "kind", header: "Kind" },
  { key: "size", header: "Size", align: "end" },
];

const lightExpanded = ref<Array<string | number>>(["packages", "packages/core", "packages/core/src"]);
const darkExpanded = ref<Array<string | number>>(["packages"]);

const selectionExpanded = ref<Array<string | number>>(["packages", "packages/core"]);
const multipleSelected = ref<Array<string | number>>([]);
const singleSelected = ref<Array<string | number>>([]);

const sortFilterExpanded = ref<Array<string | number>>(["packages", "packages/core", "packages/core/src"]);
const sort = ref<TreeTableSortState | null>(null);
const globalFilter = ref("");
const columnFilters = ref<Record<string, string>>({});

const narrowExpanded = ref<Array<string | number>>(["packages"]);
</script>

<template>
  <Story title="TreeTable">
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
          <TreeTable :columns="columns" :rows="makeTree()" row-key="path" v-model:expanded="lightExpanded" caption="Repository files" />
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
          <TreeTable :columns="columns" :rows="makeTree()" row-key="path" v-model:expanded="darkExpanded" caption="Repository files" />
        </section>
      </div>
    </Variant>

    <Variant title="Row selection">
      <div class="grid grid-cols-1 gap-8 p-6 md:grid-cols-2" :data-theme="storyTheme" :style="{ color: 'var(--stance-color-foreground)' }">
        <div>
          <h3 class="mb-2 text-sm font-medium opacity-70">Multiple (checkboxes)</h3>
          <TreeTable
            :columns="columns"
            :rows="makeTree()"
            row-key="path"
            v-model:expanded="selectionExpanded"
            selection-mode="multiple"
            v-model:selected="multipleSelected"
          />
          <p class="mt-2 text-sm opacity-70">Selected: {{ multipleSelected.join(", ") || "none" }}</p>
        </div>
        <div>
          <h3 class="mb-2 text-sm font-medium opacity-70">Single (radios)</h3>
          <TreeTable
            :columns="columns"
            :rows="makeTree()"
            row-key="path"
            v-model:expanded="selectionExpanded"
            selection-mode="single"
            v-model:selected="singleSelected"
          />
          <p class="mt-2 text-sm opacity-70">Selected: {{ singleSelected.join(", ") || "none" }}</p>
        </div>
      </div>
    </Variant>

    <Variant title="Sort + filter (ancestor-preserving)">
      <div class="p-6" :data-theme="storyTheme" :style="{ color: 'var(--stance-color-foreground)' }">
        <p class="mb-2 text-sm opacity-70">
          Try filtering for "neutral" — the matching file keeps its folder ancestors visible
          instead of reading as a disconnected list, and stays expanded regardless of collapse
          state.
        </p>
        <TreeTable
          :columns="columns"
          :rows="makeTree()"
          row-key="path"
          v-model:expanded="sortFilterExpanded"
          v-model:sort="sort"
          v-model:global-filter="globalFilter"
          v-model:column-filters="columnFilters"
        />
      </div>
    </Variant>

    <Variant title="Density">
      <!-- Single column, not the usual 4-across grid — TreeTable's own
           container-query card-collapse (see the "Narrow container"
           variant below) would trigger for every density in a narrow
           column, hiding the density differences this variant exists to
           show. -->
      <div class="space-y-6 p-6" data-theme-palette="neutral">
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
          <TreeTable :columns="columns" :rows="makeTree()" row-key="path" v-model:expanded="densityExpandedByProfile[profile.name]" />
        </section>
      </div>
    </Variant>

    <Variant title="Narrow container (responsive check)">
      <div class="space-y-8 p-6" :data-theme="storyTheme" :style="{ color: 'var(--stance-color-foreground)' }">
        <div v-for="width in [400, 300]" :key="width">
          <h3 class="mb-2 text-sm font-medium opacity-70">{{ width }}px container</h3>
          <div :style="{ width: `${width}px`, border: '1px dashed var(--stance-color-border)', padding: '0.5rem' }">
            <TreeTable :columns="columns" :rows="makeTree()" row-key="path" v-model:expanded="narrowExpanded" />
          </div>
        </div>
      </div>
    </Variant>
  </Story>
</template>
