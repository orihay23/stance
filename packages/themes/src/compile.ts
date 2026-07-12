import type {
  ColorPalette,
  ColorRole,
  DensityProfile,
  Theme,
  ThemeColorTokens,
  ThemeControlTokens,
  ThemeModeTokens,
  ThemeShadowTokens,
} from "./types";

const PREFIX = "--stance";

type Declaration = readonly [property: string, value: string];

function colorRoleDeclarations(roleName: string, role: ColorRole): Declaration[] {
  const declarations: Declaration[] = [
    [`${PREFIX}-color-${roleName}`, role.DEFAULT],
    [`${PREFIX}-color-${roleName}-foreground`, role.foreground],
  ];
  if (role.hover !== undefined) {
    declarations.push([`${PREFIX}-color-${roleName}-hover`, role.hover]);
  }
  if (role.active !== undefined) {
    declarations.push([`${PREFIX}-color-${roleName}-active`, role.active]);
  }
  return declarations;
}

/** Every color-role token — shared by the legacy per-theme compiler and `compilePalette`. */
function colorDeclarations(colors: ThemeColorTokens): Declaration[] {
  return [
    [`${PREFIX}-color-background`, colors.background],
    [`${PREFIX}-color-foreground`, colors.foreground],
    ...colorRoleDeclarations("surface", colors.surface),
    [`${PREFIX}-color-overlay`, colors.overlay],
    [`${PREFIX}-color-border`, colors.border],
    [`${PREFIX}-color-ring`, colors.ring],
    ...colorRoleDeclarations("primary", colors.primary),
    ...colorRoleDeclarations("secondary", colors.secondary),
    ...colorRoleDeclarations("accent", colors.accent),
    ...colorRoleDeclarations("muted", colors.muted),
    ...colorRoleDeclarations("destructive", colors.destructive),
    ...colorRoleDeclarations("success", colors.success),
    ...colorRoleDeclarations("warning", colors.warning),
    ...colorRoleDeclarations("info", colors.info),
  ];
}

/** Shadow tokens — density-owned (theme-axes.md §1), but shared by the legacy compiler too. */
function shadowDeclarations(shadow: ThemeShadowTokens): Declaration[] {
  return [
    [`${PREFIX}-shadow-sm`, shadow.sm],
    [`${PREFIX}-shadow-md`, shadow.md],
    [`${PREFIX}-shadow-lg`, shadow.lg],
    [`${PREFIX}-shadow-xl`, shadow.xl],
  ];
}

/** Tokens expected to change between light and dark mode: colors and shadow. */
function modeDeclarations(mode: ThemeModeTokens): Declaration[] {
  return [...colorDeclarations(mode.colors), ...shadowDeclarations(mode.shadow)];
}

/** Tokens shared across light/dark: a theme's "personality" (radius, spacing, type). */
function staticDeclarations({
  radius,
  spacing,
  typography,
}: Pick<Theme, "radius" | "spacing" | "typography">): Declaration[] {
  return [
    [`${PREFIX}-radius-none`, radius.none],
    [`${PREFIX}-radius-sm`, radius.sm],
    [`${PREFIX}-radius-md`, radius.md],
    [`${PREFIX}-radius-lg`, radius.lg],
    [`${PREFIX}-radius-xl`, radius.xl],
    [`${PREFIX}-radius-full`, radius.full],
    [`${PREFIX}-spacing-xs`, spacing.xs],
    [`${PREFIX}-spacing-sm`, spacing.sm],
    [`${PREFIX}-spacing-md`, spacing.md],
    [`${PREFIX}-spacing-lg`, spacing.lg],
    [`${PREFIX}-spacing-xl`, spacing.xl],
    [`${PREFIX}-font-sans`, typography.fontFamily.sans],
    [`${PREFIX}-font-mono`, typography.fontFamily.mono],
    [`${PREFIX}-text-xs`, typography.fontSize.xs],
    [`${PREFIX}-text-sm`, typography.fontSize.sm],
    [`${PREFIX}-text-base`, typography.fontSize.base],
    [`${PREFIX}-text-lg`, typography.fontSize.lg],
    [`${PREFIX}-text-xl`, typography.fontSize.xl],
    [`${PREFIX}-text-2xl`, typography.fontSize["2xl"]],
    [`${PREFIX}-font-weight-normal`, typography.fontWeight.normal],
    [`${PREFIX}-font-weight-medium`, typography.fontWeight.medium],
    [`${PREFIX}-font-weight-semibold`, typography.fontWeight.semibold],
    [`${PREFIX}-font-weight-bold`, typography.fontWeight.bold],
    [`${PREFIX}-leading-tight`, typography.lineHeight.tight],
    [`${PREFIX}-leading-normal`, typography.lineHeight.normal],
    [`${PREFIX}-leading-relaxed`, typography.lineHeight.relaxed],
  ];
}

/** Control-geometry tokens (theme-axes.md §1) — density-owned, new in Phase 14. */
function controlDeclarations(control: ThemeControlTokens): Declaration[] {
  return [
    [`${PREFIX}-control-box-size`, control.boxSize],
    [`${PREFIX}-control-switch-width`, control.switchWidth],
    [`${PREFIX}-control-switch-thumb-travel`, control.switchThumbTravel],
    [`${PREFIX}-control-height-sm`, control.heightSm],
    [`${PREFIX}-control-height-md`, control.heightMd],
    [`${PREFIX}-control-height-lg`, control.heightLg],
  ];
}

