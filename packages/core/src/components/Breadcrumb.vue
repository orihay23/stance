<script setup lang="ts">
import { computed, ref } from "vue";
import { cn } from "../utils/cn";
import DropdownMenu from "./DropdownMenu.vue";
import DropdownMenuTrigger from "./DropdownMenuTrigger.vue";
import DropdownMenuContent from "./DropdownMenuContent.vue";
import DropdownMenuItem from "./DropdownMenuItem.vue";

export interface BreadcrumbItem {
  label: string;
  /** Omit for a non-navigable item (typically the current page, the last entry). */
  href?: string;
}

export interface BreadcrumbProps {
  items: BreadcrumbItem[];
  /** Accessible name for the `<nav>` landmark. @default "Breadcrumb" */
  label?: string;
  /** Extra classes merged with internal classes via `tailwind-merge`. */
  class?: string;
}

const props = withDefaults(defineProps<BreadcrumbProps>(), {
  label: "Breadcrumb",
});

// First and last are always shown; everything between them collapses behind
// a "…" menu once the container is too narrow to fit the whole trail (see
// the @container rule below) — a fixed, container-query-driven threshold
// rather than a JS-measured "how many actually fit" calculation.
const firstItem = computed(() => (props.items.length > 1 ? props.items[0] : undefined));
const lastItem = computed(() => props.items[props.items.length - 1]);
const middleItems = computed(() => (props.items.length > 2 ? props.items.slice(1, -1) : []));
const hasCollapsible = computed(() => middleItems.value.length > 0);

const ellipsisOpen = ref(false);

const rootClass = computed(() => cn("stance-breadcrumb-container", props.class));
</script>

<template>
  <nav :aria-label="label" :class="rootClass">
    <ol class="stance-breadcrumb">
      <li v-if="firstItem" class="stance-breadcrumb__item stance-breadcrumb__item--first">
        <a v-if="firstItem.href" class="stance-breadcrumb__link" :href="firstItem.href">{{ firstItem.label }}</a>
        <span v-else>{{ firstItem.label }}</span>
      </li>

      <li v-if="hasCollapsible" class="stance-breadcrumb__item stance-breadcrumb__item--ellipsis">
        <svg class="stance-breadcrumb__separator" viewBox="0 0 20 20" fill="none" aria-hidden="true">
          <path d="M7.5 4l6 6-6 6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
        </svg>
        <DropdownMenu v-model="ellipsisOpen">
          <DropdownMenuTrigger variant="ghost" size="sm" class="stance-breadcrumb__ellipsis-trigger">
            <span class="stance-visually-hidden">Show {{ middleItems.length }} hidden items</span>
            <span aria-hidden="true">…</span>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem v-for="(item, index) in middleItems" :key="index" :href="item.href">
              {{ item.label }}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </li>

      <li
        v-for="item in middleItems"
        :key="item.label"
        class="stance-breadcrumb__item stance-breadcrumb__item--middle"
      >
        <svg class="stance-breadcrumb__separator" viewBox="0 0 20 20" fill="none" aria-hidden="true">
          <path d="M7.5 4l6 6-6 6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
        </svg>
        <a v-if="item.href" class="stance-breadcrumb__link" :href="item.href">{{ item.label }}</a>
        <span v-else>{{ item.label }}</span>
      </li>

      <li class="stance-breadcrumb__item stance-breadcrumb__item--last">
        <svg
          v-if="items.length > 1"
          class="stance-breadcrumb__separator"
          viewBox="0 0 20 20"
          fill="none"
          aria-hidden="true"
        >
          <path d="M7.5 4l6 6-6 6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
        </svg>
        <a v-if="lastItem?.href" class="stance-breadcrumb__link" aria-current="page" :href="lastItem.href">{{
          lastItem.label
        }}</a>
        <span v-else aria-current="page">{{ lastItem?.label }}</span>
      </li>
    </ol>
  </nav>
</template>

<style>
:where(.stance-breadcrumb-container) {
  container-type: inline-size;
  container-name: stance-breadcrumb;
  font-family: var(--stance-font-sans, ui-sans-serif, system-ui, sans-serif);
  font-size: var(--stance-text-sm, 0.875rem);
}

:where(.stance-breadcrumb) {
  display: flex;
  flex-wrap: nowrap;
  align-items: center;
  gap: var(--stance-spacing-xs, 0.25rem);
  margin: 0;
  padding: 0;
  list-style: none;
  overflow: hidden;
}

:where(.stance-breadcrumb__item) {
  display: flex;
  align-items: center;
  gap: var(--stance-spacing-xs, 0.25rem);
  min-width: 0;
}

:where(.stance-breadcrumb__item--last) {
  color: var(--stance-color-foreground);
  font-weight: var(--stance-font-weight-medium, 500);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

:where(.stance-breadcrumb__link) {
  color: var(--stance-color-muted-foreground);
  text-decoration: none;
}

:where(.stance-breadcrumb__link:hover) {
  color: var(--stance-color-foreground);
  text-decoration: underline;
}

:where(.stance-breadcrumb__link:focus-visible) {
  outline: 2px solid var(--stance-color-ring, currentColor);
  outline-offset: 2px;
  border-radius: var(--stance-radius-sm, 0.25rem);
}

:where(.stance-breadcrumb__separator) {
  width: 1em;
  height: 1em;
  flex-shrink: 0;
  color: var(--stance-color-muted-foreground);
}

:where(.stance-breadcrumb__ellipsis-trigger) {
  min-width: 0;
  padding-inline: var(--stance-spacing-xs, 0.25rem);
}

/* Wide enough: show every item, hide the "…" collapse trigger entirely. */
:where(.stance-breadcrumb__item--ellipsis) {
  display: none;
}

/* Below this container width, the full trail doesn't reliably fit — collapse
   everything between the first and last item behind the "…" trigger. Both
   sides are :where()-wrapped (specificity 0); this comes later in source
   order, so it correctly overrides the base rules above at this width. */
@container stance-breadcrumb (max-width: 24rem) {
  :where(.stance-breadcrumb__item--middle) {
    display: none;
  }
  :where(.stance-breadcrumb__item--ellipsis) {
    display: flex;
  }
}

</style>
