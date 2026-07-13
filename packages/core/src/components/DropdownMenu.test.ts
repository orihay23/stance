/**
 * Manual checklist (verify by hand in the playground, in addition to the
 * automated checks below — jsdom doesn't run real layout, so floating-ui
 * positioning can't be exercised here):
 *
 * 1. Click the trigger with a mouse — the menu opens, focus moves to the
 *    first item, and Tab can still leave the menu (it closes as soon as
 *    focus does).
 * 2. Focus the trigger and press Enter, Space, or ArrowDown — the menu
 *    opens with focus on the first item, and Tab now cycles within it
 *    instead of leaving.
 * 3. Press ArrowUp on the trigger — the menu opens with focus on the last
 *    item instead.
 * 4. With the menu open, use ArrowUp/ArrowDown/Home/End to move between
 *    items (wrapping at the ends), and type a few letters to jump to a
 *    matching item.
 * 5. Turn on a screen reader and open the menu — it should announce role
 *    "menu" and be labelled by the trigger's own text.
 */
import { defineComponent, h, nextTick, ref } from "vue";
import { render, screen } from "@testing-library/vue";
import { fireEvent } from "@testing-library/vue";
import { describe, expect, it, vi } from "vitest";
import DropdownMenu, { type DropdownMenuProps } from "./DropdownMenu.vue";
import DropdownMenuTrigger from "./DropdownMenuTrigger.vue";
import DropdownMenuContent from "./DropdownMenuContent.vue";
import DropdownMenuItem from "./DropdownMenuItem.vue";
import DropdownMenuSeparator from "./DropdownMenuSeparator.vue";
import dropdownMenuContentSource from "./DropdownMenuContent.vue?raw";
import { runAxe } from "../../tests/axe-matcher";
import { compactDensity, neutralPalette, palettes, withPaletteAndDensityStyle, withPaletteStyle } from "../../tests/theme-test-utils";

const modes = ["light", "dark"] as const;

function renderHarness(menuProps: Partial<DropdownMenuProps> = {}, onSelect: (label: string) => void = () => {}) {
  const Harness = defineComponent({
    setup() {
      const open = ref(false);
      return () =>
        h(
          DropdownMenu,
          {
            modelValue: open.value,
            "onUpdate:modelValue": (v: boolean) => {
              open.value = v;
            },
            ...menuProps,
          },
          {
            default: () => [
              h(DropdownMenuTrigger, null, { default: () => "Actions" }),
              h(DropdownMenuContent, null, {
                default: () => [
                  h(DropdownMenuItem, { key: "edit", onSelect: () => onSelect("Edit") }, { default: () => "Edit" }),
                  h(DropdownMenuItem, { key: "duplicate", onSelect: () => onSelect("Duplicate") }, { default: () => "Duplicate" }),
                  h(DropdownMenuSeparator, { key: "sep" }),
                  h(
                    DropdownMenuItem,
                    { key: "disabled", disabled: true, onSelect: () => onSelect("Disabled") },
                    { default: () => "Disabled item" },
                  ),
                  h(
                    DropdownMenuItem,
                    { key: "delete", variant: "destructive", onSelect: () => onSelect("Delete") },
                    { default: () => "Delete" },
                  ),
                ],
              }),
            ],
          },
        );
    },
  });
  return render(Harness);
}

