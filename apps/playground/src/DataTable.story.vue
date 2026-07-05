<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from "vue";
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

const roles = ["Engineer", "Designer", "Manager"] as const;
const manyRows: Person[] = Array.from({ length: 25 }, (_, i) => ({
  name: `Person ${String(i + 1).padStart(2, "0")}`,
  age: 22 + (i % 30),
  role: roles[i % roles.length]!,
  email: `person${i + 1}@example.com`,
}));

// --- Client mode: DataTable holds the full dataset and paginates itself. ---
const clientPage = ref(1);
const clientPageSize = ref(5);
const clientSort = ref<DataTableSortState | null>(null);

// --- Server mode (simulated): only the current page's rows are ever passed
// in, as if fetched from an API per page; DataTable just renders the nav
// and reports back which page/size was requested. ---
const serverPage = ref(1);
const serverPageSize = ref(5);
const serverRows = computed(() => {
  const start = (serverPage.value - 1) * serverPageSize.value;
  return manyRows.slice(start, start + serverPageSize.value);
});

const narrowPage = ref(1);
const topAlignPage = ref(1);
const endAlignPage = ref(1);

// --- Row selection ---
const multipleSelected = ref<Array<string | number>>([]);
const singleSelected = ref<Array<string | number>>([]);
const narrowSelected = ref<Array<string | number>>([]);
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

    <Variant title="Pagination (client mode)">
      <div class="p-6" data-theme="neutral" :style="{ color: 'var(--stance-color-foreground)' }">
        <p class="mb-4 text-sm opacity-70">
          DataTable holds all 25 rows and slices/sorts them itself based on page/pageSize.
        </p>
        <DataTable
          v-model:sort="clientSort"
          v-model:page="clientPage"
          v-model:page-size="clientPageSize"
          :columns="columns"
          :rows="manyRows"
          row-key="email"
          pagination-mode="client"
        />
      </div>
    </Variant>

    <Variant title="Pagination (server mode, simulated)">
      <div class="p-6" data-theme="neutral" :style="{ color: 'var(--stance-color-foreground)' }">
        <p class="mb-4 text-sm opacity-70">
          Only the current page's 5 rows are ever passed in — as if fetched per page from an API —
          and DataTable just renders the nav and reports back the requested page.
        </p>
        <DataTable
          v-model:page="serverPage"
          v-model:page-size="serverPageSize"
          :columns="columns"
          :rows="serverRows"
          row-key="email"
          pagination-mode="server"
          :total-rows="manyRows.length"
          manual-sort
        />
      </div>
    </Variant>

    <Variant title="Pagination in a narrow container">
      <div class="p-6" data-theme="neutral">
        <div style="width: 280px" :style="{ color: 'var(--stance-color-foreground)' }">
          <DataTable
            v-model:page="narrowPage"
            :columns="columns"
            :rows="manyRows"
            row-key="email"
            pagination-mode="client"
            :page-size="5"
          />
        </div>
      </div>
    </Variant>

    <Variant title="Row selection (multiple)">
      <div class="p-6" data-theme="neutral" :style="{ color: 'var(--stance-color-foreground)' }">
        <p class="mb-4 text-sm opacity-70">
          Selected: {{ multipleSelected.length === 0 ? "none" : multipleSelected.join(", ") }}
        </p>
        <DataTable
          v-model:selected="multipleSelected"
          :columns="columns"
          :rows="rows"
          row-key="email"
          selection-mode="multiple"
        />
      </div>
    </Variant>

    <Variant title="Row selection (single)">
      <div class="p-6" data-theme="neutral" :style="{ color: 'var(--stance-color-foreground)' }">
        <p class="mb-4 text-sm opacity-70">
          Selected: {{ singleSelected.length === 0 ? "none" : singleSelected.join(", ") }}
        </p>
        <DataTable
          v-model:selected="singleSelected"
          :columns="columns"
          :rows="rows"
          row-key="email"
          selection-mode="single"
        />
      </div>
    </Variant>

    <Variant title="Row selection in a narrow container">
      <div class="p-6" data-theme="neutral">
        <div style="width: 280px" :style="{ color: 'var(--stance-color-foreground)' }">
          <DataTable
            v-model:selected="narrowSelected"
            :columns="columns"
            :rows="rows"
            row-key="email"
            selection-mode="multiple"
          />
        </div>
      </div>
    </Variant>

    <Variant title="Pagination position and alignment">
      <div class="space-y-8 p-6" data-theme="neutral" :style="{ color: 'var(--stance-color-foreground)' }">
        <div>
          <h3 class="mb-2 text-sm font-medium opacity-70">position="top", align="center"</h3>
          <DataTable
            v-model:page="topAlignPage"
            :columns="columns"
            :rows="manyRows"
            row-key="email"
            pagination-mode="client"
            :page-size="5"
            pagination-position="top"
            pagination-align="center"
          />
        </div>

        <div>
          <h3 class="mb-2 text-sm font-medium opacity-70">position="bottom" (default), align="end"</h3>
          <DataTable
            v-model:page="endAlignPage"
            :columns="columns"
            :rows="manyRows"
            row-key="email"
            pagination-mode="client"
            :page-size="5"
            pagination-align="end"
          />
        </div>
      </div>
    </Variant>
  </Story>
</template>
