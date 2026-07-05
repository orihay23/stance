<script setup lang="ts">
export interface DataTablePaginationProps {
  currentPage: number;
  totalPages: number;
  pageNumbers: Array<number | "ellipsis">;
  /** @default "start" */
  align?: "start" | "center" | "end";
}

const props = withDefaults(defineProps<DataTablePaginationProps>(), {
  align: "start",
});

const emit = defineEmits<{
  "go-to-page": [page: number];
}>();
</script>

<template>
  <nav aria-label="Pagination" class="stance-datatable__pagination" :data-align="align">
    <button
      type="button"
      class="stance-datatable__page-button stance-datatable__page-button--nav"
      :disabled="currentPage <= 1"
      @click="emit('go-to-page', currentPage - 1)"
    >
      Previous
    </button>

    <ul class="stance-datatable__page-list">
      <li v-for="(p, i) in pageNumbers" :key="i">
        <span v-if="p === 'ellipsis'" class="stance-datatable__page-ellipsis" aria-hidden="true">…</span>
        <button
          v-else
          type="button"
          class="stance-datatable__page-button"
          :aria-current="p === currentPage ? 'page' : undefined"
          :data-active="p === currentPage || undefined"
          @click="emit('go-to-page', p)"
        >
          {{ p }}
        </button>
      </li>
    </ul>

    <span class="stance-datatable__page-status">Page {{ currentPage }} of {{ totalPages }}</span>

    <button
      type="button"
      class="stance-datatable__page-button stance-datatable__page-button--nav"
      :disabled="currentPage >= totalPages"
      @click="emit('go-to-page', currentPage + 1)"
    >
      Next
    </button>
  </nav>
</template>

<style>
:where(.stance-datatable__pagination) {
  display: flex;
  align-items: center;
  gap: var(--stance-spacing-sm, 0.5rem);
  flex-wrap: wrap;
  padding-top: var(--stance-spacing-md, 0.75rem);
}

:where(.stance-datatable__pagination[data-align="start"]) {
  justify-content: flex-start;
}
:where(.stance-datatable__pagination[data-align="center"]) {
  justify-content: center;
}
:where(.stance-datatable__pagination[data-align="end"]) {
  justify-content: flex-end;
}

:where(.stance-datatable__page-list) {
  display: flex;
  align-items: center;
  gap: var(--stance-spacing-xs, 0.25rem);
  list-style: none;
  margin: 0;
  padding: 0;
}

:where(.stance-datatable__page-button) {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 2rem;
  height: 2rem;
  padding: 0 var(--stance-spacing-sm, 0.5rem);
  border: 1px solid var(--stance-color-border);
  border-radius: var(--stance-radius-sm, 0.25rem);
  background: var(--stance-color-background);
  color: var(--stance-color-foreground);
  font: inherit;
  font-size: var(--stance-text-sm, 0.875rem);
  cursor: pointer;
}

:where(.stance-datatable__page-button:disabled) {
  cursor: not-allowed;
  opacity: 0.5;
}

:where(.stance-datatable__page-button:not(:disabled):hover) {
  background: var(--stance-color-muted);
}

:where(.stance-datatable__page-button:focus-visible) {
  outline: 2px solid var(--stance-color-ring, currentColor);
  outline-offset: 2px;
}

:where(.stance-datatable__page-button[data-active]) {
  background: var(--stance-color-primary);
  border-color: var(--stance-color-primary);
  color: var(--stance-color-primary-foreground);
}

:where(.stance-datatable__page-ellipsis) {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 2rem;
  height: 2rem;
  color: var(--stance-color-muted-foreground);
}

:where(.stance-datatable__page-status) {
  display: none;
  font-size: var(--stance-text-sm, 0.875rem);
  color: var(--stance-color-muted-foreground);
}

/* The numbered page list doesn't fit comfortably once its DataTable's
   container drops below this width — a plain "Page X of Y" status plus
   Previous/Next always fits regardless of how many total pages there are.
   Also overrides `data-align` here (justify-content ties broken by source
   order, same :where() specificity) since spreading Previous/status/Next to
   opposite ends is the sensible default at this width regardless of the
   configured alignment. */
@container stance-datatable (max-width: 32rem) {
  :where(.stance-datatable__page-list) {
    display: none;
  }

  :where(.stance-datatable__page-status) {
    display: inline-flex;
  }

  :where(.stance-datatable__pagination) {
    justify-content: space-between;
  }
}
</style>
