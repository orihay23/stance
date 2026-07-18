<script setup lang="ts">
import { computed, useId } from "vue";
import { cn } from "../utils/cn";
import Select from "./Select.vue";

export interface PaginationProps {
  /** v-model:page (1-indexed). */
  page: number;
  totalPages: number;
  /**
   * v-model:pageSize. Optional — omit it (and `pageSizeOptions`) to render
   * page navigation only, with no page-size picker.
   */
  pageSize?: number | undefined;
  /**
   * Choices offered by the page-size picker. The picker only renders when
   * both this and `pageSize` are given — either alone isn't enough to know
   * what to show or emit.
   */
  pageSizeOptions?: number[] | undefined;
  /** @default "start" */
  align?: "start" | "center" | "end";
  /** Extra classes merged with internal classes via `tailwind-merge` — applied to the root `<nav>`. */
  class?: string;
}

const props = withDefaults(defineProps<PaginationProps>(), {
  align: "start",
});

const emit = defineEmits<{
  "update:page": [value: number];
  "update:pageSize": [value: number];
}>();

const rootClass = computed(() => cn("stance-pagination", props.class));
const showPageSizePicker = computed(() => props.pageSize !== undefined && props.pageSizeOptions !== undefined);
const pageSizeSelectId = useId();

function goToPage(target: number) {
  const clamped = Math.min(Math.max(1, target), props.totalPages);
  emit("update:page", clamped);
}

function onPageSizeChange(value: string) {
  emit("update:pageSize", Number(value));
}

/** Windowed page numbers around the current page, with "ellipsis" markers for gaps. */
const pageNumbers = computed<Array<number | "ellipsis">>(() => {
  const total = props.totalPages;
  const current = props.page;
  const delta = 1;
  const left = Math.max(2, current - delta);
  const right = Math.min(total - 1, current + delta);

  const range: Array<number | "ellipsis"> = [1];
  if (left > 2) range.push("ellipsis");
  for (let i = left; i <= right; i++) range.push(i);
  if (right < total - 1) range.push("ellipsis");
  if (total > 1) range.push(total);
  return range;
});
</script>

<template>
  <nav aria-label="Pagination" :class="rootClass" :data-align="align">
    <button
      type="button"
      class="stance-pagination__page-button stance-pagination__page-button--nav"
      :disabled="page <= 1"
      @click="goToPage(page - 1)"
    >
      Previous
    </button>

    <ul class="stance-pagination__page-list">
      <li v-for="(p, i) in pageNumbers" :key="i">
        <span v-if="p === 'ellipsis'" class="stance-pagination__page-ellipsis" aria-hidden="true">…</span>
        <button
          v-else
          type="button"
          class="stance-pagination__page-button"
          :aria-current="p === page ? 'page' : undefined"
          :data-active="p === page || undefined"
          @click="goToPage(p)"
        >
          {{ p }}
        </button>
      </li>
    </ul>

    <span class="stance-pagination__page-status">Page {{ page }} of {{ totalPages }}</span>

    <button
      type="button"
      class="stance-pagination__page-button stance-pagination__page-button--nav"
      :disabled="page >= totalPages"
      @click="goToPage(page + 1)"
    >
      Next
    </button>

    <div v-if="showPageSizePicker" class="stance-pagination__page-size">
      <label :for="pageSizeSelectId" class="stance-pagination__page-size-label">Rows per page</label>
      <Select
        :id="pageSizeSelectId"
        class="stance-pagination__page-size-select"
        :model-value="String(pageSize)"
        @update:model-value="onPageSizeChange"
      >
        <option v-for="size in pageSizeOptions" :key="size" :value="size">{{ size }}</option>
      </Select>
    </div>
  </nav>
</template>

<style>
:where(.stance-pagination) {
  /* Declares its own named container (rather than relying on an ancestor
     like DataTable's) so the responsive collapse below works whether
     Pagination is used standalone or embedded — its own <nav> width is
     the same effective width DataTable's outer wrapper used to measure,
     since this nav is always a direct child of whatever's laying it out. */
  container-type: inline-size;
  container-name: stance-pagination;
  display: flex;
  align-items: center;
  gap: var(--stance-spacing-sm, 0.5rem);
  flex-wrap: wrap;
  padding-top: var(--stance-spacing-md, 0.75rem);
}

:where(.stance-pagination[data-align="start"]) {
  justify-content: flex-start;
}
:where(.stance-pagination[data-align="center"]) {
  justify-content: center;
}
:where(.stance-pagination[data-align="end"]) {
  justify-content: flex-end;
}

:where(.stance-pagination__page-list) {
  display: flex;
  align-items: center;
  gap: var(--stance-spacing-xs, 0.25rem);
  list-style: none;
  margin: 0;
  padding: 0;
}

:where(.stance-pagination__page-button) {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: max(var(--stance-control-height-sm, 2rem), 2rem);
  height: max(var(--stance-control-height-sm, 2rem), 2rem);
  padding: 0 var(--stance-spacing-sm, 0.5rem);
  border: 1px solid var(--stance-color-border);
  border-radius: var(--stance-radius-sm, 0.25rem);
  background: var(--stance-color-background);
  color: var(--stance-color-foreground);
  font: inherit;
  font-size: var(--stance-text-sm, 0.875rem);
  cursor: pointer;
}

:where(.stance-pagination__page-button:disabled) {
  cursor: not-allowed;
  opacity: 0.5;
}

:where(.stance-pagination__page-button:not(:disabled):hover) {
  background: var(--stance-color-muted);
}

:where(.stance-pagination__page-button:focus-visible) {
  outline: 2px solid var(--stance-color-ring, currentColor);
  outline-offset: 2px;
}

:where(.stance-pagination__page-button[data-active]) {
  background: var(--stance-color-primary);
  border-color: var(--stance-color-primary);
  color: var(--stance-color-primary-foreground);
}

:where(.stance-pagination__page-ellipsis) {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: max(var(--stance-control-height-sm, 2rem), 2rem);
  height: max(var(--stance-control-height-sm, 2rem), 2rem);
  color: var(--stance-color-muted-foreground);
}

:where(.stance-pagination__page-status) {
  display: none;
  font-size: var(--stance-text-sm, 0.875rem);
  color: var(--stance-color-muted-foreground);
}

:where(.stance-pagination__page-size) {
  display: flex;
  align-items: center;
  gap: var(--stance-spacing-xs, 0.25rem);
  margin-inline-start: auto;
}

:where(.stance-pagination__page-size-label) {
  font-size: var(--stance-text-sm, 0.875rem);
  color: var(--stance-color-muted-foreground);
  white-space: nowrap;
}

:where(.stance-pagination__page-size-select) {
  width: auto;
  min-width: 4.5rem;
}

/* The numbered page list doesn't fit comfortably once Pagination's own
   container drops below this width — a plain "Page X of Y" status plus
   Previous/Next always fits regardless of how many total pages there are.
   Also overrides `data-align` here (justify-content ties broken by source
   order, same :where() specificity) since spreading Previous/status/Next to
   opposite ends is the sensible default at this width regardless of the
   configured alignment. */
@container stance-pagination (max-width: 32rem) {
  :where(.stance-pagination__page-list) {
    display: none;
  }

  :where(.stance-pagination__page-status) {
    display: inline-flex;
  }

  :where(.stance-pagination) {
    justify-content: space-between;
  }
}
</style>
