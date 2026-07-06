import { describe, expect, it } from "vitest";
import {
  addDays,
  addMonths,
  endOfWeek,
  formatDate,
  getDateFormatOrder,
  getFirstDayOfWeekForLocale,
  getLocaleMonthLabel,
  getLocaleWeekdayNames,
  getMonthGrid,
  isAfter,
  isBefore,
  isSameDay,
  parseDate,
  startOfWeek,
} from "./date";

describe("date utils", () => {
  it("isSameDay ignores time-of-day", () => {
    expect(isSameDay(new Date(2026, 0, 5, 3), new Date(2026, 0, 5, 22))).toBe(true);
    expect(isSameDay(new Date(2026, 0, 5), new Date(2026, 0, 6))).toBe(false);
  });

  it("isBefore/isAfter compare by calendar day", () => {
    expect(isBefore(new Date(2026, 0, 5), new Date(2026, 0, 6))).toBe(true);
    expect(isAfter(new Date(2026, 0, 6), new Date(2026, 0, 5))).toBe(true);
    expect(isBefore(new Date(2026, 0, 5), new Date(2026, 0, 5))).toBe(false);
  });

  it("addDays crosses month/year boundaries", () => {
    expect(isSameDay(addDays(new Date(2026, 0, 31), 1), new Date(2026, 1, 1))).toBe(true);
    expect(isSameDay(addDays(new Date(2025, 11, 31), 1), new Date(2026, 0, 1))).toBe(true);
  });

  it("addMonths clamps to the target month's last real day", () => {
    // Jan 31 + 1 month should land on Feb 28 (2026 is not a leap year), not roll into March.
    const result = addMonths(new Date(2026, 0, 31), 1);
    expect(result.getMonth()).toBe(1);
    expect(result.getDate()).toBe(28);
  });

  it("addMonths(-1) goes to the previous month", () => {
    const result = addMonths(new Date(2026, 2, 15), -1);
    expect(result.getMonth()).toBe(1);
    expect(result.getDate()).toBe(15);
  });

  it("startOfWeek/endOfWeek respect the given first-day-of-week", () => {
    const wednesday = new Date(2026, 0, 7); // a Wednesday
    const sundayStart = startOfWeek(wednesday, 0);
    expect(sundayStart.getDay()).toBe(0);
    expect(sundayStart.getDate()).toBe(4);

    const mondayStart = startOfWeek(wednesday, 1);
    expect(mondayStart.getDay()).toBe(1);
    expect(mondayStart.getDate()).toBe(5);

    expect(endOfWeek(wednesday, 1).getDay()).toBe(0);
  });

  it("getFirstDayOfWeekForLocale: en-US is Sunday, most European locales are Monday", () => {
    expect(getFirstDayOfWeekForLocale("en-US")).toBe(0);
    expect(getFirstDayOfWeekForLocale("de-DE")).toBe(1);
  });

  it("getMonthGrid produces full weeks padded with adjacent-month days", () => {
    const weeks = getMonthGrid(2026, 1, 1); // February 2026, Monday-start
    for (const week of weeks) {
      expect(week).toHaveLength(7);
    }
    const allDays = weeks.flat();
    expect(allDays.some((d) => d.getMonth() === 0)).toBe(true); // leading Jan days
    expect(allDays.some((d) => d.getMonth() === 2)).toBe(true); // trailing Mar days
    expect(allDays.filter((d) => d.getMonth() === 1)).toHaveLength(28);
  });

  it("getLocaleWeekdayNames returns 7 labels starting at the given first day", () => {
    const labels = getLocaleWeekdayNames("en-US", 0);
    expect(labels).toHaveLength(7);
    expect(labels[0]!.full).toBe("Sunday");
    expect(labels[6]!.full).toBe("Saturday");
  });

  it("getLocaleMonthLabel formats a readable month/year", () => {
    expect(getLocaleMonthLabel("en-US", 2026, 1)).toBe("February 2026");
  });

  it("formatDate uses the locale's own short numeric format", () => {
    expect(formatDate(new Date(2026, 1, 5), "en-US")).toBe("2/5/2026");
  });

  it("getDateFormatOrder derives field order from the locale itself", () => {
    expect(getDateFormatOrder("en-US").order).toEqual(["month", "day", "year"]);
  });

  it("parseDate round-trips a validly-typed date", () => {
    const parsed = parseDate("2/5/2026", "en-US");
    expect(parsed && isSameDay(parsed, new Date(2026, 1, 5))).toBe(true);
  });

  it("parseDate rejects a date that doesn't exist", () => {
    expect(parseDate("2/30/2026", "en-US")).toBeUndefined();
  });

  it("parseDate rejects garbage input", () => {
    expect(parseDate("not a date", "en-US")).toBeUndefined();
    expect(parseDate("", "en-US")).toBeUndefined();
  });
});
