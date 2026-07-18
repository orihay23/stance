<script setup lang="ts">
import { computed, ref, useId, useTemplateRef, watch } from "vue";
import { cn } from "../utils/cn";
import { getOverlayRoot } from "../utils/dom";
import { clampDate, formatDate, getLocaleMonthLabel, isDateDisabled, parseDate, type Weekday } from "../utils/date";
import { useDismissable } from "../composables/useDismissable";
import { useErrorSlot } from "../composables/useErrorSlot";
import { useFloatingOverlay } from "../composables/useFloatingOverlay";
import { useFocusTrap } from "../composables/useFocusTrap";
import { useModalBackground } from "../composables/useModalBackground";
import { useOverlayThemeContext } from "../composables/useOverlayThemeContext";
import Calendar from "./Calendar.vue";

// The template now has two root nodes (the field/calendar wrapper and the
// conditional error <p>) once the error slot is added, so Vue disables
// automatic attrs fallthrough — same reason Input/Textarea need this.
defineOptions({ inheritAttrs: false });

export type DatePickerMode = "single" | "range";

export interface DatePickerRangeValue {
  start?: Date;
  end?: Date;
}

export interface DatePickerProps {
  /** @default "single" */
  mode?: DatePickerMode;
  /** v-model. A `Date | undefined` in mode="single"; a `DatePickerRangeValue` in mode="range" — kept as a plain union rather than discriminated by `mode`, same reasoning as Accordion's `modelValue`. */
  modelValue?: Date | DatePickerRangeValue;
  /** Earliest selectable date (inclusive). */
  min?: Date;
  /** Latest selectable date (inclusive). */
  max?: Date;
  /** Arbitrary per-date disabling (holidays, booked days, etc.) beyond min/max. */
  disabledDates?: (date: Date) => boolean;
  /** BCP 47 tag driving month/weekday names and the typed-input format. @default "en-US" */
  locale?: string;
  /** Overrides the locale-derived week start (0=Sunday…6=Saturday) for locales `Intl` doesn't resolve correctly (see date.ts). */
  firstDayOfWeek?: Weekday;
  disabled?: boolean;
  required?: boolean;
  /** Marks the input invalid: set this for externally-known validation failures. Typed text that doesn't parse to a real, enabled date sets the same visual/aria state internally. */
  invalid?: boolean;
  placeholder?: string;
  /** id for the underlying text input. Auto-generated via `useId()` if omitted — pass your own to pair with an external `<label for>`, same convention as Input.vue. */
  id?: string;
  /** Extra classes merged with internal classes via `tailwind-merge` — applied to the root container. */
  class?: string;
}

const props = withDefaults(defineProps<DatePickerProps>(), {
  mode: "single",
  locale: "en-US",
  disabled: false,
  required: false,
  invalid: false,
});

const emit = defineEmits<{
  "update:modelValue": [value: Date | DatePickerRangeValue | undefined];
}>();

const slots = defineSlots<{
  /** Error message shown — and wired to `aria-describedby` — when `invalid` (or a typed parse error) is true. */
  error?(): unknown;
}>();

const baseId = useId();
const inputId = computed(() => props.id ?? `${baseId}-input`);
const dialogId = `${baseId}-dialog`;

const open = ref(false);
const focusedDate = ref(clampDate(new Date(), props.min, props.max));
const inputText = ref("");
const hasParseError = ref(false);

const { errorId, showError, describedBy } = useErrorSlot(
  () => inputId.value,
  () => props.invalid || hasParseError.value,
  () => Boolean(slots.error),
);

const fieldRef = useTemplateRef<HTMLElement>("fieldRef");
const inputRef = useTemplateRef<HTMLInputElement>("inputRef");
const triggerRef = useTemplateRef<HTMLButtonElement>("triggerRef");
const dialogRef = useTemplateRef<HTMLElement>("dialogRef");
const calendarRef = useTemplateRef<InstanceType<typeof Calendar>>("calendarRef");
const initialFocusEl = computed(() => calendarRef.value?.getFocusedCellElement() ?? null);

const singleValue = computed(() => (props.mode === "single" ? (props.modelValue as Date | undefined) : undefined));
const rangeValue = computed(() =>
  props.mode === "range" ? (props.modelValue as DatePickerRangeValue | undefined) : undefined,
);

watch(
  singleValue,
  (value) => {
    inputText.value = value ? formatDate(value, props.locale) : "";
  },
  { immediate: true },
);

