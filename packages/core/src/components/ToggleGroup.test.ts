/**
 * Manual keyboard-nav checklist (verify by hand in the playground, in
 * addition to the automated checks below — arrow-key navigation between
 * segments is real native browser behavior triggered by sharing a `name`
 * attribute, same as RadioGroup, which jsdom does not simulate, so it
 * can't be covered by an automated jsdom test):
 *
 * 1. Tab into the group — focus lands on the selected segment, or the
 *    first one if none is selected yet. Only one stop in the tab order
 *    for the whole group.
 * 2. With a segment focused, press ArrowRight/ArrowDown — focus AND
 *    selection move to the next segment; ArrowLeft/ArrowUp move to the
 *    previous one. A disabled segment is skipped.
 * 3. A visible focus ring (using --stance-color-ring) appears around
 *    whichever segment is focused, in every theme, in both light and
 *    dark mode.
 * 4. Tab to an invalid group with an error message — a screen reader
 *    announces the error text as part of the group's description.
 */
import { h } from "vue";
import { render, screen, within } from "@testing-library/vue";
import { fireEvent } from "@testing-library/vue";
import { describe, expect, it } from "vitest";
import { allThemes, neutral } from "@stance/themes";
import { compileTheme } from "@stance/themes";
import ToggleGroup from "./ToggleGroup.vue";
import ToggleGroupItem from "./ToggleGroupItem.vue";
import toggleGroupSource from "./ToggleGroup.vue?raw";

import { runAxe } from "../../tests/axe-matcher";

const themes = allThemes;
const modes = ["light", "dark"] as const;

function withThemeStyle(theme: (typeof themes)[number]) {
  const style = document.createElement("style");
  style.textContent = compileTheme(theme);
  document.head.appendChild(style);
  return () => style.remove();
}

function renderGroup(props: Record<string, unknown> = {}, optionCount = 3) {
  return render(ToggleGroup, {
    props,
    slots: {
      legend: () => "View",
      default: () =>
        Array.from({ length: optionCount }, (_, i) => h(ToggleGroupItem, { value: `option-${i}`, key: i }, () => `Option ${i}`)),
    },
  });
}

describe("ToggleGroup", () => {
  it("renders role=radiogroup labelled by the legend slot", () => {
    renderGroup();
    const group = screen.getByRole("radiogroup", { name: "View" });
    expect(group).toBeInTheDocument();
    expect(within(group).getAllByRole("radio")).toHaveLength(3);
  });

  it("shares one name across all segments in the group", () => {
    const { container } = renderGroup();
    const names = [...container.querySelectorAll("input[type=radio]")].map((el) => el.getAttribute("name"));
    expect(new Set(names).size).toBe(1);
    expect(names[0]).toBeTruthy();
  });

  it("reflects modelValue as the checked segment", () => {
    renderGroup({ modelValue: "option-1" });
    expect(screen.getByRole("radio", { name: "Option 0" })).not.toBeChecked();
    expect(screen.getByRole("radio", { name: "Option 1" })).toBeChecked();
    expect(screen.getByRole("radio", { name: "Option 2" })).not.toBeChecked();
  });

  it("emits update:modelValue with the clicked segment's value", async () => {
    const { emitted } = renderGroup();
    await fireEvent.click(screen.getByRole("radio", { name: "Option 2" }));
    expect(emitted("update:modelValue")?.[0]).toEqual(["option-2"]);
  });

  it("disables every segment when the group is disabled", () => {
    renderGroup({ disabled: true });
    for (const item of screen.getAllByRole("radio")) {
      expect(item).toBeDisabled();
    }
  });

  it("sets aria-required on the group and every segment when required", () => {
    renderGroup({ required: true });
    expect(screen.getByRole("radiogroup")).toHaveAttribute("aria-required", "true");
    for (const item of screen.getAllByRole("radio")) {
      expect(item).toBeRequired();
    }
  });

  it("sets aria-invalid, without a dangling aria-describedby if there's no error slot", () => {
    renderGroup({ invalid: true });
    const group = screen.getByRole("radiogroup");
    expect(group).toHaveAttribute("aria-invalid", "true");
    expect(group).not.toHaveAttribute("aria-describedby");
  });

  it("wires aria-describedby to the error slot's id when invalid and an error slot is provided", () => {
    render(ToggleGroup, {
      props: { invalid: true },
      slots: {
        legend: () => "View",
        default: () => [h(ToggleGroupItem, { value: "a" }, () => "A")],
        error: () => "You must choose a view",
      },
    });
    const group = screen.getByRole("radiogroup");
    const describedBy = group.getAttribute("aria-describedby");
    expect(describedBy).toBeTruthy();
    expect(document.getElementById(describedBy!)).toHaveTextContent("You must choose a view");
  });

  it("merges a consumer class with the internal class list", () => {
    const { container } = renderGroup({ class: "mt-4" });
    const group = container.querySelector('[role="radiogroup"]');
    expect(group?.className).toContain("stance-toggle-group");
    expect(group?.className).toContain("mt-4");
  });

  it("never emits !important in its styles", () => {
    expect(toggleGroupSource).not.toContain("!important");
  });

  it("wraps default styles in :where() to keep specificity at zero", () => {
    const styleBlock = toggleGroupSource.slice(toggleGroupSource.indexOf("<style"));
    expect(styleBlock).not.toMatch(/^\.stance-toggle-group/m);
  });

  describe.each(themes)("axe: $name theme", (theme) => {
    it.each(modes)("no violations in %s mode (default group)", async (mode) => {
      const cleanup = withThemeStyle(theme);
      const { container } = renderGroup();
      container.setAttribute("data-theme", theme.name);
      if (mode === "dark") container.classList.add("dark");

      const results = await runAxe(container);
      expect(results).toHaveNoViolations();
      cleanup();
    });
  });

  it("no axe violations for an invalid group with an error message (neutral/light)", async () => {
    const cleanup = withThemeStyle(neutral);
    const { container } = render(ToggleGroup, {
      props: { invalid: true },
      slots: {
        legend: () => "View",
        default: () => [h(ToggleGroupItem, { value: "a" }, () => "A"), h(ToggleGroupItem, { value: "b" }, () => "B")],
        error: () => "You must choose a view",
      },
    });
    container.setAttribute("data-theme", "neutral");

    const results = await runAxe(container);
    expect(results).toHaveNoViolations();
    cleanup();
  });

  it("no axe violations when a segment in the group is checked (neutral/light)", async () => {
    const cleanup = withThemeStyle(neutral);
    const { container } = renderGroup({ modelValue: "option-1" });
    container.setAttribute("data-theme", "neutral");

    const results = await runAxe(container);
    expect(results).toHaveNoViolations();
    cleanup();
  });
});
