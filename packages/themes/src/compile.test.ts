import { describe, expect, it } from "vitest";
import { compileTheme, compileThemes } from "./compile";
import type { ColorRole, Theme, ThemeModeTokens } from "./types";

function role(seed: string): ColorRole {
  return {
    DEFAULT: `${seed}-default`,
    foreground: `${seed}-foreground`,
    hover: `${seed}-hover`,
    active: `${seed}-active`,
  };
}

function mode(seed: string): ThemeModeTokens {
  return {
    colors: {
      background: `${seed}-background`,
      foreground: `${seed}-foreground`,
      surface: role(`${seed}-surface`),
      overlay: `${seed}-overlay`,
      border: `${seed}-border`,
      ring: `${seed}-ring`,
      primary: role(`${seed}-primary`),
      secondary: role(`${seed}-secondary`),
      accent: role(`${seed}-accent`),
      muted: role(`${seed}-muted`),
      destructive: role(`${seed}-destructive`),
      success: role(`${seed}-success`),
      warning: role(`${seed}-warning`),
      info: role(`${seed}-info`),
    },
    shadow: {
      sm: `${seed}-shadow-sm`,
      md: `${seed}-shadow-md`,
      lg: `${seed}-shadow-lg`,
      xl: `${seed}-shadow-xl`,
    },
  };
}

const fixtureTheme: Theme = {
  name: "fixture",
  light: mode("light"),
  dark: mode("dark"),
  radius: { none: "0px", sm: "1px", md: "2px", lg: "3px", xl: "4px", full: "9999px" },
  spacing: { xs: "1px", sm: "2px", md: "3px", lg: "4px", xl: "5px" },
  typography: {
    fontFamily: { sans: "sans-stack", mono: "mono-stack" },
    fontSize: { xs: "1px", sm: "2px", base: "3px", lg: "4px", xl: "5px", "2xl": "6px" },
    fontWeight: { normal: "400", medium: "500", semibold: "600", bold: "700" },
    lineHeight: { tight: "1", normal: "1.5", relaxed: "2" },
  },
};

describe("compileTheme", () => {
  const output = compileTheme(fixtureTheme);

  it("scopes the light block under [data-theme=name]", () => {
    expect(output).toContain('[data-theme="fixture"] {');
  });

  it("scopes the dark block under [data-theme=name].dark", () => {
    expect(output).toContain('[data-theme="fixture"].dark {');
  });

  it("puts light-mode color tokens in the base block", () => {
    expect(output).toContain("--stance-color-primary: light-primary-default;");
    expect(output).toContain("--stance-color-primary-hover: light-primary-hover;");
  });

  it("puts dark-mode color tokens only in the .dark block", () => {
    const darkBlock = output.slice(output.indexOf('[data-theme="fixture"].dark {'));
    expect(darkBlock).toContain("--stance-color-primary: dark-primary-default;");

    const lightBlock = output.slice(0, output.indexOf('[data-theme="fixture"].dark {'));
    expect(lightBlock).not.toContain("dark-primary-default");
  });

  it("does not repeat radius/spacing/typography in the .dark block", () => {
    const darkBlock = output.slice(output.indexOf('[data-theme="fixture"].dark {'));
    expect(darkBlock).not.toContain("--stance-radius");
    expect(darkBlock).not.toContain("--stance-spacing");
    expect(darkBlock).not.toContain("--stance-font");
  });

  it("puts radius/spacing/typography in the base block", () => {
    const lightBlock = output.slice(0, output.indexOf('[data-theme="fixture"].dark {'));
    expect(lightBlock).toContain("--stance-radius-md: 2px;");
    expect(lightBlock).toContain("--stance-spacing-lg: 4px;");
    expect(lightBlock).toContain("--stance-font-sans: sans-stack;");
    expect(lightBlock).toContain("--stance-leading-relaxed: 2;");
  });

  it("omits hover/active for roles that don't define them", () => {
    const minimalTheme: Theme = {
      ...fixtureTheme,
      light: {
        ...fixtureTheme.light,
        colors: {
          ...fixtureTheme.light.colors,
          primary: { DEFAULT: "p", foreground: "pf" },
        },
      },
    };
    const minimalOutput = compileTheme(minimalTheme);
    const lightBlock = minimalOutput.slice(0, minimalOutput.indexOf('[data-theme="fixture"].dark {'));
    expect(lightBlock).toContain("--stance-color-primary: p;");
    expect(lightBlock).not.toContain("--stance-color-primary-hover");
    expect(lightBlock).not.toContain("--stance-color-primary-active");
  });

  it("never emits !important", () => {
    expect(output).not.toContain("!important");
  });
});

describe("compileThemes", () => {
  it("concatenates multiple themes in order", () => {
    const second: Theme = { ...fixtureTheme, name: "second" };
    const output = compileThemes([fixtureTheme, second]);
    const fixtureIndex = output.indexOf('[data-theme="fixture"]');
    const secondIndex = output.indexOf('[data-theme="second"]');
    expect(fixtureIndex).toBeGreaterThanOrEqual(0);
    expect(secondIndex).toBeGreaterThan(fixtureIndex);
  });
});