function toRuleBlock(selector: string, declarations: Declaration[]): string {
  const body = declarations.map(([property, value]) => `  ${property}: ${value};`).join("\n");
  return `${selector} {\n${body}\n}`;
}

const warnedLegacyThemeNames = new Set<string>();

/**
 * Dev-mode-only, fires once per legacy theme *name* (not once per call/
 * render) — matches the pattern components already use for other one-time
 * dev warnings (e.g. Sheet.vue's missing-`title` check). Placeholder
 * migration-doc path: the real guide lands in Phase 14/D5
 * (design-docs/theme-axes.md §6) — `data-theme="..."` keeps working
 * unmodified in the meantime, this is a nudge, not a break.
 */
function warnLegacyThemeUsage(themeName: string): void {
  if (!import.meta.env.DEV) return;
  if (warnedLegacyThemeNames.has(themeName)) return;
  warnedLegacyThemeNames.add(themeName);
  console.error(
    `[stance/themes] Theme "${themeName}" was compiled via the legacy bundled Theme API ` +
      "(compileTheme/compileThemes/allThemes). This still works, but color palette and " +
      "density are now independently selectable via data-theme-palette/data-theme-density " +
      "— see the migration guide (docs/theming.md#migrating-from-data-theme, Phase 14/D5) " +
      "when it's ready.",
  );
}

/**
 * Compiles a single legacy (pre-Phase-14) theme into two CSS rule blocks:
 * the base selector carries light-mode colors/shadow plus every
 * mode-independent token (radius, spacing, typography); the `.dark`
 * selector only overrides colors/shadow, since dark mode is a color-scheme
 * swap, not a different theme personality.
 *
 * @deprecated Prefer `compilePalette` + `compileDensity`. Kept byte-for-
 * byte identical to the pre-Phase-14 `compileTheme` (verified in
 * compile.test.ts) so `data-theme="..."` consumers keep working
 * unmodified — see design-docs/theme-axes.md §3.
 */
export function compileLegacyTheme(theme: Theme): string {
  warnLegacyThemeUsage(theme.name);

  const lightSelector = `[data-theme="${theme.name}"]`;
  const darkSelector = `[data-theme="${theme.name}"].dark`;

  const lightDeclarations = [...modeDeclarations(theme.light), ...staticDeclarations(theme)];
  const darkDeclarations = modeDeclarations(theme.dark);

  return [toRuleBlock(lightSelector, lightDeclarations), toRuleBlock(darkSelector, darkDeclarations)].join(
    "\n\n",
  );
}

/**
 * @deprecated Stable alias for `compileLegacyTheme`, kept under its
 * original name so existing imports don't need to change. See
 * design-docs/theme-axes.md §3.
 */
export const compileTheme = compileLegacyTheme;

/**
 * Compiles multiple legacy themes into one stylesheet, in the given order.
 * @deprecated See `compileLegacyTheme`.
 */
export function compileThemes(themes: readonly Theme[]): string {
  return themes.map(compileLegacyTheme).join("\n\n");
}

/**
 * Compiles a single color palette into two CSS rule blocks, scoped under
 * `data-theme-palette` rather than `data-theme` — colors only, no
 * radius/spacing/typography/shadow (those are `compileDensity`'s job; see
 * design-docs/theme-axes.md §1/§2).
 */
export function compilePalette(palette: ColorPalette): string {
  const lightSelector = `[data-theme-palette="${palette.name}"]`;
  const darkSelector = `[data-theme-palette="${palette.name}"].dark`;

  return [
    toRuleBlock(lightSelector, colorDeclarations(palette.light)),
    toRuleBlock(darkSelector, colorDeclarations(palette.dark)),
  ].join("\n\n");
}

/** Compiles multiple color palettes into one stylesheet, in the given order. */
export function compilePalettes(palettes: readonly ColorPalette[]): string {
  return palettes.map(compilePalette).join("\n\n");
}

/**
 * Compiles a single density profile into two CSS rule blocks, scoped under
 * `data-theme-density`: the base selector carries radius/spacing/
 * typography/control (mode-independent) plus light-mode shadow; the
 * `.dark` selector only overrides shadow, since shadow is the one
 * density-owned token that still needs to differ between light and dark
 * (theme-axes.md §1).
 */
export function compileDensity(profile: DensityProfile): string {
  const lightSelector = `[data-theme-density="${profile.name}"]`;
  const darkSelector = `[data-theme-density="${profile.name}"].dark`;

  const lightDeclarations = [
    ...staticDeclarations(profile),
    ...controlDeclarations(profile.control),
    ...shadowDeclarations(profile.shadow.light),
  ];
  const darkDeclarations = shadowDeclarations(profile.shadow.dark);

  return [toRuleBlock(lightSelector, lightDeclarations), toRuleBlock(darkSelector, darkDeclarations)].join(
    "\n\n",
  );
}

/** Compiles multiple density profiles into one stylesheet, in the given order. */
export function compileDensityProfiles(profiles: readonly DensityProfile[]): string {
  return profiles.map(compileDensity).join("\n\n");
}
