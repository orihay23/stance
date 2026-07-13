import { defineComponent, h, ref } from "vue";
import { render, screen } from "@testing-library/vue";
import { fireEvent } from "@testing-library/vue";
import { describe, expect, it } from "vitest";
import Collapsible, { type CollapsibleProps } from "./Collapsible.vue";
import collapsibleSource from "./Collapsible.vue?raw";
import { runAxe } from "../../tests/axe-matcher";
import { compactDensity, neutralPalette, palettes, withPaletteAndDensityStyle, withPaletteStyle } from "../../tests/theme-test-utils";

const modes = ["light", "dark"] as const;

function renderHarness(props: Partial<CollapsibleProps> = {}) {
  const Harness = defineComponent({
    setup() {
      const modelValue = ref(props.modelValue ?? false);
      return () =>
        h(
          Collapsible,
          {
            ...props,
            modelValue: modelValue.value,
            "onUpdate:modelValue": (v: boolean) => {
              modelValue.value = v;
            },
          },
          {
            trigger: () => "More details",
            default: () => "The hidden content.",
          },
        );
    },
  });
  return render(Harness);
}

describe("Collapsible", () => {
  it("renders a trigger button and content, closed by default", () => {
    renderHarness();
    const trigger = screen.getByRole("button", { name: "More details" });
    expect(trigger).toHaveAttribute("aria-expanded", "false");
    expect(screen.getByText("The hidden content.")).not.toBeVisible();
  });

  it("wires aria-controls to the content panel's id", () => {
    renderHarness();
    const trigger = screen.getByRole("button", { name: "More details" });
    const controls = trigger.getAttribute("aria-controls");
    expect(controls).toBeTruthy();
    expect(document.getElementById(controls!)).toContainElement(screen.getByText("The hidden content."));
  });

  it("the content panel has no role and no aria-labelledby (Disclosure pattern, not a region landmark)", () => {
    renderHarness();
    const trigger = screen.getByRole("button", { name: "More details" });
    const panel = document.getElementById(trigger.getAttribute("aria-controls")!)!;
    expect(panel).not.toHaveAttribute("role");
    expect(panel).not.toHaveAttribute("aria-labelledby");
  });

  it("clicking the trigger toggles aria-expanded and content visibility", async () => {
    renderHarness();
    const trigger = screen.getByRole("button", { name: "More details" });

    await fireEvent.click(trigger);
    expect(trigger).toHaveAttribute("aria-expanded", "true");
    expect(trigger).toHaveAttribute("data-open");
    expect(screen.getByText("The hidden content.")).toBeVisible();

    await fireEvent.click(trigger);
    expect(trigger).toHaveAttribute("aria-expanded", "false");
    expect(trigger).not.toHaveAttribute("data-open");
    expect(screen.getByText("The hidden content.")).not.toBeVisible();
  });

  it("starts open when modelValue is true", () => {
    renderHarness({ modelValue: true });
    expect(screen.getByRole("button", { name: "More details" })).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByText("The hidden content.")).toBeVisible();
  });

  it("does not toggle when disabled", async () => {
    renderHarness({ disabled: true });
    const trigger = screen.getByRole("button", { name: "More details" });
    expect(trigger).toBeDisabled();
    await fireEvent.click(trigger);
    expect(trigger).toHaveAttribute("aria-expanded", "false");
  });

  it("merges a consumer class with the internal class list", () => {
    const { container } = render(Collapsible, {
      props: { class: "mt-4" },
      slots: { trigger: () => "Label", default: () => "Content" },
    });
    const root = container.firstElementChild!;
    expect(root.className).toContain("stance-collapsible");
    expect(root.className).toContain("mt-4");
  });

  it("never emits !important in its styles", () => {
    expect(collapsibleSource).not.toContain("!important");
  });

  it("wraps default styles in :where() to keep specificity at zero", () => {
    const styleBlock = collapsibleSource.slice(collapsibleSource.indexOf("<style"));
    expect(styleBlock).not.toMatch(/^\.stance-collapsible/m);
  });

  describe.each(palettes)("axe: $name palette", (palette) => {
    it.each(modes)("no violations in %s mode (open)", async (mode) => {
      const cleanup = withPaletteStyle(palette);
      const { container } = renderHarness({ modelValue: true });
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
    const { container } = renderHarness({ modelValue: true });
    container.setAttribute("data-theme-palette", "neutral");
    container.setAttribute("data-theme-density", "compact");
    if (mode === "dark") container.classList.add("dark");

    const results = await runAxe(container);
    expect(results).toHaveNoViolations();
    cleanup();
  });
});
