<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { cn } from "../utils/cn";

export type AvatarSize = "sm" | "md" | "lg" | "xl";

export interface AvatarProps {
  /** Image URL. Falls back to initials (or an icon) if omitted or if the image fails to load. */
  src?: string;
  /**
   * The person/entity's name. Used as the image's `alt` text, to derive
   * fallback initials, and as the fallback's accessible name — omit for a
   * purely decorative avatar (e.g. a generic placeholder with no identity
   * behind it yet), in which case the avatar is hidden from assistive tech
   * entirely rather than announcing nothing useful.
   */
  name?: string;
  /** Overrides the initials derived from `name` (e.g. pass "JS" directly). */
  initials?: string;
  /** @default "md" */
  size?: AvatarSize;
  /** Extra classes merged with internal classes via `tailwind-merge`. */
  class?: string;
}

const props = withDefaults(defineProps<AvatarProps>(), {
  size: "md",
});

const imgFailed = ref(false);
watch(
  () => props.src,
  () => {
    imgFailed.value = false;
  },
);

const showImage = computed(() => Boolean(props.src) && !imgFailed.value);

const computedInitials = computed(() => {
  if (props.initials) return props.initials.slice(0, 2).toUpperCase();
  if (!props.name) return undefined;
  const words = props.name.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return undefined;
  const first = words[0]!.charAt(0);
  const last = words.length > 1 ? words[words.length - 1]!.charAt(0) : "";
  return (first + last).toUpperCase();
});

const rootClass = computed(() => cn("stance-avatar", props.class));
</script>

<template>
  <span :class="rootClass" :data-size="size">
    <img v-if="showImage" class="stance-avatar__image" :src="src" :alt="name ?? ''" @error="imgFailed = true" />
    <span
      v-else
      class="stance-avatar__fallback"
      :role="name ? 'img' : undefined"
      :aria-label="name || undefined"
      :aria-hidden="name ? undefined : true"
    >
      <span v-if="computedInitials" class="stance-avatar__initials">{{ computedInitials }}</span>
      <svg v-else class="stance-avatar__icon" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <circle cx="12" cy="8" r="4" fill="currentColor" />
        <path d="M4 20c0-4.418 3.582-8 8-8s8 3.582 8 8" fill="currentColor" />
      </svg>
    </span>
  </span>
</template>

<style>
:where(.stance-avatar) {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  overflow: hidden;
  border-radius: var(--stance-radius-full, 9999px);
  background: var(--stance-color-muted);
  color: var(--stance-color-muted-foreground);
  font-family: var(--stance-font-sans, ui-sans-serif, system-ui, sans-serif);
  font-weight: var(--stance-font-weight-medium, 500);
  user-select: none;
}

:where(.stance-avatar[data-size="sm"]) {
  width: var(--stance-control-avatar-size-sm, 1.75rem);
  height: var(--stance-control-avatar-size-sm, 1.75rem);
  font-size: var(--stance-text-xs, 0.75rem);
}
:where(.stance-avatar[data-size="md"]) {
  width: var(--stance-control-avatar-size-md, 2.5rem);
  height: var(--stance-control-avatar-size-md, 2.5rem);
  font-size: var(--stance-text-sm, 0.875rem);
}
:where(.stance-avatar[data-size="lg"]) {
  width: var(--stance-control-avatar-size-lg, 3.5rem);
  height: var(--stance-control-avatar-size-lg, 3.5rem);
  font-size: var(--stance-text-lg, 1.125rem);
}
:where(.stance-avatar[data-size="xl"]) {
  width: var(--stance-control-avatar-size-xl, 5rem);
  height: var(--stance-control-avatar-size-xl, 5rem);
  font-size: var(--stance-text-2xl, 1.5rem);
}

:where(.stance-avatar__image) {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

:where(.stance-avatar__fallback) {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
}

:where(.stance-avatar__icon) {
  width: 65%;
  height: 65%;
}
</style>
