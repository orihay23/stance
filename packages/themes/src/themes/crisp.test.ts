import { describe, expect, it } from "vitest";
import { compileTheme } from "../compile";
import { crisp } from "./crisp";

describe("crisp theme", () => {
  const output = compileTheme(crisp);

  it("compiles without throwing and scopes both blocks", () => {
    expect(output).toContain('[data-theme="crisp"] {');
    expect(output).toContain('[data-theme="crisp"].dark {');
  });

  it("never emits !important", () => {
    expect(output).not.toContain("!important");
  });

  it("gives every color role a resolvable CSS color value", () => {
    const colorLines = output.match(/--stance-color-[\w-]+: .+;/g) ?? [];
    expect(colorLines.length).toBeGreaterThan(0);
    for (const line of colorLines) {
      expect(line).toMatch(/: (oklch\(|#|rgb\(|white|black)/);
    }
  });

  it("defines light and dark values differently for every color role", () => {
    const lightBlock = output.slice(0, output.indexOf('[data-theme="crisp"].dark {'));
    const darkBlock = output.slice(output.indexOf('[data-theme="crisp"].dark {'));

    const roles = ["primary", "secondary", "accent", "destructive", "success", "warning", "info"];
    for (const role of roles) {
      const lightMatch = lightBlock.match(new RegExp(`--stance-color-${role}: (.+);`));
      const darkMatch = darkBlock.match(new RegExp(`--stance-color-${role}: (.+);`));
      expect(lightMatch?.[1]).toBeDefined();
      expect(darkMatch?.[1]).toBeDefined();
      expect(lightMatch?.[1]).not.toBe(darkMatch?.[1]);
    }
  });
});
