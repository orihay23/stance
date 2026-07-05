<script setup lang="ts">
import { onMounted, onUnmounted, ref } from "vue";
import { DataTable, type DataTableColumn, type DataTableSortState } from "@stance/core";
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

interface Person {
  name: string;
  age: number;
  role: string;
  email: string;
}

const columns: DataTableColumn<Person>[] = [
  { key: "name", header: "Name", sortable: true },
  { key: "age", header: "Age", sortable: true, align: "end" },
  { key: "role", header: "Role", sortable: true },
  { key: "email", header: "Email" },
];

const rows: Person[] = [
  { name: "Bea Nakamura", age: 41, role: "Engineer", email: "bea@example.com" },
  { name: "Amir Osei", age: 29, role: "Designer", email: "amir@example.com" },
  { name: "Cass Ionescu", age: 35, role: "Manager", email: "cass@example.com" },
  { name: "Dev Patel", age: 52, role: "Engineer", email: "dev@example.com" },
];

const lightSort = ref<DataTableSortState | null>(null);
const darkSort = ref<DataTableSortState | null>(null);

const wideSort = ref<DataTableSortState | null>(null);
const narrowSort = ref<DataTableSortState | null>(null);
const tinySort = ref<DataTableSortState | null>(null);
</script>

<template>
  <Story title="DataTable">
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
          <DataTable
            v-model:sort="lightSort"
            :columns="columns"
            :rows="rows"
            row-key="email"
            caption="Team roster"
          >
            <template #cell-email="{ value }">
              <a :href="`mailto:${value}`" class="underline">{{ value }}</a>
            </template>
          </DataTable>
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
          <DataTable
            v-model:sort="darkSort"
            :columns="columns"
            :rows="rows"
            row-key="email"
            caption="Team roster"
          >
            <template #cell-email="{ value }">
              <a :href="`mailto:${value}`" class="underline">{{ value }}</a>
            </template>
          </DataTable>
        </section>
      </div>
    </Variant>

    <Variant title="Empty and loading states">
      <div class="grid grid-cols-1 gap-8 p-6 md:grid-cols-2" data-theme="neutral">
        <section
          class="space-y-2"
          :style="{ color: 'var(--stance-color-foreground)' }"
        >
          <h3 class="text-sm font-medium opacity-70">Loading</h3>
          <DataTable :columns="columns" :rows="[]" row-key="email" loading />
        </section>
        <section
          class="space-y-2"
          :style="{ color: 'var(--stance-color-foreground)' }"
        >
          <h3 class="text-sm font-medium opacity-70">Empty</h3>
          <DataTable :columns="columns" :rows="[]" row-key="email">
            <template #empty>No team members yet.</template>
          </DataTable>
        </section>
      </div>
    </Variant>

    <Variant title="Responsive (container-query card collapse)">
      <div class="space-y-8 p-6" data-theme="neutral">
        <div>
          <h3 class="mb-2 text-sm font-medium opacity-70">700px container (table view)</h3>
          <div style="width: 700px" :style="{ color: 'var(--stance-color-foreground)' }">
            <DataTable v-model:sort="wideSort" :columns="columns" :rows="rows" row-key="email" />
          </div>
        </div>

        <div>
          <h3 class="mb-2 text-sm font-medium opacity-70">450px container (collapsed to cards)</h3>
          <div style="width: 450px" :style="{ color: 'var(--stance-color-foreground)' }">
            <DataTable v-model:sort="narrowSort" :columns="columns" :rows="rows" row-key="email" />
          </div>
        </div>

        <div>
          <h3 class="mb-2 text-sm font-medium opacity-70">280px container (collapsed, very narrow)</h3>
          <div style="width: 280px" :style="{ color: 'var(--stance-color-foreground)' }">
            <DataTable v-model:sort="tinySort" :columns="columns" :rows="rows" row-key="email" />
          </div>
        </div>
      </div>
    </Variant>
  </Story>
</template>
