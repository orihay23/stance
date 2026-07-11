import { afterEach, describe, expect, it, vi } from "vitest";
import { compileDensity, compileDensityProfiles, compileLegacyTheme, compilePalette, compilePalettes, compileTheme, compileThemes } from "./compile";
import type { ColorPalette, ColorRole, DensityProfile, Theme, ThemeColorTokens, ThemeControlTokens, ThemeModeTokens } from "./types";
import { allThemes } from "./themes";
import { allPalettes } from "./palettes";
import { allDensityProfiles } from "./density";

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

describe("compileTheme/compileThemes deprecation warning (Phase 14)", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("compileTheme is compileLegacyTheme under a stable alias", () => {
    expect(compileTheme).toBe(compileLegacyTheme);
  });

  it("fires a one-time dev warning per theme name, not once per call", () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    const onceTheme: Theme = { ...fixtureTheme, name: "warn-once-fixture" };

    compileTheme(onceTheme);
    compileTheme(onceTheme);
    compileTheme(onceTheme);

    const matching = spy.mock.calls.filter((call) => String(call[0]).includes('"warn-once-fixture"'));
    expect(matching).toHaveLength(1);
  });

  it("warns separately for a different theme name", () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    const anotherTheme: Theme = { ...fixtureTheme, name: "warn-another-fixture" };

    compileTheme(anotherTheme);

    const matching = spy.mock.calls.filter((call) => String(call[0]).includes('"warn-another-fixture"'));
    expect(matching).toHaveLength(1);
  });
});

function colorTokens(seed: string): ThemeColorTokens {
  return mode(seed).colors;
}

const fixturePalette: ColorPalette = {
  name: "fixture-palette",
  light: colorTokens("light"),
  dark: colorTokens("dark"),
};

function controlTokens(seed: string): ThemeControlTokens {
  return {
    boxSize: `${seed}-box-size`,
    switchWidth: `${seed}-switch-width`,
    switchThumbTravel: `${seed}-switch-thumb-travel`,
    heightSm: `${seed}-height-sm`,
    heightMd: `${seed}-height-md`,
    heightLg: `${seed}-height-lg`,
  };
}

const fixtureDensity: DensityProfile = {
  name: "fixture-density",
  radius: fixtureTheme.radius,
  spacing: fixtureTheme.spacing,
  typography: fixtureTheme.typography,
  control: controlTokens("control"),
  shadow: {
    light: fixtureTheme.light.shadow,
    dark: fixtureTheme.dark.shadow,
  },
};

describe("compilePalette", () => {
  const output = compilePalette(fixturePalette);

  it("scopes the light block under [data-theme-palette=name]", () => {
    expect(output).toContain('[data-theme-palette="fixture-palette"] {');
  });

  it("scopes the dark block under [data-theme-palette=name].dark", () => {
    expect(output).toContain('[data-theme-palette="fixture-palette"].dark {');
  });

  it("puts light-mode color tokens in the base block, dark-mode only in .dark", () => {
    const darkIndex = output.indexOf('[data-theme-palette="fixture-palette"].dark {');
    const lightBlock = output.slice(0, darkIndex);
    const darkBlock = output.slice(darkIndex);

    expect(lightBlock).toContain("--stance-color-primary: light-primary-default;");
    expect(darkBlock).toContain("--stance-color-primary: dark-primary-default;");
    expect(lightBlock).not.toContain("dark-primary-default");
  });

  it("emits no radius/spacing/typography/shadow tokens — density's job, not palette's", () => {
    expect(output).not.toContain("--stance-radius");
    expect(output).not.toContain("--stance-spacing");
    expect(output).not.toContain("--stance-font");
    expect(output).not.toContain("--stance-shadow");
    expect(output).not.toContain("--stance-control");
  });

  it("never emits !important", () => {
    expect(output).not.toContain("!important");
  });
});

describe("compilePalettes", () => {
  it("concatenates multiple palettes in order", () => {
    const second: ColorPalette = { ...fixturePalette, name: "second-palette" };
    const output = compilePalettes([fixturePalette, second]);
    const firstIndex = output.indexOf('[data-theme-palette="fixture-palette"]');
    const secondIndex = output.indexOf('[data-theme-palette="second-palette"]');
    expect(firstIndex).toBeGreaterThanOrEqual(0);
    expect(secondIndex).toBeGreaterThan(firstIndex);
  });
});

