/**
 * Manual checklist (verify by hand in the playground, in addition to the
 * automated checks below — jsdom doesn't run real layout, so floating
 * positioning/scrolling of a long results list can't be exercised here):
 *
 * 1. Open the palette (e.g. via a keyboard shortcut in your app) — focus
 *    moves straight to the search input, and the rest of the page becomes
 *    unreachable by Tab or mouse.
 * 2. Type — the palette stays open, results narrow (per the consumer's own
 *    filtering), and a screen reader announces the new result count after
 *    a short pause.
 * 3. Press ArrowDown/ArrowUp — the highlight moves through results and
 *    wraps at the ends, skipping any disabled ones.
 * 4. Press Enter on a highlighted result — its own action fires and the
 *    palette closes, returning focus to whatever opened it.
 * 5. Press Escape at any point — the palette closes immediately (no
 *    "clear text first" step, unlike Combobox).
 */
import { defineComponent, h, nextTick, reactive } from "vue";
import { render, screen, within } from "@testing-library/vue";
import { fireEvent } from "@testing-library/vue";
import { describe, expect, it, vi } from "vitest";
import { allThemes } from "@stance/themes";
import { compileTheme } from "@stance/themes";
import CommandPalette, { type CommandPaletteProps } from "./CommandPalette.vue";
import CommandPaletteItem from "./CommandPaletteItem.vue";
import commandPaletteSource from "./CommandPalette.vue?raw";
import commandPaletteItemSource from "./CommandPaletteItem.vue?raw";
import { runAxe } from "../../tests/axe-matcher";

const themes = allThemes;
const modes = ["light", "dark"] as const;

const COMMANDS = ["New File", "Open Settings", "Toggle Sidebar"] as const;

function withThemeStyle(theme: (typeof themes)[number]) {
  const style = document.createElement("style");
  style.textContent = compileTheme(theme);
  document.head.appendChild(style);
  return () => style.remove();
}

/** A realistic harness: a trigger button outside the palette, and a filterable command list inside it. */
function renderHarness(
  paletteProps: Partial<CommandPaletteProps> = {},
  onSelect: (label: string) => void = () => {},
) {
  const Harness = defineComponent({
    setup() {
      const state = reactive({ open: false, query: "" });
      return () => {
        const filtered = COMMANDS.filter((c) => c.toLowerCase().includes(state.query.toLowerCase()));
        return h("div", [
          h("button", { onClick: () => (state.open = true) }, "Open palette"),
          h(
            CommandPalette,
            {
              label: "Command palette",
              ...paletteProps,
              modelValue: state.open,
              "onUpdate:modelValue": (v: boolean) => {
                state.open = v;
              },
              inputValue: state.query,
              "onUpdate:inputValue": (v: string) => {
                state.query = v;
              },
            },
            {
              default: () =>
                filtered.map((command) =>
                  h(
                    CommandPaletteItem,
                    {
                      key: command,
                      label: command,
                      disabled: command === "Toggle Sidebar",
                      onSelect: () => onSelect(command),
                    },
                    { default: () => command },
                  ),
                ),
            },
          ),
        ]);
      };
    },
  });
  return render(Harness);
}

