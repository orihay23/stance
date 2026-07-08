<script setup lang="ts">
import { computed, nextTick, ref, useTemplateRef, watch } from "vue";
import { cn } from "../utils/cn";
import {
  addDays,
  addMonths,
  endOfWeek,
  formatDate,
  getFirstDayOfWeekForLocale,
  getLocaleMonthLabel,
  getLocaleWeekdayNames,
  getMonthGrid,
  isAfter,
  isBefore,
  isDateDisabled,
  isSameDay,
  startOfWeek,
  type Weekday,
} from "../utils/date";
import { useLiveAnnouncer } from "../composables/useLiveAnnouncer";

export type CalendarMode = "single" | "range";

export interface CalendarRangeValue {
  start?: Date;
  end?: Date;
}

export interface CalendarProps {
  /** @default "single" */
  mode?: CalendarMode | undefined;
  /** v-model. A `Date | undefined` in mode="single"; a `CalendarRangeValue` in mode="range" — kept as a plain union rather than discriminated by `mode`, same reasoning as Accordion's `modelValue`. */
  modelValue?: Date | CalendarRangeValue | undefined;
  /**
   * v-model:focusedDate — the roving-tabindex cursor and visible-month
   * anchor. Fully controlled, same convention as DataTable's `page`:
   * Calendar always displays whatever this resolves to (defaulting to
   * today when omitted) and never mutates it locally — arrow keys and
   * month nav emit `update:focusedDate` for the caller to echo back.
   * @default today
   */
  focusedDate?: Date | undefined;
  /** Earliest selectable date (inclusive). */
  min?: Date | undefined;
  /** Latest selectable date (inclusive). */
  max?: Date | undefined;
  /** Arbitrary per-date disabling (holidays, booked days, etc.) beyond min/max. */
  disabledDates?: ((date: Date) => boolean) | undefined;
  /** BCP 47 tag driving month/weekday names. @default "en-US" */
  locale?: string | undefined;
  /** Overrides the locale-derived week start (0=Sunday…6=Saturday) for locales `Intl` doesn't resolve correctly (see date.ts). */
  firstDayOfWeek?: Weekday | undefined;
  disabled?: boolean | undefined;
  /** Extra classes merged with internal classes via `tailwind-merge` — applied to the root container. */
  class?: string | undefined;
}

const props = withDefaults(defineProps<CalendarProps>(), {
  mode: "single",
  locale: "en-US",
  disabled: false,
  focusedDate: () => new Date(),
});

const emit = defineEmits<{
  "update:modelValue": [value: Date | CalendarRangeValue | undefined];
  "update:focusedDate": [value: Date];
}>();

const { announce } = useLiveAnnouncer();

const pendingRangeStart = ref<Date | undefined>(undefined);
const activeCellRef = ref<HTMLElement | null>(null);

const singleValue = computed(() => (props.mode === "single" ? (props.modelValue as Date | undefined) : undefined));
const rangeValue = computed(() =>
  props.mode === "range" ? (props.modelValue as CalendarRangeValue | undefined) : undefined,
);

const effectiveFirstDayOfWeek = computed(
  () => props.firstDayOfWeek ?? getFirstDayOfWeekForLocale(props.locale),
);
const viewYear = computed(() => props.focusedDate.getFullYear());
const viewMonth = computed(() => props.focusedDate.getMonth());
const weeks = computed(() => getMonthGrid(viewYear.value, viewMonth.value, effectiveFirstDayOfWeek.value));
const weekdayLabels = computed(() => getLocaleWeekdayNames(props.locale, effectiveFirstDayOfWeek.value));
const monthLabel = computed(() => getLocaleMonthLabel(props.locale, viewYear.value, viewMonth.value));

const prevMonthDate = computed(() => addMonths(props.focusedDate, -1));
const nextMonthDate = computed(() => addMonths(props.focusedDate, 1));
const prevMonthLabel = computed(() => getLocaleMonthLabel(props.locale, prevMonthDate.value.getFullYear(), prevMonthDate.value.getMonth()));
const nextMonthLabel = computed(() => getLocaleMonthLabel(props.locale, nextMonthDate.value.getFullYear(), nextMonthDate.value.getMonth()));

const isPrevMonthDisabled = computed(() => {
  if (!props.min) return false;
  return isBefore(new Date(viewYear.value, viewMonth.value, 0), props.min);
});
const isNextMonthDisabled = computed(() => {
  if (!props.max) return false;
  return isAfter(new Date(viewYear.value, viewMonth.value + 1, 1), props.max);
});

function isDisabledDate(date: Date): boolean {
  return isDateDisabled(date, props.min, props.max, props.disabledDates);
}

function isSelected(date: Date): boolean {
  if (props.mode === "single") return singleValue.value ? isSameDay(date, singleValue.value) : false;
  const value = rangeValue.value;
  return Boolean(value && ((value.start && isSameDay(date, value.start)) || (value.end && isSameDay(date, value.end))));
}