const rangeDisplayText = computed(() => {
  const value = rangeValue.value;
  if (!value?.start) return "";
  const startText = formatDate(value.start, props.locale);
  if (!value.end) return `${startText} – Select end date`;
  return `${startText} – ${formatDate(value.end, props.locale)}`;
});

const fieldValue = computed(() => (props.mode === "single" ? inputText.value : rangeDisplayText.value));

// Only for the outer dialog's own aria-label ("Choose date, {month}") — the
// grid's own aria-label is Calendar's concern now.
const monthLabel = computed(() => getLocaleMonthLabel(props.locale, focusedDate.value.getFullYear(), focusedDate.value.getMonth()));

function isDisabledDate(date: Date): boolean {
  return isDateDisabled(date, props.min, props.max, props.disabledDates);
}

function onCalendarModelUpdate(value: Date | DatePickerRangeValue | undefined) {
  emit("update:modelValue", value);
  // Single mode always completes a selection in one click; range mode only
  // completes once `end` is set — mirrors the pre-extraction selectDay().
  const isComplete = props.mode === "single" || Boolean((value as DatePickerRangeValue | undefined)?.end);
  if (isComplete) closeCalendar();
}

function openCalendar() {
  if (props.disabled) return;
  const anchor = props.mode === "single" ? singleValue.value : rangeValue.value?.end ?? rangeValue.value?.start;
  focusedDate.value = clampDate(anchor ?? new Date(), props.min, props.max);
  open.value = true;
}

function closeCalendar() {
  open.value = false;
}

function onFieldClick(event: MouseEvent) {
  // Clicking the input itself in single mode is how you start typing a
  // date (see the props doc) — don't yank focus into the focus-trapped
  // calendar dialog for that. Range mode's input is read-only, so opening
  // on click there is still the right behavior; so is clicking the rest of
  // the field wrapper (e.g. its padding) in either mode.
  if (open.value) return;
  if (props.mode === "single" && event.target === inputRef.value) return;
  openCalendar();
}

function onInputKeydown(event: KeyboardEvent) {
  if (event.key === "ArrowDown") {
    event.preventDefault();
    openCalendar();
    return;
  }
  if (props.mode === "single" && event.key === "Enter") {
    commitTypedInput();
  }
}

function onInputBlur() {
  if (props.mode === "single") commitTypedInput();
}

function commitTypedInput() {
  const text = inputText.value.trim();
  if (!text) {
    hasParseError.value = false;
    if (singleValue.value) emit("update:modelValue", undefined);
    return;
  }
  const parsed = parseDate(text, props.locale);
  if (!parsed || isDisabledDate(parsed)) {
    hasParseError.value = true;
    return;
  }
  hasParseError.value = false;
  emit("update:modelValue", parsed);
}

const overlayRoot = getOverlayRoot();

const { floatingStyles } = useFloatingOverlay(fieldRef, dialogRef, {
  open,
  placement: "bottom-start",
});

const themeContext = useOverlayThemeContext(open, () => document.activeElement);

// Must run before useFocusTrap so that on close, the background is made
// non-inert again before useFocusTrap tries to restore focus to whatever
// triggered the calendar — focusing an inert element silently fails (see the
// identical fix in Dialog.vue/PopoverContent.vue).
useModalBackground(open, overlayRoot);

// Matches the WAI-ARIA Date Picker Dialog pattern's explicit "dialog"
// framing (Tab cycles within it, closing restores focus to whatever opened
// it) — the same recipe this library's own Popover uses for `modal: true`.
useFocusTrap({
  container: dialogRef,
  active: open,
  initialFocus: initialFocusEl,
});

useDismissable({
  active: open,
  containers: [fieldRef, dialogRef],
  onDismiss: closeCalendar,
});

const rootClass = computed(() => cn("stance-date-picker", props.class));
</script>

