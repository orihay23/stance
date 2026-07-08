import { describe, expect, it } from "vitest";
import { addStep, clampNumber, formatNumber, getDecimalSeparator, getGroupSeparator, parseNumber } from "./number";

describe("number utils", () => {
  it("getDecimalSeparator/getGroupSeparator differ by locale", () => {
    expect(getDecimalSeparator("en-US")).toBe(".");
    expect(getGroupSeparator("en-US")).toBe(",");
    expect(getDecimalSeparator("de-DE")).toBe(",");
    expect(getGroupSeparator("de-DE")).toBe(".");
  });

  it("formatNumber groups digits per locale", () => {
    expect(formatNumber(1234.5, "en-US")).toBe("1,234.5");
    expect(formatNumber(1234.5, "de-DE")).toBe("1.234,5");
  });

  it("formatNumber passes through Intl.NumberFormatOptions", () => {
    expect(formatNumber(0.5, "en-US", { style: "percent" })).toBe("50%");
  });

  it("parseNumber round-trips formatNumber's output, per locale", () => {
    expect(parseNumber("1,234.5", "en-US")).toBe(1234.5);
    expect(parseNumber("1.234,5", "de-DE")).toBe(1234.5);
  });

  it("parseNumber handles a plain unformatted string", () => {
    expect(parseNumber("42", "en-US")).toBe(42);
    expect(parseNumber("-3.5", "en-US")).toBe(-3.5);
  });

  it("parseNumber returns undefined for empty or non-numeric text", () => {
    expect(parseNumber("", "en-US")).toBeUndefined();
    expect(parseNumber("   ", "en-US")).toBeUndefined();
    expect(parseNumber("not a number", "en-US")).toBeUndefined();
  });

  it("clampNumber clamps to min/max when given, leaves value alone otherwise", () => {
    expect(clampNumber(5, 0, 10)).toBe(5);
    expect(clampNumber(-5, 0, 10)).toBe(0);
    expect(clampNumber(15, 0, 10)).toBe(10);
    expect(clampNumber(15, undefined, undefined)).toBe(15);
  });

  it("addStep avoids floating-point drift", () => {
    expect(addStep(0.1, 0.2)).toBe(0.3);
    expect(addStep(1, -0.1)).toBe(0.9);
  });
});
