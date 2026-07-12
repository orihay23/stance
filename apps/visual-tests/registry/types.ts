import type { Locator, Page } from "@playwright/test";
import { allDensityProfiles } from "@stance/themes";

export interface CaptureSpec {
  /** Suffix appended to the snapshot filename, e.g. "light", "dark", "narrow-400". */
  name: string;
  /**
   * CSS selector to scope the screenshot to. Full-page screenshot when
   * omitted — required for anything that teleports content outside the
   * story's own DOM subtree (Dialog/Popover/DropdownMenu/Tooltip all
   * portal to a shared overlay root at the document body).
   */
  selector?: string;
  /**
   * Run before capturing — e.g. clicking a trigger to open a closed-by-
   * default overlay, or collapsing an Accordion item that starts expanded.
   * Receives `interactionSelector` scoped as a Locator if set, else the
   * same scope as the screenshot (Locator if `selector` is set, else the
   * Page) — so a click targets the right instance when a variant repeats
   * the same accessible name in multiple sections (e.g. "Shipping"
   * appearing in both the light and dark Accordion).
   */
  beforeCapture?: (scope: Locator | Page) => Promise<void>;
  /**
   * Overrides the scope `beforeCapture` runs against, when it differs from
   * the screenshot's own `selector` — needed for Dialog/Popover/
   * DropdownMenu/Tooltip, which teleport their open content to a shared
   * overlay root outside the themed section's own DOM subtree: the click
   * has to be scoped to the section (to hit the right trigger), but the
   * screenshot has to be full-page (unscoped) to actually include the
   * teleported content.
   */
  interactionSelector?: string;
}

export interface VariantSpec {
  /**
   * The variant's title as authored in the story file, resolved to a
   * variantId via the built Histoire manifest (see manifest.ts) — stays
   * correct even if variants are reordered or new ones are inserted.
   */
  variantTitle: string;
  captures: CaptureSpec[];
}

export interface ComponentSpec {
  /** Matches the story file name, e.g. "Accordion" -> storyId "src-accordion-story-vue". */
  component: string;
  variants: VariantSpec[];
}

/**
 * The two standard captures for any variant using the established
 * `[data-theme]` (light) / `[data-theme].dark` (dark) section convention —
 * every "Light + Dark"-style variant across the codebase follows this, so
 * this is the one place that convention is encoded, not repeated per
 * component.
 */
export function lightDarkCaptures(): CaptureSpec[] {
  return [
    { name: "light", selector: "[data-theme]:not(.dark)" },
    { name: "dark", selector: "[data-theme].dark" },
  ];
}

/**
 * One capture per density profile, scoped to `[data-theme-density="name"]`
 * — the Phase 14/D3 counterpart of `lightDarkCaptures()` (theme-axes.md
 * §4's curated matrix: showcase the default palette across every density
 * profile, light mode only, rather than the full palette × density × mode
 * combinatorial space). Reads from `allDensityProfiles` so a 5th density
 * profile is covered automatically, the same way `lightDarkCaptures()`
 * doesn't need to know theme names.
 */
export function densityCaptures(): CaptureSpec[] {
  return allDensityProfiles.map((profile) => ({
    name: profile.name,
    selector: `[data-theme-density="${profile.name}"]`,
  }));
}

/**
 * `densityCaptures()`'s counterpart for components that teleport their open
 * content to the shared overlay root (Combobox/CommandPalette/Dialog/
 * DropdownMenu/Popover/Sheet/Tooltip/DatePicker) — the screenshot itself has
 * to be full-page (unscoped), same reasoning as `lightDarkCaptures()`'s
 * teleporting siblings, so only the interaction that opens/reveals the
 * content is scoped to the right density section via `interactionSelector`.
 * `open` runs against that section's Locator, matching `beforeCapture`'s own
 * contract (see CaptureSpec) since `interactionSelector` is always set here.
 */
export function densityInteractionCaptures(open: (section: Locator) => Promise<void>): CaptureSpec[] {
  return allDensityProfiles.map((profile) => ({
    name: profile.name,
    interactionSelector: `[data-theme-density="${profile.name}"]`,
    beforeCapture: (scope) => open(scope as Locator),
  }));
}

/**
 * The common shape shared by most primitives: a "Light + Dark" variant (the
 * two standard section captures) and, for anything with responsive/collapse
 * behavior, a "Narrow container" variant (one capture, scoped to its single
 * `[data-theme]` wrapper — there's no dark counterpart in that variant).
 * Config-side generation for this repeated shape, rather than hand-writing
 * a near-identical file per component.
 */
export function simpleComponent(
  component: string,
  options: { narrow?: boolean; narrowTitle?: string; density?: boolean } = {},
): ComponentSpec {
  const variants: VariantSpec[] = [{ variantTitle: "Light + Dark", captures: lightDarkCaptures() }];
  if (options.narrow) {
    variants.push({
      variantTitle: options.narrowTitle ?? "Narrow container (responsive check)",
      captures: [{ name: "default", selector: "[data-theme]" }],
    });
  }
  if (options.density) {
    variants.push({ variantTitle: "Density", captures: densityCaptures() });
  }
  return { component, variants };
}
