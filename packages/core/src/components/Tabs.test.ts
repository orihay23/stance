/**
 * Manual checklist (verify by hand in the playground, in addition to the
 * automated checks below):
 *
 * 1. Tab into the tablist — focus lands on the currently selected tab only
 *    (roving tabindex: other tabs aren't in the page's normal Tab order).
 * 2. With a tab focused, press ArrowRight/ArrowLeft (or ArrowDown/ArrowUp in
 *    a vertical Tabs) — focus AND selection move together (automatic
 *    activation), wrapping at the ends; Home/End jump to the first/last tab.
 * 3. Turn on a screen reader and move between tabs — each should announce
 *    "tab", its selected state, and its position/count if the AT reports one.
 * 4. In a narrow container where the tabs collectively don't fit, confirm
 *    the tablist scrolls horizontally (not the page) and that moving focus
 *    with the arrow keys/Home/End auto-scrolls an off-screen tab into view
 *    — jsdom has no real layout, so scrollWidth/clientWidth can't be
 *    asserted here.
 */
import { defineComponent, h, nextTick, ref } from "vue";
import { render, screen } from "@testing-library/vue";
import { fireEvent } from "@testing-library/vue";
import { describe, expect, it } from "vitest";
import { neutral } from "@stance/themes";
import { compileTheme } from "@stance/themes";
import Tabs, { type TabsProps } from "./Tabs.vue";
import TabList from "./TabList.vue";
import Tab from "./Tab.vue";
import TabPanel from "./TabPanel.vue";
import tabSource from "./Tab.vue?raw";
import { runAxe } from "../../tests/axe-matcher";

const themes = [neutral];
const modes = ["light", "dark"] as const;

function withThemeStyle(theme: (typeof themes)[number]) {
  const style = document.createElement("style");
  style.textContent = compileTheme(theme);
  document.head.appendChild(style);
  return () => style.remove();
}

function renderHarness(tabsProps: Partial<TabsProps> = {}) {
  const Harness = defineComponent({
    setup() {
      const active = ref(tabsProps.modelValue ?? "one");
      return () =>
        h(
          Tabs,
          {
            modelValue: active.value,
            "onUpdate:modelValue": (v: string) => {
              active.value = v;
            },
            ...tabsProps,
          },
          {
            default: () => [
              h(TabList, null, {
                default: () => [
                  h(Tab, { value: "one", key: "one" }, { default: () => "One" }),
                  h(Tab, { value: "two", key: "two" }, { default: () => "Two" }),
                  h(Tab, { value: "three", key: "three", disabled: true }, { default: () => "Three (disabled)" }),
                  h(Tab, { value: "four", key: "four" }, { default: () => "Four" }),
                ],
              }),
              h(TabPanel, { value: "one", key: "p-one" }, { default: () => "Panel one content" }),
              h(TabPanel, { value: "two", key: "p-two" }, { default: () => "Panel two content" }),
              h(TabPanel, { value: "three", key: "p-three" }, { default: () => "Panel three content" }),
              h(TabPanel, { value: "four", key: "p-four" }, { default: () => "Panel four content" }),
            ],
          },
        );
    },
  });
  return render(Harness);
}

