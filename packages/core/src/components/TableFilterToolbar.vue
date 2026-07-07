<script setup lang="ts" generic="C extends TableFilterToolbarColumn">
import Input from "./Input.vue";
import Select from "./Select.vue";

export interface TableFilterToolbarColumn {
  key: string;
  header: string;
  filterOptions?: string[];
}

export interface TableFilterToolbarProps<C extends TableFilterToolbarColumn> {
  columns: C[];
  globalFilter: string;
  globalFilterId: string;
  columnFilterId: (column: C) => string;
  columnFilterValue: (column: C) => string;
  filterTypeFor: (column: C) => "text" | "select";
}

defineProps<TableFilterToolbarProps<C>>();

const emit = defineEmits<{
  "update:globalFilter": [value: string];
  columnFilter: [column: C, value: string];
}>();
</script>

<template>
  <div class="stance-table-filters">
    <div class="stance-table-global-filter">
      <label :for="globalFilterId" class="stance-visually-hidden">Search</label>
      <Input
        :id="globalFilterId"
        :model-value="globalFilter"
        placeholder="Search…"
        @update:model-value="(v) => emit('update:globalFilter', v)"
      />
    </div>

    <component :is="columns.length > 4 ? 'details' : 'div'" class="stance-table-column-filters">
      <summary v-if="columns.length > 4" class="stance-table-filters-summary">Filters</summary>
      <div class="stance-table-column-filters-body">
        <div v-for="column in columns" :key="column.key" class="stance-table-column-filter">
          <label :for="columnFilterId(column)">{{ column.header }}</label>
          <Select
            v-if="filterTypeFor(column) === 'select'"
            :id="columnFilterId(column)"
            :model-value="columnFilterValue(column)"
            @update:model-value="(v) => emit('columnFilter', column, v)"
          >
            <option value="">All</option>
            <option v-for="opt in column.filterOptions" :key="opt" :value="opt">{{ opt }}</option>
          </Select>
          <Input
            v-else
            :id="columnFilterId(column)"
            :model-value="columnFilterValue(column)"
            @update:model-value="(v) => emit('columnFilter', column, v)"
          />
        </div>
      </div>
    </component>
  </div>
</template>

<style>
:where(.stance-table-filters) {
  display: flex;
  flex-wrap: wrap;
  align-items: end;
  gap: var(--stance-spacing-md, 0.75rem);
  padding-bottom: var(--stance-spacing-md, 0.75rem);
}

:where(.stance-table-global-filter) {
  flex: 1 1 16rem;
  min-width: 12rem;
}

:where(.stance-table-column-filters) {
  display: contents;
}

:where(.stance-table-column-filters-body) {
  display: flex;
  flex-wrap: wrap;
  align-items: end;
  gap: var(--stance-spacing-md, 0.75rem);
}

:where(.stance-table-column-filter) {
  display: flex;
  flex-direction: column;
  gap: var(--stance-spacing-xs, 0.25rem);
  min-width: 9rem;
  font-size: var(--stance-text-sm, 0.875rem);
}

:where(.stance-table-column-filter label) {
  color: var(--stance-color-muted-foreground);
  font-weight: var(--stance-font-weight-medium, 500);
}

:where(.stance-table-filters-summary) {
  display: inline-flex;
  align-items: center;
  height: 2.25rem;
  padding: 0 var(--stance-spacing-md, 0.75rem);
  border: 1px solid var(--stance-color-border);
  border-radius: var(--stance-radius-sm, 0.25rem);
  color: var(--stance-color-foreground);
  font-size: var(--stance-text-sm, 0.875rem);
  cursor: pointer;
  list-style: none;
}

:where(.stance-table-filters-summary::-webkit-details-marker) {
  display: none;
}

:where(.stance-table-filters-summary:hover) {
  background: var(--stance-color-muted);
}

:where(.stance-table-filters-summary:focus-visible) {
  outline: 2px solid var(--stance-color-ring, currentColor);
  outline-offset: 2px;
}

:where(details.stance-table-column-filters) {
  display: block;
}

:where(details.stance-table-column-filters .stance-table-column-filters-body) {
  margin-top: var(--stance-spacing-md, 0.75rem);
}
</style>
