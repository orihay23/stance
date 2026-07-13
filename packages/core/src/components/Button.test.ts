/**
 * Manual keyboard-nav checklist (verify by hand in the playground, in
 * addition to the automated checks below):
 *
 * 1. Tab into a button — a visible focus ring (using --stance-color-ring)
 *    appears around it in every variant, in both light and dark mode.
 * 2. Tab through a row containing a `disabled` and a `loading` button —
 *    both are skipped entirely (removed from tab order), tabbing lands on
 *    the next enabled button.
 * 3. With a button focused, press Enter — it activates (click fires).
 * 4. With a button focused, press Space — it activates (click fires).
 * 5. Tab to an icon-only button — a screen reader announces its
 *    `aria-label` text, not "button" alone or the icon's raw markup.
 * 6. Click (not just tab) a `loading` button — nothing happens twice;
 *    the button does not re-trigger its click handler while loading.
 */
import { render, screen } from "@testing-library/vue";
import { fireEvent } from "@testing-library/vue";
import { describe, expect, it, vi } from "vitest";
import Button, { type ButtonSize, type ButtonVariant } from "./Button.vue";
import buttonSource from "./Button.vue?raw";
import { runAxe } from "../../tests/axe-matcher";
import { compactDensity, neutralPalette, palettes, withPaletteAndDensityStyle, withPaletteStyle } from "../../tests/theme-test-utils";

const modes = ["light", "dark"] as const;

