<script setup lang="ts">
export interface SortHeaderButtonProps {
  sort: "ascending" | "descending" | "none" | undefined;
}

defineProps<SortHeaderButtonProps>();

defineEmits<{
  click: [];
}>();

defineSlots<{
  /** Column header label. */
  default(): unknown;
}>();
</script>

<template>
  <button type="button" class="stance-table-sort-button" @click="$emit('click')">
    <span><slot /></span>
    <svg class="stance-table-sort-icon" viewBox="0 0 20 20" fill="none" aria-hidden="true" :data-direction="sort">
      <path v-if="sort === 'ascending'" d="M10 5l5 6H5z" fill="currentColor" />
      <path v-else-if="sort === 'descending'" d="M10 15l-5-6h10z" fill="currentColor" />
      <path v-else d="M10 4l4 5H6zM10 16l-4-5h8z" fill="currentColor" opacity="0.5" />
    </svg>
  </button>
</template>

<style>
:where(.stance-table-sort-button) {
  display: inline-flex;
  align-items: center;
  gap: var(--stance-spacing-xs, 0.25rem);
  background: none;
  border: none;
  padding: 0;
  margin: 0;
  font: inherit;
  font-weight: inherit;
  color: inherit;
  cursor: pointer;
}

:where(.stance-table-sort-button:focus-visible) {
  outline: 2px solid var(--stance-color-ring, currentColor);
  outline-offset: 2px;
}

:where(.stance-table-sort-icon) {
  width: 0.875em;
  height: 0.875em;
  flex-shrink: 0;
}
</style>
