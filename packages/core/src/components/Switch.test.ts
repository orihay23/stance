/**
 * Manual keyboard-nav checklist (verify by hand in the playground, in
 * addition to the automated checks below):
 *
 * 1. Tab into a switch — a visible focus ring (using --stance-color-ring)
 *    appears around the track, in every theme, in both light and dark
 *    mode.
 * 2. With a switch focused, press Space — it toggles on/off.
 * 3. Click the label text (not just the track) — it also toggles the
 *    switch.
 * 4. Tab past a disabled switch — it's skipped entirely (removed from tab
 *    order).
 * 5. Turn a screen reader on (VoiceOver/NVDA/JAWS) and tab to a switch:
 *    it must announce as a "switch" with "on"/"off" state — NOT as a
 *    "checkbox" with "checked"/"unchecked". This can't be automated (no
 *    real screen reader in CI/jsdom) — the role="switch" + aria-checked
 *    wiring is structurally correct and axe-validated below, but the
 *    actual announcement wording needs a real AT to confirm.
 */
import { render, screen } from "@testing-library/vue";
import { fireEvent } from "@testing-library/vue";
import { describe, expect, it } from "vitest";
import Switch from "./Switch.vue";
import switchSource from "./Switch.vue?raw";
import { runAxe } from "../../tests/axe-matcher";
import { compactDensity, neutralPalette, palettes, withPaletteAndDensityStyle, withPaletteStyle } from "../../tests/theme-test-utils";

const modes = ["light", "dark"] as const;

describe("Switch", () => {
  it("renders with role=switch and its slot content as the label", () => {
    render(Switch, { slots: { default: "Airplane mode" } });
    expect(screen.getByRole("switch", { name: "Airplane mode" })).toBeInTheDocument();
  });

  it("defaults to off", () => {
    render(Switch, { slots: { default: "Airplane mode" } });
    const el = screen.getByRole("switch", { name: "Airplane mode" });
    expect(el).not.toBeChecked();
    expect(el).toHaveAttribute("aria-checked", "false");
  });

  it("reflects modelValue as checked and aria-checked=true", () => {
    render(Switch, { props: { modelValue: true }, slots: { default: "Airplane mode" } });
    const el = screen.getByRole("switch", { name: "Airplane mode" });
    expect(el).toBeChecked();
    expect(el).toHaveAttribute("aria-checked", "true");
  });

  it("emits update:modelValue on toggle", async () => {
    const { emitted, getByRole } = render(Switch, { slots: { default: "Airplane mode" } });
    await fireEvent.click(getByRole("switch", { name: "Airplane mode" }));
    expect(emitted("update:modelValue")?.[0]).toEqual([true]);
  });

  it("disables the switch", () => {
    render(Switch, { props: { disabled: true }, slots: { default: "Airplane mode" } });
    expect(screen.getByRole("switch", { name: "Airplane mode" })).toBeDisabled();
  });

  it("sets the required attribute", () => {
    render(Switch, { props: { required: true }, slots: { default: "Airplane mode" } });
    expect(screen.getByRole("switch", { name: "Airplane mode" })).toBeRequired();
  });

  it("sets aria-invalid when invalid, without a dangling aria-describedby if there's no error slot", () => {
    render(Switch, { props: { invalid: true }, slots: { default: "Airplane mode" } });
    const el = screen.getByRole("switch", { name: "Airplane mode" });
    expect(el).toHaveAttribute("aria-invalid", "true");
    expect(el).not.toHaveAttribute("aria-describedby");
  });

  it("wires aria-describedby to the error slot's id when invalid and an error slot is provided", () => {
    render(Switch, {
      props: { invalid: true },
      slots: { default: "Airplane mode", error: "Something went wrong" },
    });
    const el = screen.getByRole("switch", { name: "Airplane mode" });
    const describedBy = el.getAttribute("aria-describedby");
    expect(describedBy).toBeTruthy();
    expect(document.getElementById(describedBy!)).toHaveTextContent("Something went wrong");
  });

  it("forwards $attrs to the real input, not the label", () => {
    const { container } = render(Switch, {
      attrs: { name: "airplane-mode", "data-testid": "airplane-switch" },
      slots: { default: "Airplane mode" },
    });
    const input = container.querySelector("input");
    const label = container.querySelector("label");
    expect(input).toHaveAttribute("name", "airplane-mode");
    expect(input).toHaveAttribute("data-testid", "airplane-switch");
    expect(label).not.toHaveAttribute("name");
  });

  it("merges a consumer class with the internal class list on the root label", () => {
    const { container } = render(Switch, {
      props: { class: "mt-4" },
      slots: { default: "Airplane mode" },
    });
    const label = container.querySelector("label");
    expect(label?.className).toContain("stance-switch");
    expect(label?.className).toContain("mt-4");
  });

  it("never emits !important in its styles", () => {
    expect(switchSource).not.toContain("!important");
  });

  it("wraps default styles in :where() to keep specificity at zero", () => {
    const styleBlock = switchSource.slice(switchSource.indexOf("<style"));
    expect(styleBlock).not.toMatch(/^\.stance-switch/m);
  });

  describe.each(palettes)("axe: $name palette", (palette) => {
    it.each(modes)("no violations in %s mode (default switch)", async (mode) => {
      const cleanup = withPaletteStyle(palette);
      const { container } = render(Switch, { slots: { default: "Airplane mode" } });
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
    const { container } = render(Switch, { slots: { default: "Airplane mode" } });
    container.setAttribute("data-theme-palette", "neutral");
    container.setAttribute("data-theme-density", "compact");
    if (mode === "dark") container.classList.add("dark");

    const results = await runAxe(container);
    expect(results).toHaveNoViolations();
    cleanup();
  });

  it("no axe violations when checked (neutral/light)", async () => {
    const cleanup = withPaletteStyle(neutralPalette);
    const { container } = render(Switch, {
      props: { modelValue: true },
      slots: { default: "Airplane mode" },
    });
    container.setAttribute("data-theme-palette", "neutral");

    const results = await runAxe(container);
    expect(results).toHaveNoViolations();
    cleanup();
  });

  it("no axe violations for an invalid switch with an error message (neutral/light)", async () => {
    const cleanup = withPaletteStyle(neutralPalette);
    const { container } = render(Switch, {
      props: { invalid: true },
      slots: { default: "Airplane mode", error: "Something went wrong" },
    });
    container.setAttribute("data-theme-palette", "neutral");

    const results = await runAxe(container);
    expect(results).toHaveNoViolations();
    cleanup();
  });

  it("no axe violations when disabled (neutral/light)", async () => {
    const cleanup = withPaletteStyle(neutralPalette);
    const { container } = render(Switch, {
      props: { disabled: true },
      slots: { default: "Airplane mode" },
    });
    container.setAttribute("data-theme-palette", "neutral");

    const results = await runAxe(container);
    expect(results).toHaveNoViolations();
    cleanup();
  });
});
