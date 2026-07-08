/**
 * Locale-aware number helpers built entirely on native `Intl`/`Number` —
 * same reasoning as date.ts: no formatting/parsing dependency for this.
 */

export function getDecimalSeparator(locale: string): string {
  const part = new Intl.NumberFormat(locale).formatToParts(1.1).find((p) => p.type === "decimal");
  return part?.value ?? ".";
}

export function getGroupSeparator(locale: string): string {
  const part = new Intl.NumberFormat(locale).formatToParts(1234).find((p) => p.type === "group");
  return part?.value ?? ",";
}

export function formatNumber(value: number, locale: string, options?: Intl.NumberFormatOptions): string {
  return new Intl.NumberFormat(locale, options).format(value);
}

/** Parses locale-formatted text (grouped digits, locale decimal separator) back into a number, or `undefined` if it doesn't parse to a finite number. */
export function parseNumber(text: string, locale: string): number | undefined {
  const trimmed = text.trim();
  if (!trimmed) return undefined;

  const group = getGroupSeparator(locale);
  const decimal = getDecimalSeparator(locale);

  const normalized = trimmed
    .split(group)
    .join("")
    .split(decimal)
    .join(".");

  const value = Number(normalized);
  return Number.isFinite(value) ? value : undefined;
}

export function clampNumber(value: number, min: number | undefined, max: number | undefined): number {
  let clamped = value;
  if (min !== undefined) clamped = Math.max(clamped, min);
  if (max !== undefined) clamped = Math.min(clamped, max);
  return clamped;
}

/** Adds `delta` to `value`, rounded to kill floating-point drift (0.1 + 0.2 → 0.3, not 0.30000000000000004). */
export function addStep(value: number, delta: number): number {
  return Math.round((value + delta) * 1e10) / 1e10;
}