describe("Button", () => {
  it("renders slot content inside the button", () => {
    render(Button, { slots: { default: "Save" } });
    expect(screen.getByRole("button", { name: "Save" })).toBeInTheDocument();
  });

  it("defaults to variant=primary, size=md, type=button", () => {
    render(Button, { slots: { default: "Save" } });
    const button = screen.getByRole("button", { name: "Save" });
    expect(button).toHaveAttribute("data-variant", "primary");
    expect(button).toHaveAttribute("data-size", "md");
    expect(button).toHaveAttribute("type", "button");
  });

  it.each<ButtonVariant>(["primary", "secondary", "ghost", "destructive"])(
    "applies data-variant=%s",
    (variant) => {
      render(Button, { props: { variant }, slots: { default: "Save" } });
      expect(screen.getByRole("button", { name: "Save" })).toHaveAttribute("data-variant", variant);
    },
  );

  it.each<ButtonSize>(["sm", "md", "lg"])("applies data-size=%s", (size) => {
    render(Button, { props: { size }, slots: { default: "Save" } });
    expect(screen.getByRole("button", { name: "Save" })).toHaveAttribute("data-size", size);
  });

  it("respects an explicit type prop", () => {
    render(Button, { props: { type: "submit" }, slots: { default: "Save" } });
    expect(screen.getByRole("button", { name: "Save" })).toHaveAttribute("type", "submit");
  });

  it("disables the button and blocks clicks when disabled", () => {
    const onClick = vi.fn();
    render(Button, {
      props: { disabled: true },
      attrs: { onClick },
      slots: { default: "Save" },
    });
    const button = screen.getByRole("button", { name: "Save" });
    expect(button).toBeDisabled();
    // Native .click() respects `disabled` per the HTML activation-behavior
    // spec; fireEvent's dispatchEvent() bypasses that gate, so it isn't a
    // valid way to test this particular guarantee.
    (button as HTMLButtonElement).click();
    expect(onClick).not.toHaveBeenCalled();
  });

  it("fires click when enabled", async () => {
    const onClick = vi.fn();
    render(Button, { attrs: { onClick }, slots: { default: "Save" } });
    await fireEvent.click(screen.getByRole("button", { name: "Save" }));
    expect(onClick).toHaveBeenCalledOnce();
  });

  it("disables the button, sets aria-busy, and hides content when loading", () => {
    const onClick = vi.fn();
    render(Button, {
      props: { loading: true },
      attrs: { onClick },
      slots: { default: "Save" },
    });
    const button = screen.getByRole("button", { hidden: true });
    expect(button).toBeDisabled();
    expect(button).toHaveAttribute("aria-busy", "true");
    expect(button).toHaveAttribute("data-loading", "true");
    (button as HTMLButtonElement).click();
    expect(onClick).not.toHaveBeenCalled();
  });

  it("renders an icon-only button with the given aria-label", () => {
    render(Button, {
      props: { iconOnly: true, ariaLabel: "Close" },
      slots: { default: "<svg />" },
    });
    const button = screen.getByRole("button", { name: "Close" });
    expect(button).toHaveAttribute("data-icon-only", "true");
  });

  it("warns in dev mode when iconOnly is true without ariaLabel", () => {
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    // TS blocks this at the type level (verified separately); simulate a
    // non-TS caller (plain JS, or a dynamically spread props object).
    render(Button, {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      props: { iconOnly: true } as any,
      slots: { default: "<svg />" },
    });
    expect(errorSpy).toHaveBeenCalledWith(
      expect.stringContaining("icon-only buttons require an `ariaLabel`"),
    );
    errorSpy.mockRestore();
  });

  it("merges a consumer class with the internal class list", () => {
    render(Button, { props: { class: "mt-4" }, slots: { default: "Save" } });
    const button = screen.getByRole("button", { name: "Save" });
    expect(button.className).toContain("stance-button");
    expect(button.className).toContain("mt-4");
  });

  it("never emits !important in its styles", () => {
    expect(buttonSource).not.toContain("!important");
  });

  it("wraps default styles in :where() to keep specificity at zero", () => {
    const styleBlock = buttonSource.slice(buttonSource.indexOf("<style"));
    // every top-level ruleset should be :where(...)-wrapped, not a bare class selector
    expect(styleBlock).not.toMatch(/^\.stance-button/m);
  });

  describe.each(palettes)("axe: $name palette", (palette) => {
    it.each(modes)("no violations in %s mode (default button)", async (mode) => {
      const cleanup = withPaletteStyle(palette);
      const { container } = render(Button, { slots: { default: "Save" } });
      container.setAttribute("data-theme-palette", palette.name);
      if (mode === "dark") container.classList.add("dark");

      const results = await runAxe(container);
      expect(results).toHaveNoViolations();
      cleanup();
    });
  });

  // Targeted palette×density cross-check (design-docs/theme-axes.md §4/D4):
  // color contrast/ARIA don't vary by density, so this isn't a full matrix —
  // just one non-default density paired with the default palette, aimed at
  // catching a component that silently assumed color and density tokens
  // always change together.
  it.each(modes)("no axe violations: neutral palette + compact density (%s mode)", async (mode) => {
    const cleanup = withPaletteAndDensityStyle(neutralPalette, compactDensity);
    const { container } = render(Button, { slots: { default: "Save" } });
    container.setAttribute("data-theme-palette", "neutral");
    container.setAttribute("data-theme-density", "compact");
    if (mode === "dark") container.classList.add("dark");

    const results = await runAxe(container);
    expect(results).toHaveNoViolations();
    cleanup();
  });

  it("no axe violations for an icon-only button (neutral/light)", async () => {
    const cleanup = withPaletteStyle(neutralPalette);
    const { container } = render(Button, {
      props: { iconOnly: true, ariaLabel: "Close" },
      slots: { default: '<svg aria-hidden="true"><path d="M0 0" /></svg>' },
    });
    container.setAttribute("data-theme-palette", "neutral");

    const results = await runAxe(container);
    expect(results).toHaveNoViolations();
    cleanup();
  });

  it("no axe violations for a disabled/loading button (neutral/light)", async () => {
    const cleanup = withPaletteStyle(neutralPalette);
    const { container } = render(Button, {
      props: { loading: true },
      slots: { default: "Save" },
    });
    container.setAttribute("data-theme-palette", "neutral");

    const results = await runAxe(container);
    expect(results).toHaveNoViolations();
    cleanup();
  });
});
