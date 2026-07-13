/**
 * Manual keyboard-nav checklist (verify by hand in the playground, in
 * addition to the automated checks below):
 *
 * 1. Tab into a checkbox — a visible focus ring (using --stance-color-ring)
 *    appears around the visible box, in every theme, in both light and
 *    dark mode. (The real focus target is visually hidden, so the ring
 *    must appear on the decorative box, not nowhere.)
 * 2. With a checkbox focused, press Space — it toggles checked state.
 * 3. Click the label text (not just the box) — it also toggles the
 *    checkbox.
 * 4. Tab past a disabled checkbox — it's skipped entirely (removed from
 *    tab order).
 * 5. Tab to an indeterminate checkbox — a screen reader announces "mixed"
 *    state, not silently falling back to "checked" or "unchecked".
 * 6. Tab to an invalid checkbox with an error message — a screen reader
 *    announces the error text as part of the field's description.
 */
import { render, screen } from "@testing-library/vue";
import { fireEvent } from "@testing-library/vue";
import { nextTick } from "vue";
import { describe, expect, it } from "vitest";
import Checkbox from "./Checkbox.vue";
import checkboxSource from "./Checkbox.vue?raw";
import { runAxe } from "../../tests/axe-matcher";
import { compactDensity, neutralPalette, palettes, withPaletteAndDensityStyle, withPaletteStyle } from "../../tests/theme-test-utils";

const modes = ["light", "dark"] as const;

