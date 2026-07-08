/**
 * Locale-aware date helpers built entirely on native `Intl`/`Date` — see
 * DatePicker.vue's design notes for why this library doesn't take a date
 * dependency (date-fns et al.) for this.
 */

export type Weekday = 0 | 1 | 2 | 3 | 4 | 5 | 6;

export function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

export function isSameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

export function isBefore(a: Date, b: Date): boolean {
  return startOfDay(a).getTime() < startOfDay(b).getTime();
}

export function isAfter(a: Date, b: Date): boolean {
  return startOfDay(a).getTime() > startOfDay(b).getTime();
}

export function addDays(date: Date, amount: number): Date {
  const next = new Date(date);
  next.setDate(next.getDate() + amount);
  return next;
}

/** Shared by Calendar (grid cell disabling) and DatePicker (typed-input validation) so the two never disagree about which dates are selectable. */
export function isDateDisabled(
  date: Date,
  min: Date | undefined,
  max: Date | undefined,
  disabledDates: ((date: Date) => boolean) | undefined,
): boolean {
  if (min && isBefore(date, min)) return true;
  if (max && isAfter(date, max)) return true;
  return disabledDates?.(date) ?? false;
}

export function addMonths(date: Date, amount: number): Date {
  const next = new Date(date);
  const day = next.getDate();
  next.setDate(1);
  next.setMonth(next.getMonth() + amount);
  // Clamp back to the last real day of the target month instead of letting
  // e.g. Jan 31 + 1 month silently roll over into March.
  const daysInTargetMonth = new Date(next.getFullYear(), next.getMonth() + 1, 0).getDate();
  next.setDate(Math.min(day, daysInTargetMonth));
  return next;
}

/** Distance (0-6) from `firstDayOfWeek` to `date`'s own weekday. */
function weekdayOffset(date: Date, firstDayOfWeek: Weekday): number {
  return (date.getDay() - firstDayOfWeek + 7) % 7;
}

export function startOfWeek(date: Date, firstDayOfWeek: Weekday): Date {
  return addDays(startOfDay(date), -weekdayOffset(date, firstDayOfWeek));
}

export function endOfWeek(date: Date, firstDayOfWeek: Weekday): Date {
  return addDays(startOfWeek(date, firstDayOfWeek), 6);
}

export function clampDate(date: Date, min: Date | undefined, max: Date | undefined): Date {
  let result = date;
  if (min && isBefore(result, min)) result = min;
  if (max && isAfter(result, max)) result = max;
  return result;
}

// `Intl.Locale.prototype.weekInfo` (the "correct" source for this) isn't
// supported in every engine yet. Fall back to a small table of common
// region/language conventions, and let the `firstDayOfWeek` prop override
// either source for anything this table gets wrong.
const SUNDAY_START_REGIONS = new Set(["US", "CA", "BR", "MX", "JP", "KR", "PH", "IL"]);

export function getFirstDayOfWeekForLocale(locale: string): Weekday {
  try {
    const weekInfo = (new Intl.Locale(locale) as Intl.Locale & { weekInfo?: { firstDay: number } }).weekInfo;
    if (weekInfo) return (weekInfo.firstDay % 7) as Weekday;
  } catch {
    // Fall through to the static table below.
  }
  const region = new Intl.Locale(locale).maximize().region;
  return region && SUNDAY_START_REGIONS.has(region) ? 0 : 1;
}

/** One calendar month as a rectangular grid of weeks, padded with the leading/trailing days of adjacent months. */
export function getMonthGrid(year: number, month: number, firstDayOfWeek: Weekday): Date[][] {
  const firstOfMonth = new Date(year, month, 1);
  const gridStart = startOfWeek(firstOfMonth, firstDayOfWeek);
  const lastOfMonth = new Date(year, month + 1, 0);
  const gridEnd = endOfWeek(lastOfMonth, firstDayOfWeek);

  const weeks: Date[][] = [];
  let cursor = gridStart;
  while (cursor.getTime() <= gridEnd.getTime()) {
    const week: Date[] = [];
    for (let i = 0; i < 7; i++) {
      week.push(cursor);
      cursor = addDays(cursor, 1);
    }
    weeks.push(week);
  }
  return weeks;
}

export interface WeekdayLabel {
  /** e.g. "Sunday" — used as the column header's accessible name. */
  full: string;
  /** e.g. "Su" — the visible column header text. */
  short: string;
}

export function getLocaleWeekdayNames(locale: string, firstDayOfWeek: Weekday): WeekdayLabel[] {
  const longFormatter = new Intl.DateTimeFormat(locale, { weekday: "long" });
  const shortFormatter = new Intl.DateTimeFormat(locale, { weekday: "short" });
  // Any fixed week (Jan 4-10, 1970 is a Sun-Sat reference week) works — only
  // the day-of-week cycling through matters here, not the actual date.
  const reference = new Date(1970, 0, 4 + firstDayOfWeek);
  return Array.from({ length: 7 }, (_, i) => {
    const date = addDays(reference, i);
    return { full: longFormatter.format(date), short: shortFormatter.format(date) };
  });
}

export function getLocaleMonthLabel(locale: string, year: number, month: number): string {
  return new Intl.DateTimeFormat(locale, { month: "long", year: "numeric" }).format(new Date(year, month, 1));
}

export function formatDate(date: Date, locale: string): string {
  return new Intl.DateTimeFormat(locale).format(date);
}

type DateField = "day" | "month" | "year";

interface DateFormatOrder {
  order: DateField[];
  separator: string;
}

/** Derives the typed-input field order/separator for a locale from its own short numeric date format, rather than a hardcoded table. */
export function getDateFormatOrder(locale: string): DateFormatOrder {
  const parts = new Intl.DateTimeFormat(locale, { year: "numeric", month: "numeric", day: "numeric" }).formatToParts(
    new Date(2000, 0, 2),
  );
  const order: DateField[] = [];
  let separator = "/";
  for (const part of parts) {
    if (part.type === "day" || part.type === "month" || part.type === "year") {
      order.push(part.type);
    } else if (part.type === "literal" && part.value.trim()) {
      separator = part.value;
    }
  }
  return { order: order.length === 3 ? order : ["month", "day", "year"], separator };
}

/** Parses text typed against a locale's own field order; returns undefined for anything that doesn't round-trip to a real calendar date. */
export function parseDate(text: string, locale: string): Date | undefined {
  const trimmed = text.trim();
  if (!trimmed) return undefined;

  const segments = trimmed.split(/[^0-9]+/).filter(Boolean);
  if (segments.length !== 3) return undefined;

  const { order } = getDateFormatOrder(locale);
  const values: Partial<Record<DateField, number>> = {};
  order.forEach((field, i) => {
    values[field] = Number(segments[i]);
  });
  if (values.day === undefined || values.month === undefined || values.year === undefined) return undefined;

  const year = values.year < 100 ? 2000 + values.year : values.year;
  const date = new Date(year, values.month - 1, values.day);
  const roundTrips =
    date.getFullYear() === year && date.getMonth() === values.month - 1 && date.getDate() === values.day;
  return roundTrips ? date : undefined;
}
