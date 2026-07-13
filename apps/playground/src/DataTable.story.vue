<script setup lang="ts">
import { computed, ref } from "vue";
import { DataTable, type DataTableColumn, type DataTableSortState } from "@stance/core";
import { useStoryTheme } from "./useStoryTheme";

const { storyTheme, themes, densityProfiles } = useStoryTheme();

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

// --- Filtering ---
const filterableColumns: DataTableColumn<Person>[] = [
  { key: "name", header: "Name", sortable: true, filterable: true },
  { key: "age", header: "Age", sortable: true, align: "end" },
  { key: "role", header: "Role", sortable: true, filterable: true, filterOptions: [...roles] },
  { key: "email", header: "Email", filterable: true },
];
const filterGlobal = ref("");
const filterByColumn = ref<Record<string, string>>({});
const filterSort = ref<DataTableSortState | null>(null);
const filterPage = ref(1);

const manyFilterableColumns: DataTableColumn<Person>[] = [
  { key: "name", header: "Name", sortable: true, filterable: true },
  { key: "age", header: "Age", sortable: true, align: "end", filterable: true },
  { key: "role", header: "Role", sortable: true, filterable: true, filterOptions: [...roles] },
  { key: "email", header: "Email", filterable: true },
  {
    key: "seniority",
    header: "Seniority",
    filterable: true,
    filterOptions: ["Junior", "Senior"],
    accessor: (row) => (row.age >= 35 ? "Senior" : "Junior"),
  },
];
const manyFilterGlobal = ref("");
const manyFilterByColumn = ref<Record<string, string>>({});
</script>

<template>
  <Story title="DataTable">
    <Variant title="Light + Dark">
      <div class="grid grid-cols-1 gap-8 p-6 md:grid-cols-2">
        <section
          :data-theme="storyTheme"
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
          :data-theme="storyTheme"
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
      <div class="grid grid-cols-1 gap-8 p-6 md:grid-cols-2" :data-theme="storyTheme">
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
      <div class="space-y-8 p-6" :data-theme="storyTheme">
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
      <div class="p-6" :data-theme="storyTheme" :style="{ color: 'var(--stance-color-foreground)' }">
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
      <div class="p-6" :data-theme="storyTheme" :style="{ color: 'var(--stance-color-foreground)' }">
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
      <div class="p-6" :data-theme="storyTheme">
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
      <div class="p-6" :data-theme="storyTheme" :style="{ color: 'var(--stance-color-foreground)' }">
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
      <div class="p-6" :data-theme="storyTheme" :style="{ color: 'var(--stance-color-foreground)' }">
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
      <div class="p-6" :data-theme="storyTheme">
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

    <Variant title="Filtering (global search + per-column)">
      <div class="p-6" :data-theme="storyTheme" :style="{ color: 'var(--stance-color-foreground)' }">
        <p class="mb-4 text-sm opacity-70">
          Global search matches Name/Role/Email (filterable columns). Role has a select-from-values
          filter (inferred from filterOptions); Name/Email get free-text "contains" inputs.
        </p>
        <DataTable
          v-model:global-filter="filterGlobal"
          v-model:column-filters="filterByColumn"
          v-model:sort="filterSort"
          v-model:page="filterPage"
          :columns="filterableColumns"
          :rows="manyRows"
          row-key="email"
          pagination-mode="client"
          :page-size="5"
        />
      </div>
    </Variant>

    <Variant title="Filtering (Filters disclosure past 4 filterable columns)">
      <div class="p-6" :data-theme="storyTheme" :style="{ color: 'var(--stance-color-foreground)' }">
        <p class="mb-4 text-sm opacity-70">
          5 filterable columns here — per-column filters collapse behind a "Filters" disclosure
          instead of crowding the toolbar.
        </p>
        <DataTable
          v-model:global-filter="manyFilterGlobal"
          v-model:column-filters="manyFilterByColumn"
          :columns="manyFilterableColumns"
          :rows="rows"
          row-key="email"
        />
      </div>
    </Variant>

    <Variant title="Density">
      <!-- Single column, not the usual 4-across grid — DataTable's own
           container-query card-collapse kicks in below ~450px (see the
           "Responsive" variant above), so a narrow column here would show
           the collapsed-card view for every density instead of the table
           itself, which is what this variant is actually meant to compare. -->
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
          <DataTable :columns="columns" :rows="rows.slice(0, 2)" row-key="email" />
        </section>
      </div>
    </Variant>

    <Variant title="Pagination position and alignment">
      <div class="space-y-8 p-6" :data-theme="storyTheme" :style="{ color: 'var(--stance-color-foreground)' }">
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