describe("DropdownMenu", () => {
  it("renders no menu content when closed", () => {
    renderHarness();
    expect(screen.queryByRole("menu")).not.toBeInTheDocument();
  });

  it("opens on trigger click (mouse) and does not trap Tab", async () => {
    renderHarness();
    const trigger = screen.getByRole("button", { name: "Actions" });
    expect(trigger).toHaveAttribute("aria-expanded", "false");

    await fireEvent.click(trigger);
    await nextTick();
    expect(trigger).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByRole("menu")).toBeInTheDocument();
    expect(document.activeElement).toBe(screen.getByRole("menuitem", { name: "Edit" }));
  });

  it("opens on ArrowDown with focus on the first item and traps Tab", async () => {
    renderHarness();
    const trigger = screen.getByRole("button", { name: "Actions" });
    trigger.focus();
    await fireEvent.keyDown(trigger, { key: "ArrowDown" });
    await nextTick();

    const edit = screen.getByRole("menuitem", { name: "Edit" });
    expect(document.activeElement).toBe(edit);

    // Tab from the last enabled item wraps back to the first (trapped).
    const del = screen.getByRole("menuitem", { name: "Delete" });
    del.focus();
    await fireEvent.keyDown(del, { key: "Tab" });
    expect(document.activeElement).toBe(edit);
  });

  it("opens on ArrowUp with focus on the last item", async () => {
    renderHarness();
    const trigger = screen.getByRole("button", { name: "Actions" });
    trigger.focus();
    await fireEvent.keyDown(trigger, { key: "ArrowUp" });
    await nextTick();

    expect(document.activeElement).toBe(screen.getByRole("menuitem", { name: "Delete" }));
  });

  it("ArrowDown/ArrowUp cycle between items, skipping disabled ones", async () => {
    renderHarness();
    const trigger = screen.getByRole("button", { name: "Actions" });
    await fireEvent.click(trigger);
    await nextTick();

    const edit = screen.getByRole("menuitem", { name: "Edit" });
    const duplicate = screen.getByRole("menuitem", { name: "Duplicate" });
    const del = screen.getByRole("menuitem", { name: "Delete" });
    expect(document.activeElement).toBe(edit);

    await fireEvent.keyDown(edit, { key: "ArrowDown" });
    expect(document.activeElement).toBe(duplicate);

    // Skips the disabled item entirely.
    await fireEvent.keyDown(duplicate, { key: "ArrowDown" });
    expect(document.activeElement).toBe(del);

    // Wraps back to the first.
    await fireEvent.keyDown(del, { key: "ArrowDown" });
    expect(document.activeElement).toBe(edit);
  });

  it("Home/End jump to the first/last item", async () => {
    renderHarness();
    const trigger = screen.getByRole("button", { name: "Actions" });
    await fireEvent.click(trigger);
    await nextTick();

    const edit = screen.getByRole("menuitem", { name: "Edit" });
    await fireEvent.keyDown(edit, { key: "End" });
    expect(document.activeElement).toBe(screen.getByRole("menuitem", { name: "Delete" }));

    await fireEvent.keyDown(document.activeElement!, { key: "Home" });
    expect(document.activeElement).toBe(edit);
  });

  it("typeahead jumps to the item matching the typed character", async () => {
    renderHarness();
    const trigger = screen.getByRole("button", { name: "Actions" });
    await fireEvent.click(trigger);
    await nextTick();

    const edit = screen.getByRole("menuitem", { name: "Edit" });
    await fireEvent.keyDown(edit, { key: "d" });
    expect(document.activeElement).toBe(screen.getByRole("menuitem", { name: "Duplicate" }));
  });

  it("Enter/Space and click activate an item, emit select, and close the menu", async () => {
    const onSelect = vi.fn();
    renderHarness({}, onSelect);
    const trigger = screen.getByRole("button", { name: "Actions" });
    await fireEvent.click(trigger);
    await nextTick();

    const duplicate = screen.getByRole("menuitem", { name: "Duplicate" });
    await fireEvent.keyDown(duplicate, { key: "Enter" });
    await nextTick();
    expect(onSelect).toHaveBeenCalledWith("Duplicate");
    expect(screen.queryByRole("menu")).not.toBeInTheDocument();
  });

  it("does not activate a disabled item", async () => {
    const onSelect = vi.fn();
    renderHarness({}, onSelect);
    const trigger = screen.getByRole("button", { name: "Actions" });
    await fireEvent.click(trigger);
    await nextTick();

    const disabled = screen.getByRole("menuitem", { name: "Disabled item" });
    await fireEvent.click(disabled);
    await nextTick();
    expect(onSelect).not.toHaveBeenCalled();
    expect(screen.getByRole("menu")).toBeInTheDocument();
  });

  it("with href, renders an <a> and activates via click, Enter, and Space alike", async () => {
    const onSelect = vi.fn();
    render(
      defineComponent({
        setup() {
          const open = ref(false);
          return () =>
            h(DropdownMenu, { modelValue: open.value, "onUpdate:modelValue": (v: boolean) => (open.value = v) }, {
              default: () => [
                h(DropdownMenuTrigger, null, { default: () => "Actions" }),
                h(DropdownMenuContent, null, {
                  default: () => [
                    h(DropdownMenuItem, { href: "/settings", onSelect: () => onSelect("Settings") }, { default: () => "Settings" }),
                  ],
                }),
              ],
            });
        },
      }),
    );
    const trigger = screen.getByRole("button", { name: "Actions" });
    await fireEvent.click(trigger);
    await nextTick();

    const link = screen.getByRole("menuitem", { name: "Settings" });
    expect(link.tagName).toBe("A");
    expect(link).toHaveAttribute("href", "/settings");

    await fireEvent.keyDown(link, { key: " " });
    await nextTick();
    expect(onSelect).toHaveBeenCalledWith("Settings");
    expect(screen.queryByRole("menu")).not.toBeInTheDocument();
  });

  it("with href and disabled, omits the href attribute so it can't be followed by mouse", () => {
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    render(
      h(DropdownMenuItem, { href: "/settings", disabled: true }, { default: () => "Settings" }),
    );
    expect(screen.getByRole("menuitem", { name: "Settings" })).not.toHaveAttribute("href");
    errorSpy.mockRestore();
  });

  it("closes on Escape and returns focus to the trigger", async () => {
    renderHarness();
    const trigger = screen.getByRole("button", { name: "Actions" });
    trigger.focus();
    await fireEvent.click(trigger);
    await nextTick();
    expect(screen.getByRole("menu")).toBeInTheDocument();

    await fireEvent.keyDown(document, { key: "Escape" });
    await nextTick();
    expect(screen.queryByRole("menu")).not.toBeInTheDocument();
    expect(document.activeElement).toBe(trigger);
  });

  it("closes on an outside click", async () => {
    renderHarness();
    const trigger = screen.getByRole("button", { name: "Actions" });
    await fireEvent.click(trigger);
    await nextTick();
    expect(screen.getByRole("menu")).toBeInTheDocument();

    await fireEvent.pointerDown(document.body);
    await nextTick();
    expect(screen.queryByRole("menu")).not.toBeInTheDocument();
  });

  it("wires aria-labelledby on the menu to the trigger", async () => {
    renderHarness();
    const trigger = screen.getByRole("button", { name: "Actions" });
    await fireEvent.click(trigger);
    await nextTick();

    const menu = screen.getByRole("menu");
    expect(menu.getAttribute("aria-labelledby")).toBe(trigger.id);
  });

  it("never emits !important in DropdownMenuContent's styles", () => {
    expect(dropdownMenuContentSource).not.toContain("!important");
  });

  it("wraps DropdownMenuContent's default styles in :where() to keep specificity at zero", () => {
    const styleBlock = dropdownMenuContentSource.slice(dropdownMenuContentSource.indexOf("<style"));
    expect(styleBlock).not.toMatch(/^\.stance-dropdown-menu/m);
  });

  describe.each(palettes)("axe: $name palette", (palette) => {
    it.each(modes)("no violations in %s mode (open)", async (mode) => {
      const cleanup = withPaletteStyle(palette);
      renderHarness();
      const trigger = screen.getByRole("button", { name: "Actions" });
      await fireEvent.click(trigger);
      await nextTick();

      const menu = screen.getByRole("menu");
      menu.setAttribute("data-theme-palette", palette.name);
      if (mode === "dark") menu.classList.add("dark");

      const results = await runAxe(menu.parentElement!);
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
    renderHarness();
    const trigger = screen.getByRole("button", { name: "Actions" });
    await fireEvent.click(trigger);
    await nextTick();

    const menu = screen.getByRole("menu");
    menu.setAttribute("data-theme-palette", "neutral");
    menu.setAttribute("data-theme-density", "compact");
    if (mode === "dark") menu.classList.add("dark");

    const results = await runAxe(menu.parentElement!);
    expect(results).toHaveNoViolations();
    cleanup();
  });
});