function currentRangeBounds(): { start: Date; end: Date } | undefined {
  const value = rangeValue.value;
  if (value?.start && value?.end) return { start: value.start, end: value.end };
  if (pendingRangeStart.value) {
    const a = pendingRangeStart.value;
    const b = props.focusedDate;
    return isBefore(b, a) ? { start: b, end: a } : { start: a, end: b };
  }
  return undefined;
}

function isInRange(date: Date): boolean {
  if (props.mode !== "range") return false;
  const bounds = currentRangeBounds();
  if (!bounds) return false;
  return !isBefore(date, bounds.start) && !isAfter(date, bounds.end);
}

function isToday(date: Date): boolean {
  return isSameDay(date, new Date());
}

function isOutsideMonth(date: Date): boolean {
  return date.getMonth() !== viewMonth.value;
}

function moveFocus(date: Date) {
  emit("update:focusedDate", date);
}

// Re-focuses the new active cell once the caller echoes `focusedDate` back
// (or, for an uncontrolled caller that ignores `update:focusedDate`, this
// simply never fires again — matching how DataTable's unlistened `page`
// leaves the component visually "stuck" rather than crashing).
watch(
  () => props.focusedDate,
  () => {
    nextTick(() => activeCellRef.value?.focus());
  },
);

function setActiveCellRef(day: Date, el: Element | null) {
  if (isSameDay(day, props.focusedDate)) {
    activeCellRef.value = el as HTMLElement | null;
  }
}

function prevMonth() {
  if (isPrevMonthDisabled.value) return;
  moveFocus(prevMonthDate.value);
}

function nextMonth() {
  if (isNextMonthDisabled.value) return;
  moveFocus(nextMonthDate.value);
}

function selectDay(date: Date) {
  if (props.disabled || isDisabledDate(date)) return;

  if (props.mode === "single") {
    emit("update:modelValue", date);
    return;
  }

  if (!pendingRangeStart.value) {
    pendingRangeStart.value = date;
    emit("update:modelValue", { start: date });
    announce(`Start date selected: ${formatDate(date, props.locale)}. Choose the end date.`);
    return;
  }

  const a = pendingRangeStart.value;
  const [start, end] = isBefore(date, a) ? [date, a] : [a, date];
  pendingRangeStart.value = undefined;
  emit("update:modelValue", { start, end });
  announce(`Date range selected: ${formatDate(start, props.locale)} to ${formatDate(end, props.locale)}.`);
}

function onGridKeydown(event: KeyboardEvent) {
  const current = props.focusedDate;
  switch (event.key) {
    case "ArrowRight":
      event.preventDefault();
      moveFocus(addDays(current, 1));
      break;
    case "ArrowLeft":
      event.preventDefault();
      moveFocus(addDays(current, -1));
      break;
    case "ArrowDown":
      event.preventDefault();
      moveFocus(addDays(current, 7));
      break;
    case "ArrowUp":
      event.preventDefault();
      moveFocus(addDays(current, -7));
      break;
    case "PageDown":
      event.preventDefault();
      moveFocus(addMonths(current, event.shiftKey ? 12 : 1));
      break;
    case "PageUp":
      event.preventDefault();
      moveFocus(addMonths(current, event.shiftKey ? -12 : -1));
      break;
    case "Home":
      event.preventDefault();
      moveFocus(startOfWeek(current, effectiveFirstDayOfWeek.value));
      break;
    case "End":
      event.preventDefault();
      moveFocus(endOfWeek(current, effectiveFirstDayOfWeek.value));
      break;
    case "Enter":
    case " ":
      event.preventDefault();
      selectDay(current);
      break;
  }
}

defineExpose({
  /**
   * The DOM element of the currently roving-tabindex-focused day cell, or
   * null before mount. Lets a shell composing Calendar inside a focus-trap
   * (e.g. DatePicker's popover dialog) target the right initial-focus
   * element — the trap's own "first focusable descendant" fallback would
   * otherwise land on the Previous-month button instead.
   */
  getFocusedCellElement: () => activeCellRef.value,
});

const rootClass = computed(() => cn("stance-calendar", props.class));
</script>

