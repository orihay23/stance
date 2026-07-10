<script setup lang="ts">
import type { VirtualElement } from "@floating-ui/vue";
import { onBeforeUnmount } from "vue";
import { useDropdownMenuContext } from "../composables/useDropdownMenu";

// A renderless "props getter" — no wrapper DOM node, so it can anchor a
// context menu to arbitrary consumer markup (a <tr>, a <li>, a whole
// container) without risking invalid nesting the way a wrapping <div>
// would. The scoped slot exposes plain event handlers for the consumer to
// v-bind onto their own element; this mirrors Ark UI's context-menu shape
// (a single trigger mode grafted onto the existing menu) rather than
// Reka's separate-components shape, reusing DropdownMenu's own roving
// focus/typeahead/useDismissable logic untouched — see DropdownMenuContent,
// which already prefers `virtualReference` over `triggerRef` when set.
export interface DropdownMenuContextTriggerProps {
  disabled?: boolean;
  /** Touch long-press delay in milliseconds, matching Ark UI's ~700ms convention. @default 700 */
  longPressDelay?: number;
}

const props = withDefaults(defineProps<DropdownMenuContextTriggerProps>(), {
  disabled: false,
  longPressDelay: 700,
});

export interface DropdownMenuContextTriggerSlotProps {
  onContextmenu: (event: MouseEvent) => void;
  onTouchstart: (event: TouchEvent) => void;
  onTouchmove: (event: TouchEvent) => void;
  onTouchend: (event: TouchEvent) => void;
  onTouchcancel: (event: TouchEvent) => void;
}

defineSlots<{
  /** Bind the given handlers onto the element that should open the context menu. */
  default(props: DropdownMenuContextTriggerSlotProps): unknown;
}>();

const context = useDropdownMenuContext("DropdownMenuContextTrigger");

function openAt(x: number, y: number) {
  if (!context || props.disabled) return;
  const rect = { x, y, top: y, left: x, right: x, bottom: y, width: 0, height: 0 };
  const virtualElement: VirtualElement = { getBoundingClientRect: () => rect };
  context.virtualReference.value = virtualElement;
  context.openedViaKeyboard.value = false;
  context.pendingFocus.value = "first";
  context.setOpen(true);
}

// The native "contextmenu" event fires for a real right-click AND for a
// mobile browser's own long-press gesture, AND (for free) for Shift+F10 /
// the Menu key on a focused element — so keyboard access works without any
// extra code here, as long as the consumer's bound element is focusable.
// `longPressFired` suppresses the double-open some mobile browsers produce
// by firing both our manual touch timer's open and their own synthesized
// contextmenu for the same gesture.
let longPressFired = false;

function onContextmenu(event: MouseEvent) {
  if (longPressFired) {
    longPressFired = false;
    event.preventDefault();
    return;
  }
  event.preventDefault();
  openAt(event.clientX, event.clientY);
}

let longPressTimer: ReturnType<typeof setTimeout> | undefined;
let touchStart: { x: number; y: number } | undefined;

// 10px of movement cancels the gesture — the same tap-vs-drag/scroll
// threshold most touch UIs use, so a scroll doesn't accidentally open a
// context menu partway through.
const MOVE_THRESHOLD = 10;

function clearLongPressTimer() {
  clearTimeout(longPressTimer);
  longPressTimer = undefined;
  touchStart = undefined;
}

function onTouchstart(event: TouchEvent) {
  if (props.disabled || event.touches.length !== 1) return;
  const touch = event.touches[0]!;
  touchStart = { x: touch.clientX, y: touch.clientY };
  clearTimeout(longPressTimer);
  longPressTimer = setTimeout(() => {
    longPressFired = true;
    openAt(touch.clientX, touch.clientY);
  }, props.longPressDelay);
}

function onTouchmove(event: TouchEvent) {
  if (!touchStart) return;
  const touch = event.touches[0];
  if (!touch) return;
  const dx = touch.clientX - touchStart.x;
  const dy = touch.clientY - touchStart.y;
  if (Math.hypot(dx, dy) > MOVE_THRESHOLD) clearLongPressTimer();
}

function onTouchend() {
  clearLongPressTimer();
}

function onTouchcancel() {
  clearLongPressTimer();
}

onBeforeUnmount(() => {
  clearLongPressTimer();
});
</script>

<template>
  <slot
    :onContextmenu="onContextmenu"
    :onTouchstart="onTouchstart"
    :onTouchmove="onTouchmove"
    :onTouchend="onTouchend"
    :onTouchcancel="onTouchcancel"
  />
</template>
