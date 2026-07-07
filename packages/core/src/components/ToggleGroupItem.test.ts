import { h } from "vue";
import { render, screen } from "@testing-library/vue";
import { describe, expect, it, vi } from "vitest";
import { compileTheme, neutral } from "@stance/themes";
import ToggleGroup from "./ToggleGroup.vue";
import ToggleGroupItem from "./ToggleGroupItem.vue";
import toggleGroupItemSource from "./ToggleGroupItem.vue?raw";
import { runAxe } from "../../tests/axe-matcher";

const themes = [neutral];
const modes = ["light", "dark"] as const;

function withThemeStyle(theme: (typeof themes)[number]) {
  const style = document.createElement("style");
  style.textContent = compileTheme(theme);
  document.head.appendChild(style);
  return () => style.remove();
}

function renderInGroup(itemProps: Record<string, unknown> = {}, groupProps: Record<string, unknown> = {}) {
  return render(ToggleGroup, {
    props: groupProps,
    slots: {
      legend: () => "View",
      default: () => [
        h(ToggleGroupItem, { value: "a", ...itemProps }, () => "Option A"),
        h(ToggleGroupItem, { value: "b" }, () => "Option B"),
      ],
    },
  });
}

describe("ToggleGroupItem", () => {
  it("warns in dev mode when used outside a ToggleGroup", () => {
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    render(ToggleGroupItem, { props: { value: "a" }, slots: { default: "Option A" } });
    expect(errorSpy).toHaveBeenCalledWith(expect.stringContaining("must be used within a <ToggleGroup>"));
    errorSpy.mockRestore();
  });

  it("still renders as a radio input when used outside a ToggleGroup", () => {
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    render(ToggleGroupItem, { props: { value: "a" }, slots: { default: "Option A" } });
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
    const { container } = render(ToggleGroup, {
      slots: {
        legend: () => "View",
        default: () => [
          h(ToggleGroupItem, { value: "a", id: "view-a" }, () => "Option A"),
          h(ToggleGroupItem, { value: "b" }, () => "Option B"),
        ],
      },
    });
    const inputs = [...container.querySelectorAll("input[type=radio]")];
    expect(inputs[0]).toHaveAttribute("id", "view-a");
    expect(inputs[1]?.id).toBeTruthy();
  });

  it("forwards $attrs to the real radio input, not the label", () => {
    const { container } = render(ToggleGroup, {
      slots: {
        legend: () => "View",
        default: () => [h(ToggleGroupItem, { value: "a", "data-testid": "view-a-input" }, () => "Option A")],
      },
    });
    const input = container.querySelector("input[type=radio]");
    const label = container.querySelector("label");
    expect(input).toHaveAttribute("data-testid", "view-a-input");
    expect(label).not.toHaveAttribute("data-testid");
  });

  it("merges a consumer class with the internal class list on the root label", () => {
    const { container } = render(ToggleGroup, {
      slots: {
        legend: () => "View",
        default: () => [h(ToggleGroupItem, { value: "a", class: "mt-4" }, () => "Option A")],
      },
    });
    const label = container.querySelector("label");
    expect(label?.className).toContain("stance-toggle-group-item");
    expect(label?.className).toContain("mt-4");
  });

  it("never emits !important in its styles", () => {
    expect(toggleGroupItemSource).not.toContain("!important");
  });

  it("wraps default styles in :where() to keep specificity at zero", () => {
    const styleBlock = toggleGroupItemSource.slice(toggleGroupItemSource.indexOf("<style"));
    expect(styleBlock).not.toMatch(/^\.stance-toggle-group-item/m);
  });

  describe.each(themes)("axe: $name theme", (theme) => {
    it.each(modes)("no violations in %s mode", async (mode) => {
      const cleanup = withThemeStyle(theme);
      const { container } = renderInGroup({}, { modelValue: "a" });
      container.setAttribute("data-theme", theme.name);
      if (mode === "dark") container.classList.add("dark");

      const results = await runAxe(container);
      expect(results).toHaveNoViolations();
      cleanup();
    });
  });
});