<template>
  <div :class="rootClass">
    <div class="stance-calendar__nav">
      <button
        type="button"
        class="stance-calendar__nav-button"
        :disabled="isPrevMonthDisabled"
        :aria-label="`Previous month, ${prevMonthLabel}`"
        @click="prevMonth"
      >
        <svg viewBox="0 0 16 16" fill="none" aria-hidden="true">
          <path d="M10 3l-5 5 5 5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
        </svg>
      </button>
      <span class="stance-calendar__month-label">{{ monthLabel }}</span>
      <button
        type="button"
        class="stance-calendar__nav-button"
        :disabled="isNextMonthDisabled"
        :aria-label="`Next month, ${nextMonthLabel}`"
        @click="nextMonth"
      >
        <svg viewBox="0 0 16 16" fill="none" aria-hidden="true">
          <path d="M6 3l5 5-5 5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
        </svg>
      </button>
    </div>

    <div role="grid" :aria-label="monthLabel" class="stance-calendar__grid" @keydown="onGridKeydown">
      <div role="row" class="stance-calendar__row stance-calendar__row--header">
        <span
          v-for="weekday in weekdayLabels"
          :key="weekday.full"
          role="columnheader"
          :aria-label="weekday.full"
          class="stance-calendar__weekday"
        >
          {{ weekday.short }}
        </span>
      </div>
      <div v-for="(week, weekIndex) in weeks" :key="weekIndex" role="row" class="stance-calendar__row">
        <div
          v-for="day in week"
          :key="day.getTime()"
          :ref="(el) => setActiveCellRef(day, el as Element | null)"
          role="gridcell"
          class="stance-calendar__cell"
          :tabindex="isSameDay(day, props.focusedDate) ? 0 : -1"
          :aria-selected="isSelected(day)"
          :aria-current="isToday(day) ? 'date' : undefined"
          :aria-disabled="isDisabledDate(day) || undefined"
          :data-outside-month="isOutsideMonth(day) || undefined"
          :data-in-range="isInRange(day) || undefined"
          :data-selected="isSelected(day) || undefined"
          :data-today="isToday(day) || undefined"
          @click="selectDay(day)"
          @focus="moveFocus(day)"
        >
          {{ day.getDate() }}
        </div>
      </div>
    </div>
  </div>
</template>

<style>
:where(.stance-calendar) {
  container-type: inline-size;
  container-name: stance-calendar;
  display: flex;
  flex-direction: column;
  gap: var(--stance-spacing-sm, 0.5rem);
  width: 18rem;
  max-width: calc(100vw - 1rem);
  background: var(--stance-color-background);
  border: 1px solid var(--stance-color-border);
  border-radius: var(--stance-radius-lg, 0.75rem);
  box-shadow: var(--stance-shadow-lg);
  padding: var(--stance-spacing-md, 0.75rem);
  font-family: var(--stance-font-sans, ui-sans-serif, system-ui, sans-serif);
  color: var(--stance-color-foreground);
}

:where(.stance-calendar__nav) {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

:where(.stance-calendar__month-label) {
  font-weight: var(--stance-font-weight-semibold, 600);
  font-size: var(--stance-text-sm, 0.875rem);
}

:where(.stance-calendar__nav-button) {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 1.75rem;
  height: 1.75rem;
  border: none;
  border-radius: var(--stance-radius-sm, 0.25rem);
  background: none;
  color: var(--stance-color-foreground);
  cursor: pointer;
}

:where(.stance-calendar__nav-button svg) {
  width: 1rem;
  height: 1rem;
}

:where(.stance-calendar__nav-button:hover) {
  background: var(--stance-color-muted);
}

:where(.stance-calendar__nav-button:focus-visible) {
  outline: 2px solid var(--stance-color-ring, currentColor);
  outline-offset: 2px;
}

:where(.stance-calendar__nav-button:disabled) {
  opacity: 0.4;
  cursor: not-allowed;
}

:where(.stance-calendar__grid) {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

:where(.stance-calendar__row) {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 2px;
}

:where(.stance-calendar__weekday) {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 1.75rem;
  font-size: var(--stance-text-xs, 0.75rem);
  color: var(--stance-color-muted-foreground);
}

:where(.stance-calendar__cell) {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 2rem;
  border-radius: var(--stance-radius-sm, 0.25rem);
  font-size: var(--stance-text-sm, 0.875rem);
  cursor: pointer;
  user-select: none;
}

:where(.stance-calendar__cell[data-outside-month]) {
  color: var(--stance-color-muted-foreground);
  opacity: 0.6;
}

:where(.stance-calendar__cell[data-today]) {
  font-weight: var(--stance-font-weight-semibold, 600);
  box-shadow: inset 0 0 0 1px var(--stance-color-border);
}

:where(.stance-calendar__cell:hover) {
  background: var(--stance-color-muted);
}

:where(.stance-calendar__cell[data-in-range]) {
  background: color-mix(in oklch, var(--stance-color-primary) 16%, transparent);
  border-radius: 0;
}

:where(.stance-calendar__cell[data-selected]) {
  background: var(--stance-color-primary);
  color: var(--stance-color-primary-foreground);
  opacity: 1;
}

:where(.stance-calendar__cell[aria-disabled="true"]) {
  color: var(--stance-color-muted-foreground);
  opacity: 0.35;
  cursor: not-allowed;
}

:where(.stance-calendar__cell:focus-visible) {
  outline: 2px solid var(--stance-color-ring, currentColor);
  outline-offset: 2px;
}

/* Below this container width, tighten spacing/typography so a single-month
   view still fits without overflowing. Scoped to Calendar's own root (not
   an ancestor like DatePicker's old root) so this actually fires when
   Calendar is teleported into a floating popover — a teleported element
   isn't a DOM descendant of its logical Vue parent, so a container named
   on an ancestor outside the teleport target would never match. */
@container stance-calendar (max-width: 18rem) {
  :where(.stance-calendar) {
    width: 100%;
    padding: var(--stance-spacing-sm, 0.5rem);
  }

  :where(.stance-calendar__cell),
  :where(.stance-calendar__weekday) {
    height: 1.75rem;
    font-size: var(--stance-text-xs, 0.75rem);
  }
}
</style>
