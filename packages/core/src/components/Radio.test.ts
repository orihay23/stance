import { h } from "vue";
import { render, screen } from "@testing-library/vue";
import { describe, expect, it, vi } from "vitest";
import RadioGroup from "./RadioGroup.vue";
import Radio from "./Radio.vue";
import radioSource from "./Radio.vue?raw";
import { runAxe } from "../../tests/axe-matcher";
import { compactDensity, neutralPalette, palettes, withPaletteAndDensityStyle, withPaletteStyle } from "../../tests/theme-test-utils";

const modes = ["light", "dark"] as const;

function renderInGroup(radioProps: Record<string, unknown> = {}, groupProps: Record<string, unknown> = {}) {
  return render(RadioGroup, {
    props: groupProps,
    slots: {
      legend: () => "Choose a plan",
      default: () => [h(Radio, { value: "a", ...radioProps }, () => "Option A"), h(Radio, { value: "b" }, () => "Option B")],
    },
  });
}

describe("Radio", () => {
  it("warns in dev mode when used outside a RadioGroup", () => {
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    render(Radio, { props: { value: "a" }, slots: { default: "Option A" } });
    expect(errorSpy).toHaveBeenCalledWith(expect.stringContaining("must be used within a <RadioGroup>"));
    errorSpy.mockRestore();
  });

  it("still renders as a radio input when used outside a RadioGroup", () => {
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    render(Radio, { props: { value: "a" }, slots: { default: "Option A" } });
    expect(screen.getByRole("radio", { name: "Option A" })).toBeInTheDocument();
    errorSpy.mockRestore();
  });

  it("is checked only when its value matches the group's modelValue", () => {
    renderInGroup({}, { modelValue: "a" });
    expect(screen.getByRole("radio", { name: "Option A" })).toBeChecked();
    expect(screen.getByRole("radio", { name: "Option B" })).not.toBeChecked();
  });

  it("is disabled when its own disabled prop is set, independent of the group", () => {
    renderInGroup({ disabled: true });
    expect(screen.getByRole("radio", { name: "Option A" })).toBeDisabled();
    expect(screen.getByRole("radio", { name: "Option B" })).not.toBeDisabled();
  });

  it("is disabled when the group is disabled, even without its own disabled prop", () => {
    renderInGroup({}, { disabled: true });
    expect(screen.getByRole("radio", { name: "Option A" })).toBeDisabled();
    expect(screen.getByRole("radio", { name: "Option B" })).toBeDisabled();
  });

  it("auto-generates an id when none is provided, and uses a provided one verbatim", () => {
    const { container } = render(RadioGroup, {
      slots: {
        legend: () => "Choose a plan",
        default: () => [h(Radio, { value: "a", id: "plan-a" }, () => "Option A"), h(Radio, { value: "b" }, () => "Option B")],
      },
    });
    const inputs = [...container.querySelectorAll("input[type=radio]")];
    expect(inputs[0]).toHaveAttribute("id", "plan-a");
    expect(inputs[1]?.id).toBeTruthy();
  });

  it("forwards $attrs to the real radio input, not the label", () => {
    const { container } = render(RadioGroup, {
      slots: {
        legend: () => "Choose a plan",
        default: () => [h(Radio, { value: "a", "data-testid": "plan-a-input" }, () => "Option A")],
      },
    });
    const input = container.querySelector("input[type=radio]");
    const label = container.querySelector("label");
    expect(input).toHaveAttribute("data-testid", "plan-a-input");
    expect(label).not.toHaveAttribute("data-testid");
  });

  it("merges a consumer class with the internal class list on the root label", () => {
    const { container } = render(RadioGroup, {
      slots: {
        legend: () => "Choose a plan",
        default: () => [h(Radio, { value: "a", class: "mt-4" }, () => "Option A")],
      },
    });
    const label = container.querySelector("label");
    expect(label?.className).toContain("stance-radio");
    expect(label?.className).toContain("mt-4");
  });

  it("never emits !important in its styles", () => {
    expect(radioSource).not.toContain("!important");
  });

  it("wraps default styles in :where() to keep specificity at zero", () => {
    const styleBlock = radioSource.slice(radioSource.indexOf("<style"));
    expect(styleBlock).not.toMatch(/^\.stance-radio/m);
  });

  describe.each(palettes)("axe: $name palette", (palette) => {
    it.each(modes)("no violations in %s mode", async (mode) => {
      const cleanup = withPaletteStyle(palette);
      const { container } = renderInGroup({}, { modelValue: "a" });
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
    const { container } = renderInGroup({}, { modelValue: "a" });
    container.setAttribute("data-theme-palette", "neutral");
    container.setAttribute("data-theme-density", "compact");
    if (mode === "dark") container.classList.add("dark");

    const results = await runAxe(container);
    expect(results).toHaveNoViolations();
    cleanup();
  });
});
