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

/** Snaps `value` to the nearest multiple of `step` above `min` (e.g. `roundToStep(7, 0, 5)` → 5, `roundToStep(8, 0, 5)` → 10). Used to snap a pointer-drag position to Slider's step grid. */
export function roundToStep(value: number, min: number, step: number): number {
  if (step <= 0) return value;
  return addStep(min, Math.round((value - min) / step) * step);
}

/**
 * Maps a 0–1 fraction along a track (e.g. `(pointerX - trackLeft) / trackWidth`)
 * into a step-snapped value within `[min, max]` — the pure math behind
 * Slider's pointer-drag positioning, pulled out so it's testable without a
 * real PointerEvent (jsdom doesn't populate clientX/clientY from a
 * synthetic event's init dict, so the DOM-level interaction can't be
 * exercised directly in tests — see Slider.test.ts's manual checklist).
 */
export function fractionToValue(fraction: number, min: number, max: number, step: number): number {
  const clampedFraction = Math.min(1, Math.max(0, fraction));
  const raw = min + clampedFraction * (max - min);
  return clampNumber(roundToStep(raw, min, step), min, max);
}