describe("Tabs", () => {
  it("renders tablist/tab/tabpanel roles", () => {
    renderHarness();
    expect(screen.getByRole("tablist")).toBeInTheDocument();
    expect(screen.getAllByRole("tab")).toHaveLength(4);
    // Only the selected panel is visible/queryable via toBeVisible, but all stay in the DOM.
    expect(screen.getByText("Panel one content")).toBeInTheDocument();
  });

  it("wires aria-selected, roving tabindex, and aria-controls/aria-labelledby", () => {
    renderHarness();
    const one = screen.getByRole("tab", { name: "One" });
    const two = screen.getByRole("tab", { name: "Two" });

    expect(one).toHaveAttribute("aria-selected", "true");
    expect(one).toHaveAttribute("tabindex", "0");
    expect(two).toHaveAttribute("aria-selected", "false");
    expect(two).toHaveAttribute("tabindex", "-1");

    const panelId = one.getAttribute("aria-controls")!;
    const panel = document.getElementById(panelId)!;
    expect(panel).toHaveAttribute("role", "tabpanel");
    expect(panel.getAttribute("aria-labelledby")).toBe(one.id);
  });

  it("only shows the selected panel", () => {
    renderHarness();
    expect(screen.getByText("Panel one content")).toBeVisible();
    expect(screen.getByText("Panel two content")).not.toBeVisible();
  });

  it("clicking a tab selects it and shows its panel", async () => {
    renderHarness();
    await fireEvent.click(screen.getByRole("tab", { name: "Two" }));
    await nextTick();

    expect(screen.getByRole("tab", { name: "Two" })).toHaveAttribute("aria-selected", "true");
    expect(screen.getByText("Panel two content")).toBeVisible();
    expect(screen.getByText("Panel one content")).not.toBeVisible();
  });

  it("ArrowRight moves focus and automatically activates the next tab, wrapping at the end", async () => {
    renderHarness();
    const one = screen.getByRole("tab", { name: "One" });
    const two = screen.getByRole("tab", { name: "Two" });
    const four = screen.getByRole("tab", { name: "Four" });

    one.focus();
    await fireEvent.keyDown(one, { key: "ArrowRight" });
    expect(document.activeElement).toBe(two);
    expect(two).toHaveAttribute("aria-selected", "true");
    expect(screen.getByText("Panel two content")).toBeVisible();

    // Skips the disabled "Three" tab entirely.
    await fireEvent.keyDown(two, { key: "ArrowRight" });
    expect(document.activeElement).toBe(four);
    expect(four).toHaveAttribute("aria-selected", "true");

    // Wraps back to the first.
    await fireEvent.keyDown(four, { key: "ArrowRight" });
    expect(document.activeElement).toBe(one);
    expect(one).toHaveAttribute("aria-selected", "true");
  });

  it("ArrowLeft moves focus/activation backward, wrapping to the last enabled tab", async () => {
    renderHarness();
    const one = screen.getByRole("tab", { name: "One" });
    const four = screen.getByRole("tab", { name: "Four" });

    one.focus();
    await fireEvent.keyDown(one, { key: "ArrowLeft" });
    expect(document.activeElement).toBe(four);
    expect(four).toHaveAttribute("aria-selected", "true");
  });

  it("Home/End jump to the first/last enabled tab", async () => {
    renderHarness();
    const two = screen.getByRole("tab", { name: "Two" });
    const one = screen.getByRole("tab", { name: "One" });
    const four = screen.getByRole("tab", { name: "Four" });

    two.focus();
    await fireEvent.keyDown(two, { key: "End" });
    expect(document.activeElement).toBe(four);

    await fireEvent.keyDown(four, { key: "Home" });
    expect(document.activeElement).toBe(one);
  });

  it("uses vertical arrow keys and aria-orientation when orientation is vertical", async () => {
    renderHarness({ orientation: "vertical" });
    expect(screen.getByRole("tablist")).toHaveAttribute("aria-orientation", "vertical");

    const one = screen.getByRole("tab", { name: "One" });
    const two = screen.getByRole("tab", { name: "Two" });
    one.focus();
    await fireEvent.keyDown(one, { key: "ArrowDown" });
    expect(document.activeElement).toBe(two);

    // Horizontal keys should do nothing in vertical mode.
    await fireEvent.keyDown(two, { key: "ArrowRight" });
    expect(document.activeElement).toBe(two);
  });

  it("never emits !important in Tab's styles", () => {
    expect(tabSource).not.toContain("!important");
  });

  it("wraps Tab's default styles in :where() to keep specificity at zero", () => {
    const styleBlock = tabSource.slice(tabSource.indexOf("<style"));
    expect(styleBlock).not.toMatch(/^\.stance-tab/m);
  });

  describe.each(themes)("axe: $name theme", (theme) => {
    it.each(modes)("no violations in %s mode", async (mode) => {
      const cleanup = withThemeStyle(theme);
      const { container } = renderHarness();
      const root = container.querySelector(".stance-tabs")!;
      root.setAttribute("data-theme", theme.name);
      if (mode === "dark") root.classList.add("dark");

      const results = await runAxe(root);
      expect(results).toHaveNoViolations();
      cleanup();
    });
  });
});