describe("Checkbox", () => {
  it("renders slot content as its label", () => {
    render(Checkbox, { slots: { default: "Accept terms" } });
    expect(screen.getByRole("checkbox", { name: "Accept terms" })).toBeInTheDocument();
  });

  it("defaults to unchecked", () => {
    render(Checkbox, { slots: { default: "Accept terms" } });
    expect(screen.getByRole("checkbox", { name: "Accept terms" })).not.toBeChecked();
  });

  it("reflects modelValue as checked", () => {
    render(Checkbox, { props: { modelValue: true }, slots: { default: "Accept terms" } });
    expect(screen.getByRole("checkbox", { name: "Accept terms" })).toBeChecked();
  });

  it("emits update:modelValue on toggle", async () => {
    const { emitted, getByRole } = render(Checkbox, { slots: { default: "Accept terms" } });
    const checkbox = getByRole("checkbox", { name: "Accept terms" });
    await fireEvent.click(checkbox);
    expect(emitted("update:modelValue")?.[0]).toEqual([true]);
  });

  it("disables the checkbox", () => {
    render(Checkbox, { props: { disabled: true }, slots: { default: "Accept terms" } });
    expect(screen.getByRole("checkbox", { name: "Accept terms" })).toBeDisabled();
  });

  it("sets the indeterminate DOM property and aria-checked=mixed", async () => {
    const { container } = render(Checkbox, {
      props: { indeterminate: true },
      slots: { default: "Select all" },
    });
    await nextTick();
    const input = container.querySelector("input")!;
    expect(input.indeterminate).toBe(true);
    expect(input).toHaveAttribute("aria-checked", "mixed");
  });

  it("does not set aria-checked when not indeterminate", () => {
    render(Checkbox, { props: { modelValue: true }, slots: { default: "Accept terms" } });
    expect(screen.getByRole("checkbox", { name: "Accept terms" })).not.toHaveAttribute("aria-checked");
  });

  it("sets aria-invalid when invalid, without a dangling aria-describedby if there's no error slot", () => {
    render(Checkbox, { props: { invalid: true }, slots: { default: "Accept terms" } });
    const checkbox = screen.getByRole("checkbox", { name: "Accept terms" });
    expect(checkbox).toHaveAttribute("aria-invalid", "true");
    expect(checkbox).not.toHaveAttribute("aria-describedby");
  });

  it("wires aria-describedby to the error slot's id when invalid and an error slot is provided", () => {
    render(Checkbox, {
      props: { invalid: true },
      slots: { default: "Accept terms", error: "You must accept the terms" },
    });
    const checkbox = screen.getByRole("checkbox", { name: "Accept terms" });
    const describedBy = checkbox.getAttribute("aria-describedby");
    expect(describedBy).toBeTruthy();
    expect(document.getElementById(describedBy!)).toHaveTextContent("You must accept the terms");
  });

  it("forwards $attrs to the real checkbox input, not the label", () => {
    const { container } = render(Checkbox, {
      attrs: { name: "terms", "data-testid": "terms-checkbox" },
      slots: { default: "Accept terms" },
    });
    const input = container.querySelector("input");
    const label = container.querySelector("label");
    expect(input).toHaveAttribute("name", "terms");
    expect(input).toHaveAttribute("data-testid", "terms-checkbox");
    expect(label).not.toHaveAttribute("name");
  });

  it("merges a consumer class with the internal class list on the root label", () => {
    const { container } = render(Checkbox, {
      props: { class: "mt-4" },
      slots: { default: "Accept terms" },
    });
    const label = container.querySelector("label");
    expect(label?.className).toContain("stance-checkbox");
    expect(label?.className).toContain("mt-4");
  });

  it("never emits !important in its styles", () => {
    expect(checkboxSource).not.toContain("!important");
  });

  it("wraps default styles in :where() to keep specificity at zero", () => {
    const styleBlock = checkboxSource.slice(checkboxSource.indexOf("<style"));
    expect(styleBlock).not.toMatch(/^\.stance-checkbox/m);
  });

  describe.each(palettes)("axe: $name palette", (palette) => {
    it.each(modes)("no violations in %s mode (default checkbox)", async (mode) => {
      const cleanup = withPaletteStyle(palette);
      const { container } = render(Checkbox, { slots: { default: "Accept terms" } });
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
    const { container } = render(Checkbox, { slots: { default: "Accept terms" } });
    container.setAttribute("data-theme-palette", "neutral");
    container.setAttribute("data-theme-density", "compact");
    if (mode === "dark") container.classList.add("dark");

    const results = await runAxe(container);
    expect(results).toHaveNoViolations();
    cleanup();
  });

  it("no axe violations when checked (neutral/light)", async () => {
    const cleanup = withPaletteStyle(neutralPalette);
    const { container } = render(Checkbox, {
      props: { modelValue: true },
      slots: { default: "Accept terms" },
    });
    container.setAttribute("data-theme-palette", "neutral");

    const results = await runAxe(container);
    expect(results).toHaveNoViolations();
    cleanup();
  });

  it("no axe violations when indeterminate (neutral/light)", async () => {
    const cleanup = withPaletteStyle(neutralPalette);
    const { container } = render(Checkbox, {
      props: { indeterminate: true },
      slots: { default: "Select all" },
    });
    await nextTick();
    container.setAttribute("data-theme-palette", "neutral");

    const results = await runAxe(container);
    expect(results).toHaveNoViolations();
    cleanup();
  });

  it("no axe violations for an invalid checkbox with an error message (neutral/light)", async () => {
    const cleanup = withPaletteStyle(neutralPalette);
    const { container } = render(Checkbox, {
      props: { invalid: true },
      slots: { default: "Accept terms", error: "You must accept the terms" },
    });
    container.setAttribute("data-theme-palette", "neutral");

    const results = await runAxe(container);
    expect(results).toHaveNoViolations();
    cleanup();
  });

  it("no axe violations when disabled (neutral/light)", async () => {
    const cleanup = withPaletteStyle(neutralPalette);
    const { container } = render(Checkbox, {
      props: { disabled: true },
      slots: { default: "Accept terms" },
    });
    container.setAttribute("data-theme-palette", "neutral");

    const results = await runAxe(container);
    expect(results).toHaveNoViolations();
    cleanup();
  });
});
