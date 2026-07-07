import type { ColorRole, Theme, ThemeModeTokens } from "./types";

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

/** Tokens expected to change between light and dark mode: colors and shadow. */
function modeDeclarations(mode: ThemeModeTokens): Declaration[] {
  const { colors, shadow } = mode;
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
    [`${PREFIX}-shadow-sm`, shadow.sm],
    [`${PREFIX}-shadow-md`, shadow.md],
    [`${PREFIX}-shadow-lg`, shadow.lg],
    [`${PREFIX}-shadow-xl`, shadow.xl],
  ];
}

/** Tokens shared across light/dark: a theme's "personality" (radius, density, type). */
function staticDeclarations(theme: Theme): Declaration[] {
  const { radius, spacing, typography } = theme;
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

function toRuleBlock(selector: string, declarations: Declaration[]): string {
  const body = declarations.map(([property, value]) => `  ${property}: ${value};`).join("\n");
  return `${selector} {\n${body}\n}`;
}

/**
 * Compiles a single theme into two CSS rule blocks: the base selector
 * carries light-mode colors/shadow plus every mode-independent token
 * (radius, spacing, typography); the `.dark` selector only overrides
 * colors/shadow, since dark mode is a color-scheme swap, not a
 * different theme personality.
 */
export function compileTheme(theme: Theme): string {
  const lightSelector = `[data-theme="${theme.name}"]`;
  const darkSelector = `[data-theme="${theme.name}"].dark`;

  const lightDeclarations = [...modeDeclarations(theme.light), ...staticDeclarations(theme)];
  const darkDeclarations = modeDeclarations(theme.dark);

  return [toRuleBlock(lightSelector, lightDeclarations), toRuleBlock(darkSelector, darkDeclarations)].join(
    "\n\n",
  );
}

/** Compiles multiple themes into one stylesheet, in the given order. */
export function compileThemes(themes: readonly Theme[]): string {
  return themes.map(compileTheme).join("\n\n");
}
