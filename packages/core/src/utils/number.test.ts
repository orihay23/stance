import { describe, expect, it } from "vitest";
import {
  addStep,
  clampNumber,
  formatNumber,
  fractionToValue,
  getDecimalSeparator,
  getGroupSeparator,
  parseNumber,
  roundToStep,
} from "./number";

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

  it("roundToStep snaps to the nearest step above min", () => {
    expect(roundToStep(7, 0, 5)).toBe(5);
    expect(roundToStep(8, 0, 5)).toBe(10);
    expect(roundToStep(23, 10, 5)).toBe(25);
  });

  it("roundToStep avoids floating-point drift with fractional steps", () => {
    expect(roundToStep(0.3, 0, 0.1)).toBe(0.3);
  });

  it("roundToStep returns value unchanged for a non-positive step", () => {
    expect(roundToStep(7.3, 0, 0)).toBe(7.3);
  });

  it("fractionToValue maps a 0-1 fraction to a step-snapped value in [min, max] — the math behind Slider's pointer-drag positioning", () => {
    expect(fractionToValue(0, 0, 100, 10)).toBe(0);
    expect(fractionToValue(1, 0, 100, 10)).toBe(100);
    expect(fractionToValue(0.5, 0, 100, 10)).toBe(50);
    expect(fractionToValue(0.6, 0, 100, 10)).toBe(60);
  });

  it("fractionToValue clamps a fraction outside [0, 1] rather than extrapolating past min/max", () => {
    expect(fractionToValue(-0.5, 0, 100, 10)).toBe(0);
    expect(fractionToValue(1.5, 0, 100, 10)).toBe(100);
  });

  it("fractionToValue never exceeds max even when max isn't itself a step multiple", () => {
    expect(fractionToValue(1, 0, 97, 10)).toBe(97);
  });
});