describe("compileDensity", () => {
  const output = compileDensity(fixtureDensity);

  it("scopes the light block under [data-theme-density=name]", () => {
    expect(output).toContain('[data-theme-density="fixture-density"] {');
  });

  it("scopes the dark block under [data-theme-density=name].dark", () => {
    expect(output).toContain('[data-theme-density="fixture-density"].dark {');
  });

  it("puts radius/spacing/typography/control in the base block", () => {
    const darkIndex = output.indexOf('[data-theme-density="fixture-density"].dark {');
    const lightBlock = output.slice(0, darkIndex);

    expect(lightBlock).toContain("--stance-radius-md: 2px;");
    expect(lightBlock).toContain("--stance-spacing-lg: 4px;");
    expect(lightBlock).toContain("--stance-font-sans: sans-stack;");
    expect(lightBlock).toContain("--stance-control-box-size: control-box-size;");
    expect(lightBlock).toContain("--stance-control-switch-width: control-switch-width;");
  });

  it("puts light-mode shadow in the base block, dark-mode shadow only in .dark", () => {
    const darkIndex = output.indexOf('[data-theme-density="fixture-density"].dark {');
    const lightBlock = output.slice(0, darkIndex);
    const darkBlock = output.slice(darkIndex);

    expect(lightBlock).toContain("--stance-shadow-md: light-shadow-md;");
    expect(darkBlock).toContain("--stance-shadow-md: dark-shadow-md;");
    expect(lightBlock).not.toContain("dark-shadow-md");
  });

  it("the .dark block contains only shadow — no radius/spacing/typography/control repeated", () => {
    const darkBlock = output.slice(output.indexOf('[data-theme-density="fixture-density"].dark {'));
    expect(darkBlock).not.toContain("--stance-radius");
    expect(darkBlock).not.toContain("--stance-spacing");
    expect(darkBlock).not.toContain("--stance-font");
    expect(darkBlock).not.toContain("--stance-control");
  });

  it("emits no color tokens — palette's job, not density's", () => {
    expect(output).not.toContain("--stance-color-");
  });

  it("never emits !important", () => {
    expect(output).not.toContain("!important");
  });
});

describe("compileDensityProfiles", () => {
  it("concatenates multiple density profiles in order", () => {
    const second: DensityProfile = { ...fixtureDensity, name: "second-density" };
    const output = compileDensityProfiles([fixtureDensity, second]);
    const firstIndex = output.indexOf('[data-theme-density="fixture-density"]');
    const secondIndex = output.indexOf('[data-theme-density="second-density"]');
    expect(firstIndex).toBeGreaterThanOrEqual(0);
    expect(secondIndex).toBeGreaterThan(firstIndex);
  });
});

describe("Phase 14 decomposition: allPalettes/allDensityProfiles reconstruct allThemes exactly", () => {
  const legacyByName = new Map(allThemes.map((theme) => [theme.name, theme]));
  const paletteByName = new Map(allPalettes.map((palette) => [palette.name, palette]));
  // theme-axes.md §3's mapping table.
  const densityByLegacyName: Record<string, DensityProfile> = {
    neutral: allDensityProfiles.find((d) => d.name === "regular")!,
    serious: allDensityProfiles.find((d) => d.name === "compact")!,
    fun: allDensityProfiles.find((d) => d.name === "relaxed")!,
    crisp: allDensityProfiles.find((d) => d.name === "comfortable")!,
  };

  it.each(allThemes)("$name: palette colors match exactly", (theme) => {
    const palette = paletteByName.get(theme.name);
    expect(palette?.light).toEqual(theme.light.colors);
    expect(palette?.dark).toEqual(theme.dark.colors);
  });

  it.each(allThemes)("$name: density radius/spacing/typography/shadow match exactly", (theme) => {
    const density = densityByLegacyName[theme.name]!;
    expect(density.radius).toEqual(theme.radius);
    expect(density.spacing).toEqual(theme.spacing);
    expect(density.typography).toEqual(theme.typography);
    expect(density.shadow.light).toEqual(theme.light.shadow);
    expect(density.shadow.dark).toEqual(theme.dark.shadow);
  });

  it("every legacy theme name has exactly one palette and one density mapped", () => {
    expect(legacyByName.size).toBe(4);
    expect(paletteByName.size).toBe(4);
    expect(Object.keys(densityByLegacyName)).toHaveLength(4);
  });
});