<template>
  <div :class="rootClass" v-bind="$attrs">
    <div
      ref="fieldRef"
      class="stance-date-picker__field"
      :data-invalid="invalid || hasParseError || undefined"
      @click="onFieldClick"
    >
      <input
        ref="inputRef"
        :id="inputId"
        type="text"
        class="stance-date-picker__input"
        :value="fieldValue"
        :readonly="mode === 'range'"
        :disabled="disabled"
        :required="required || undefined"
        :aria-invalid="invalid || hasParseError || undefined"
        :aria-describedby="describedBy"
        :placeholder="placeholder ?? (mode === 'single' ? 'Select a date' : 'Select a date range')"
        autocomplete="off"
        @input="mode === 'single' && (inputText = ($event.target as HTMLInputElement).value)"
        @keydown="onInputKeydown"
        @blur="onInputBlur"
      />
      <button
        ref="triggerRef"
        type="button"
        class="stance-date-picker__trigger"
        :disabled="disabled"
        aria-haspopup="dialog"
        :aria-expanded="open"
        :aria-controls="open ? dialogId : undefined"
        aria-label="Choose date"
        @click.stop="open ? closeCalendar() : openCalendar()"
      >
        <svg viewBox="0 0 16 16" fill="none" aria-hidden="true">
          <rect x="2" y="3" width="12" height="11" rx="1.5" stroke="currentColor" stroke-width="1.5" />
          <path d="M2 6.5h12M5 1.5v3M11 1.5v3" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" />
        </svg>
      </button>
    </div>

    <Teleport v-if="overlayRoot" :to="overlayRoot">
      <div
        v-if="open"
        ref="dialogRef"
        :id="dialogId"
        role="dialog"
        aria-modal="true"
        :aria-label="`Choose date, ${monthLabel}`"
        :class="['stance-date-picker__dialog', { dark: themeContext.dark }]"
        :data-theme="themeContext.theme ?? undefined"
        :data-theme-palette="themeContext.palette ?? undefined"
        :data-theme-density="themeContext.density ?? undefined"
        :style="floatingStyles"
        tabindex="-1"
      >
        <Calendar
          ref="calendarRef"
          :model-value="modelValue"
          v-model:focused-date="focusedDate"
          :mode="mode"
          :min="min"
          :max="max"
          :disabled-dates="disabledDates"
          :locale="locale"
          :first-day-of-week="firstDayOfWeek"
          :disabled="disabled"
          @update:model-value="onCalendarModelUpdate"
        />
      </div>
    </Teleport>
  </div>

  <p v-if="showError" :id="errorId" class="stance-date-picker-error">
    <slot name="error" />
  </p>
</template>

<style>
:where(.stance-date-picker) {
  font-family: var(--stance-font-sans, ui-sans-serif, system-ui, sans-serif);
  color: var(--stance-color-foreground);
}

:where(.stance-date-picker__field) {
  display: flex;
  align-items: center;
  gap: var(--stance-spacing-xs, 0.25rem);
  border: 1px solid var(--stance-color-border);
  border-radius: var(--stance-radius-md, 0.5rem);
  background: var(--stance-color-background);
  padding-inline-end: var(--stance-spacing-xs, 0.25rem);
}

:where(.stance-date-picker__field:focus-within) {
  border-color: var(--stance-color-ring);
  outline: 2px solid var(--stance-color-ring, currentColor);
  outline-offset: 1px;
}

:where(.stance-date-picker__field[data-invalid]) {
  border-color: var(--stance-color-destructive);
}

:where(.stance-date-picker__field[data-invalid]:focus-within) {
  border-color: var(--stance-color-destructive);
  outline-color: var(--stance-color-destructive);
}

:where(.stance-date-picker__input) {
  flex: 1 1 auto;
  min-width: 0;
  border: none;
  background: none;
  padding: var(--stance-spacing-sm, 0.5rem) var(--stance-spacing-md, 0.75rem);
  font: inherit;
  color: inherit;
}

:where(.stance-date-picker__input:focus) {
  outline: none;
}

:where(.stance-date-picker__input[aria-invalid="true"]) {
  color: var(--stance-color-destructive, currentColor);
}

:where(.stance-date-picker-error) {
  margin: var(--stance-spacing-xs, 0.25rem) 0 0;
  font-size: var(--stance-text-sm, 0.875rem);
  color: var(--stance-color-destructive);
}

:where(.stance-date-picker__trigger) {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex: 0 0 auto;
  width: 2rem;
  height: 2rem;
  border: none;
  border-radius: var(--stance-radius-sm, 0.25rem);
  background: none;
  color: var(--stance-color-muted-foreground);
  cursor: pointer;
}

:where(.stance-date-picker__trigger svg) {
  width: 1em;
  height: 1em;
}

:where(.stance-date-picker__trigger:hover) {
  background: var(--stance-color-muted);
}

:where(.stance-date-picker__trigger:focus-visible) {
  outline: 2px solid var(--stance-color-ring, currentColor);
  outline-offset: 2px;
}

:where(.stance-date-picker__trigger:disabled) {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Chrome-free positioning wrapper — Calendar itself owns the visible card
   look (background/border/radius/shadow/width) so it's identical whether
   it's embedded here or used standalone on a page. */
:where(.stance-date-picker__dialog) {
  pointer-events: auto;
}

:where(.stance-date-picker__dialog:focus-visible) {
  outline: none;
}
</style>
