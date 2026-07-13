/**
 * Manual checklist (verify by hand in the playground, in addition to the
 * automated checks below):
 *
 * 1. Tab through the accordion — only the header buttons are stops (native
 *    Tab order, no roving tabindex needed since there's no arrow-key nav
 *    requirement for Accordion).
 * 2. Turn on a screen reader and expand/collapse an item — the header
 *    should announce as a button with its expanded/collapsed state, and the
 *    heading level should match wherever the accordion sits in the page.
 */
import { defineComponent, h, nextTick, ref } from "vue";
import { render, screen } from "@testing-library/vue";
import { fireEvent } from "@testing-library/vue";
import { describe, expect, it } from "vitest";
import Accordion, { type AccordionProps } from "./Accordion.vue";
import AccordionItem from "./AccordionItem.vue";
import AccordionHeader from "./AccordionHeader.vue";
import AccordionContent from "./AccordionContent.vue";
import accordionHeaderSource from "./AccordionHeader.vue?raw";
import { runAxe } from "../../tests/axe-matcher";
import { compactDensity, neutralPalette, palettes, withPaletteAndDensityStyle, withPaletteStyle } from "../../tests/theme-test-utils";

const modes = ["light", "dark"] as const;

function renderHarness(accordionProps: Partial<AccordionProps> = {}) {
  const Harness = defineComponent({
    setup() {
      const modelValue = ref(accordionProps.modelValue);
      return () =>
        h(
          Accordion,
          {
            ...accordionProps,
            modelValue: modelValue.value,
            "onUpdate:modelValue": (v: string | string[] | undefined) => {
              modelValue.value = v;
            },
          },
          {
            default: () => [
              h(AccordionItem, { value: "one", key: "one" }, {
                default: () => [
                  h(AccordionHeader, { key: "h1" }, { default: () => "Section One" }),
                  h(AccordionContent, { key: "c1" }, { default: () => "Content one" }),
                ],
              }),
              h(AccordionItem, { value: "two", key: "two" }, {
                default: () => [
                  h(AccordionHeader, { key: "h2" }, { default: () => "Section Two" }),
                  h(AccordionContent, { key: "c2" }, { default: () => "Content two" }),
                ],
              }),
              h(AccordionItem, { value: "three", key: "three", disabled: true }, {
                default: () => [
                  h(AccordionHeader, { key: "h3" }, { default: () => "Section Three (disabled)" }),
                  h(AccordionContent, { key: "c3" }, { default: () => "Content three" }),
                ],
              }),
            ],
          },
        );
    },
  });
  return render(Harness);
}

describe("Accordion", () => {
  it("renders a real button inside a heading element for each item", () => {
    const { container } = renderHarness();
    const heading = container.querySelector("h3")!;
    expect(heading).toBeInTheDocument();
    expect(heading.querySelector("button")).toBeInTheDocument();
  });

  it("uses the configured heading level", () => {
    const Harness = defineComponent({
      setup() {
        return () =>
          h(Accordion, { modelValue: "one" }, {
            default: () =>
              h(AccordionItem, { value: "one" }, {
                default: () => [
                  h(AccordionHeader, { headingLevel: 2 }, { default: () => "Section" }),
                  h(AccordionContent, null, { default: () => "Content" }),
                ],
              }),
          });
      },
    });
    const { container } = render(Harness);
    expect(container.querySelector("h2")).toBeInTheDocument();
    expect(container.querySelector("h3")).not.toBeInTheDocument();
  });

  it("wires aria-expanded/aria-controls/aria-labelledby correctly", () => {
    renderHarness({ modelValue: "one" });
    const trigger = screen.getByRole("button", { name: "Section One" });
    expect(trigger).toHaveAttribute("aria-expanded", "true");

    const panelId = trigger.getAttribute("aria-controls")!;
    const panel = document.getElementById(panelId)!;
    expect(panel.getAttribute("aria-labelledby")).toBe(trigger.id);
  });

  it("single mode: opening one item closes the previously open one", async () => {
    renderHarness({ modelValue: "one", type: "single" });
    const one = screen.getByRole("button", { name: "Section One" });
    const two = screen.getByRole("button", { name: "Section Two" });
    expect(one).toHaveAttribute("aria-expanded", "true");

    await fireEvent.click(two);
    await nextTick();
    expect(one).toHaveAttribute("aria-expanded", "false");
    expect(two).toHaveAttribute("aria-expanded", "true");
  });

  it("single mode: clicking the open item closes it, leaving none open", async () => {
    renderHarness({ modelValue: "one", type: "single" });
    const one = screen.getByRole("button", { name: "Section One" });

    await fireEvent.click(one);
    await nextTick();
    expect(one).toHaveAttribute("aria-expanded", "false");
  });

  it("multiple mode: items open independently without closing each other", async () => {
    renderHarness({ modelValue: [], type: "multiple" });
    const one = screen.getByRole("button", { name: "Section One" });
    const two = screen.getByRole("button", { name: "Section Two" });

    await fireEvent.click(one);
    await nextTick();
    await fireEvent.click(two);
    await nextTick();

    expect(one).toHaveAttribute("aria-expanded", "true");
    expect(two).toHaveAttribute("aria-expanded", "true");

    await fireEvent.click(one);
    await nextTick();
    expect(one).toHaveAttribute("aria-expanded", "false");
    expect(two).toHaveAttribute("aria-expanded", "true");
  });

  it("only shows an open panel's content", () => {
    renderHarness({ modelValue: "one" });
    expect(screen.getByText("Content one")).toBeVisible();
    expect(screen.getByText("Content two")).not.toBeVisible();
  });

  it("does not toggle a disabled item", async () => {
    renderHarness({ modelValue: "one" });
    const disabledTrigger = screen.getByRole("button", { name: "Section Three (disabled)" });
    expect(disabledTrigger).toBeDisabled();

    await fireEvent.click(disabledTrigger);
    await nextTick();
    expect(disabledTrigger).toHaveAttribute("aria-expanded", "false");
  });

  it("never emits !important in AccordionHeader's styles", () => {
    expect(accordionHeaderSource).not.toContain("!important");
  });

  it("wraps AccordionHeader's default styles in :where() to keep specificity at zero", () => {
    const styleBlock = accordionHeaderSource.slice(accordionHeaderSource.indexOf("<style"));
    expect(styleBlock).not.toMatch(/^\.stance-accordion/m);
  });

  describe.each(palettes)("axe: $name palette", (palette) => {
    it.each(modes)("no violations in %s mode", async (mode) => {
      const cleanup = withPaletteStyle(palette);
      const { container } = renderHarness({ modelValue: "one" });
      const root = container.querySelector(".stance-accordion")!;
      root.setAttribute("data-theme-palette", palette.name);
      if (mode === "dark") root.classList.add("dark");

      const results = await runAxe(root);
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
    const { container } = renderHarness({ modelValue: "one" });
    const root = container.querySelector(".stance-accordion")!;
    root.setAttribute("data-theme-palette", "neutral");
    root.setAttribute("data-theme-density", "compact");
    if (mode === "dark") root.classList.add("dark");

    const results = await runAxe(root);
    expect(results).toHaveNoViolations();
    cleanup();
  });
});
