<script setup lang="ts">
import { computed, ref } from "vue";
import { Card, Grid, DataTable, type DataTableColumn, Badge, Avatar, Skeleton, Switch } from "@stance/core";

interface Member {
  name: string;
  role: string;
  status: "Active" | "Invited";
  joined: string;
  email: string;
}

const roles = ["Engineer", "Designer", "Manager"] as const;
const members: Member[] = Array.from({ length: 23 }, (_, i) => ({
  name: `Person ${String(i + 1).padStart(2, "0")}`,
  role: roles[i % roles.length]!,
  status: i % 5 === 0 ? "Invited" : "Active",
  joined: `202${1 + (i % 5)}-0${1 + (i % 9)}-1${i % 9}`,
  email: `person${i + 1}@example.com`,
}));

const columns: DataTableColumn<Member>[] = [
  { key: "name", header: "Name", sortable: true, filterable: true },
  { key: "role", header: "Role", sortable: true, filterable: true, filterOptions: [...roles] },
  { key: "status", header: "Status", sortable: true, filterable: true, filterOptions: ["Active", "Invited"] },
  { key: "joined", header: "Joined", sortable: true },
];

const globalFilter = ref("");
const columnFilters = ref<Record<string, string>>({});
const sort = ref(null);
const page = ref(1);
const pageSize = ref(6);

const loading = ref(false);

const activeCount = computed(() => members.filter((m) => m.status === "Active").length);
const invitedCount = computed(() => members.filter((m) => m.status === "Invited").length);
</script>

# Data showcase

A Card + Grid layout wrapping a live `DataTable` — sort a column, type in the
filter box, or page through the results. The palette/density picker in the
nav re-themes every component on this page (cards, badges, avatars, the
table itself) at once.

<!--
  No blank lines anywhere inside this element tree down to </style> — a
  blank line between two lines of nested component/slot markup makes
  markdown-it end the current HTML block early and re-parse the remainder
  as prose, which silently strips the Vue scope from anything after it
  (found by hand: a blank line between Card's #header template and its
  default-slot DataTable compiled row.name as `_ctx.row.name` instead of
  the slot-scoped variable, throwing at SSR). Markdown prose paragraphs
  *before* this element (like the paragraph above) are unaffected — the
  hazard is blank lines strictly inside one component's tag span.
-->
<div class="stance-showcase-data">
  <Grid :columns="{ base: 1, sm: 3 }" gap="md">
    <Card>
      <template #header="{ headingTag }">
        <component :is="headingTag" class="stance-showcase-data__stat-label">Members</component>
      </template>
      <p class="stance-showcase-data__stat-value">{{ members.length }}</p>
    </Card>
    <Card>
      <template #header="{ headingTag }">
        <component :is="headingTag" class="stance-showcase-data__stat-label">Active</component>
      </template>
      <p class="stance-showcase-data__stat-value">
        {{ activeCount }} <Badge variant="success" label="active members">●</Badge>
      </p>
    </Card>
    <Card>
      <template #header="{ headingTag }">
        <component :is="headingTag" class="stance-showcase-data__stat-label">Invited</component>
      </template>
      <p class="stance-showcase-data__stat-value">
        {{ invitedCount }} <Badge variant="warning" label="pending invites">●</Badge>
      </p>
    </Card>
  </Grid>
  <Card class="stance-showcase-data__table-card">
    <template #header="{ headingTag }">
      <div class="stance-showcase-data__table-header">
        <component :is="headingTag" class="stance-showcase-data__stat-label">Team roster</component>
        <Switch v-model="loading">Simulate loading</Switch>
      </div>
    </template>
    <div v-if="loading" class="stance-showcase-data__skeleton-rows">
      <div v-for="i in 5" :key="i" class="stance-showcase-data__skeleton-row">
        <Skeleton class="h-8 w-8 rounded-full" />
        <Skeleton class="h-3 w-full" />
      </div>
    </div>
    <DataTable
      v-else
      v-model:global-filter="globalFilter"
      v-model:column-filters="columnFilters"
      v-model:sort="sort"
      v-model:page="page"
      v-model:page-size="pageSize"
      :columns="columns"
      :rows="members"
      row-key="email"
      pagination-mode="client"
      caption="Team roster"
    >
      <template #cell-name="{ row }">
        <div class="stance-showcase-data__name-cell">
          <Avatar size="sm" :name="row.name" />
          <span>{{ row.name }}</span>
        </div>
      </template>
      <template #cell-status="{ value }">
        <Badge :variant="value === 'Active' ? 'success' : 'warning'">{{ value }}</Badge>
      </template>
    </DataTable>
  </Card>
</div>

<style>
.stance-showcase-data {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.stance-showcase-data__stat-label {
  font-size: 0.875rem;
  font-weight: 600;
}

.stance-showcase-data__stat-value {
  font-size: 1.5rem;
  font-weight: 700;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.stance-showcase-data__table-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  flex-wrap: wrap;
}

.stance-showcase-data__name-cell {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.stance-showcase-data__skeleton-rows {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.stance-showcase-data__skeleton-row {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}
</style>