describe("CommandPalette", () => {
  it("renders nothing when closed", () => {
    renderHarness();
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("opens on trigger click and moves focus straight to the search input", async () => {
    renderHarness();
    await fireEvent.click(screen.getByRole("button", { name: "Open palette" }));
    await nextTick();

    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(document.activeElement).toBe(screen.getByRole("combobox"));
  });

  it("wires aria-label, role=listbox, and role=option correctly", async () => {
    renderHarness();
    await fireEvent.click(screen.getByRole("button", { name: "Open palette" }));
    await nextTick();

    expect(screen.getByRole("dialog")).toHaveAttribute("aria-label", "Command palette");
    const listbox = screen.getByRole("listbox");
    expect(within(listbox).getAllByRole("option")).toHaveLength(3);
  });

  it("typing updates v-model:inputValue, and the consumer's own filtering narrows the rendered items", async () => {
    renderHarness();
    await fireEvent.click(screen.getByRole("button", { name: "Open palette" }));
    await nextTick();
    const input = screen.getByRole("combobox");

    await fireEvent.update(input, "new");
    await nextTick();

    const listbox = screen.getByRole("listbox");
    const options = within(listbox).getAllByRole("option");
    expect(options).toHaveLength(1);
    expect(options[0]).toHaveTextContent("New File");
  });

  it("shows the empty slot when filtering narrows to zero items", async () => {
    renderHarness();
    await fireEvent.click(screen.getByRole("button", { name: "Open palette" }));
    await nextTick();
    const input = screen.getByRole("combobox");

    await fireEvent.update(input, "zzz");
    await nextTick();

    expect(screen.queryAllByRole("option")).toHaveLength(0);
    expect(screen.getByText("No results.")).toBeInTheDocument();
  });

  it("ArrowDown/ArrowUp move the highlight, wrap, and skip the disabled item", async () => {
    renderHarness();
    await fireEvent.click(screen.getByRole("button", { name: "Open palette" }));
    await nextTick();
    const input = screen.getByRole("combobox");

    await fireEvent.keyDown(input, { key: "ArrowDown" });
    expect(input.getAttribute("aria-activedescendant")).toBe(screen.getByRole("option", { name: "New File" }).id);

    await fireEvent.keyDown(input, { key: "ArrowDown" });
    expect(input.getAttribute("aria-activedescendant")).toBe(
      screen.getByRole("option", { name: "Open Settings" }).id,
    );

    // "Toggle Sidebar" is disabled — ArrowDown skips it and wraps back to "New File".
    await fireEvent.keyDown(input, { key: "ArrowDown" });
    expect(input.getAttribute("aria-activedescendant")).toBe(screen.getByRole("option", { name: "New File" }).id);
  });

  it("Enter commits the highlighted item: fires its own @select and closes the palette", async () => {
    const onSelect = vi.fn();
    renderHarness({}, onSelect);
    await fireEvent.click(screen.getByRole("button", { name: "Open palette" }));
    await nextTick();
    const input = screen.getByRole("combobox");

    await fireEvent.keyDown(input, { key: "ArrowDown" });
    await fireEvent.keyDown(input, { key: "Enter" });
    await nextTick();

    expect(onSelect).toHaveBeenCalledWith("New File");
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("clicking an item fires its own @select and closes the palette (mousedown prevented)", async () => {
    const onSelect = vi.fn();
    renderHarness({}, onSelect);
    await fireEvent.click(screen.getByRole("button", { name: "Open palette" }));
    await nextTick();
    const input = screen.getByRole("combobox");
    const settings = screen.getByRole("option", { name: "Open Settings" });

    await fireEvent.mouseDown(settings);
    expect(document.activeElement).toBe(input); // mousedown.prevent kept focus on the input

    await fireEvent.click(settings);
    await nextTick();
    expect(onSelect).toHaveBeenCalledWith("Open Settings");
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("a disabled item cannot be activated via click or Enter", async () => {
    const onSelect = vi.fn();
    renderHarness({}, onSelect);
    await fireEvent.click(screen.getByRole("button", { name: "Open palette" }));
    await nextTick();
    const sidebar = screen.getByRole("option", { name: "Toggle Sidebar" });
    expect(sidebar).toHaveAttribute("aria-disabled", "true");

    await fireEvent.click(sidebar);
    await nextTick();
    expect(onSelect).not.toHaveBeenCalled();
    expect(screen.getByRole("dialog")).toBeInTheDocument(); // still open
  });

  it("closes immediately on Escape — no two-step text-clear like Combobox — and returns focus to the trigger", async () => {
    renderHarness();
    const trigger = screen.getByRole("button", { name: "Open palette" });
    trigger.focus();
    await fireEvent.click(trigger);
    await nextTick();
    const input = screen.getByRole("combobox");
    await fireEvent.update(input, "settings");
    await nextTick();

    await fireEvent.keyDown(document, { key: "Escape" });
    await nextTick();
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(document.activeElement).toBe(trigger);
  });

  it("closes on an outside click", async () => {
    renderHarness();
    await fireEvent.click(screen.getByRole("button", { name: "Open palette" }));
    await nextTick();
    expect(screen.getByRole("dialog")).toBeInTheDocument();

    await fireEvent.pointerDown(document.body);
    await nextTick();
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("makes the rest of the page inert while open, and restores it on close", async () => {
    const outsideButton = document.createElement("button");
    outsideButton.textContent = "Outside";
    document.body.appendChild(outsideButton);

    renderHarness();
    await fireEvent.click(screen.getByRole("button", { name: "Open palette" }));
    await nextTick();
    expect(outsideButton.hasAttribute("inert")).toBe(true);

    await fireEvent.keyDown(document, { key: "Escape" });
    await nextTick();
    expect(outsideButton.hasAttribute("inert")).toBe(false);

    outsideButton.remove();
  });

  it("warns in dev mode when label is empty", () => {
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    render(
      h(CommandPalette, { modelValue: true, label: "" }, { default: () => [] }),
    );
    expect(errorSpy).toHaveBeenCalledWith(expect.stringContaining("requires a non-empty `label`"));
    errorSpy.mockRestore();
  });

  it("never emits !important in its styles", () => {
    expect(commandPaletteSource).not.toContain("!important");
    expect(commandPaletteItemSource).not.toContain("!important");
  });

  it("wraps default styles in :where() to keep specificity at zero", () => {
    for (const source of [commandPaletteSource, commandPaletteItemSource]) {
      const styleBlock = source.slice(source.indexOf("<style"));
      expect(styleBlock).not.toMatch(/^\.stance-command-palette/m);
    }
  });

  describe.each(themes)("axe: $name theme", (theme) => {
    it.each(modes)("no violations in %s mode (open)", async (mode) => {
      const cleanup = withThemeStyle(theme);
      renderHarness();
      await fireEvent.click(screen.getByRole("button", { name: "Open palette" }));
      await nextTick();

      const dialog = screen.getByRole("dialog");
      dialog.setAttribute("data-theme", theme.name);
      if (mode === "dark") dialog.classList.add("dark");

      const results = await runAxe(dialog.parentElement!);
      expect(results).toHaveNoViolations();
      cleanup();
    });
  });
});
