/**
 * Manual checklist (verify by hand in the playground, in addition to the
 * automated checks below — jsdom doesn't run real layout, so floating-ui
 * positioning and the width-matching in ComboboxContent can't be exercised
 * here):
 *
 * 1. Focus the input — the popup opens showing all currently-rendered
 *    options, with none highlighted.
 * 2. Type a few characters — the popup stays open, DOM focus never leaves
 *    the input, and (since Combobox doesn't filter its own options) only
 *    whatever the harness itself narrows down actually disappears.
 * 3. Press ArrowDown/ArrowUp repeatedly — the highlight moves through
 *    options, wraps at the ends, and skips the disabled one, while the
 *    text cursor still responds normally to Home/End (unaffected by
 *    listbox navigation).
 * 4. Press Enter on a highlighted option — it's selected, the input fills
 *    with its label (single-select) or the popup stays open and the input
 *    clears (multi-select).
 * 5. Turn on a screen reader: focusing the input announces "combobox",
 *    arrowing through options announces each one via
 *    aria-activedescendant, and selecting a multi-select option announces
 *    "X added/removed. N selected."
 */
import { defineComponent, h, nextTick, reactive } from "vue";
import { render, screen, within } from "@testing-library/vue";
import { fireEvent } from "@testing-library/vue";
import { describe, expect, it, vi } from "vitest";
import { allThemes } from "@stance/themes";
import { compileTheme } from "@stance/themes";
import Combobox, { type ComboboxProps } from "./Combobox.vue";
import ComboboxInput from "./ComboboxInput.vue";
import ComboboxContent from "./ComboboxContent.vue";
import ComboboxOption from "./ComboboxOption.vue";
import comboboxContentSource from "./ComboboxContent.vue?raw";
import comboboxOptionSource from "./ComboboxOption.vue?raw";
import { runAxe } from "../../tests/axe-matcher";

const themes = allThemes;
const modes = ["light", "dark"] as const;

const FRUITS = ["Apple", "Banana", "Cherry"] as const;

function withThemeStyle(theme: (typeof themes)[number]) {
  const style = document.createElement("style");
  style.textContent = compileTheme(theme);
  document.head.appendChild(style);
  return () => style.remove();
}

function renderHarness(comboboxProps: Partial<ComboboxProps> = {}) {
  const Harness = defineComponent({
    setup() {
      const state = reactive({
        selected: comboboxProps.modelValue as string | string[] | undefined,
        query: comboboxProps.inputValue ?? "",
      });
      return () => {
        const filtered = FRUITS.filter((f) => f.toLowerCase().includes(state.query.toLowerCase()));
        return h(
          Combobox,
          {
            ...comboboxProps,
            modelValue: state.selected,
            "onUpdate:modelValue": (v: string | string[] | undefined) => {
              state.selected = v;
            },
            inputValue: state.query,
            "onUpdate:inputValue": (v: string) => {
              state.query = v;
            },
          },
          {
            default: () => [
              h(ComboboxInput, { placeholder: "Search fruit", "aria-label": "Fruit" }),
              h(ComboboxContent, null, {
                default: () =>
                  filtered.map((fruit) =>
                    h(ComboboxOption, { key: fruit, value: fruit, disabled: fruit === "Cherry" }, { default: () => fruit }),
                  ),
              }),
            ],
          },
        );
      };
    },
  });
  return render(Harness);
}

describe("Combobox", () => {
  it("renders no listbox when closed", () => {
    renderHarness();
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
  });

  it("opens on focus, showing the currently-rendered options", async () => {
    renderHarness();
    const input = screen.getByRole("combobox");
    input.focus();
    await nextTick();
    await nextTick();

    expect(input).toHaveAttribute("aria-expanded", "true");
    const listbox = screen.getByRole("listbox");
    expect(within(listbox).getAllByRole("option")).toHaveLength(3);
  });

  it("typing updates v-model:inputValue, and the consumer's own filtering narrows the rendered options", async () => {
    renderHarness();
    const input = screen.getByRole("combobox");
    input.focus();
    await nextTick();
    await nextTick();
    await fireEvent.update(input, "ba");
    await nextTick();

    expect(input).toHaveValue("ba");
    const listbox = screen.getByRole("listbox");
    const options = within(listbox).getAllByRole("option");
    expect(options).toHaveLength(1);
    expect(options[0]).toHaveTextContent("Banana");
  });

  it("shows the empty slot when filtering narrows to zero options — not when the slot is merely provided", async () => {
    renderHarness();
    const input = screen.getByRole("combobox");
    input.focus();
    await nextTick();
    await nextTick();
    await fireEvent.update(input, "zzz");
    await nextTick();

    expect(screen.queryAllByRole("option")).toHaveLength(0);
    expect(screen.getByText("No options.")).toBeInTheDocument();
  });

  it("ArrowDown on a closed input opens it and highlights the first option; ArrowUp highlights the last", async () => {
    renderHarness();
    const input = screen.getByRole("combobox");
    input.focus();
    await nextTick();
    await nextTick(); // let the popup's dismiss listener register before the Escape below
    await fireEvent.keyDown(input, { key: "Escape" }); // close what focus() already opened, to test from a closed state
    await nextTick();
    expect(input).toHaveAttribute("aria-expanded", "false");

    await fireEvent.keyDown(input, { key: "ArrowDown" });
    await nextTick();
    let apple = screen.getByRole("option", { name: "Apple" });
    expect(input.getAttribute("aria-activedescendant")).toBe(apple.id);

    await fireEvent.keyDown(input, { key: "Escape" });
    await fireEvent.keyDown(input, { key: "ArrowUp" });
    await nextTick();
    const banana = screen.getByRole("option", { name: "Banana" }); // "Cherry" is disabled, so ArrowUp's "last" skips to Banana
    expect(input.getAttribute("aria-activedescendant")).toBe(banana.id);
    apple = screen.getByRole("option", { name: "Apple" });
    expect(apple).toBeInTheDocument();
  });

  it("ArrowDown/ArrowUp move the highlight, wrap, and skip the disabled option", async () => {
    renderHarness();
    const input = screen.getByRole("combobox");
    input.focus();
    await nextTick();
    await nextTick();

    await fireEvent.keyDown(input, { key: "ArrowDown" });
    expect(input.getAttribute("aria-activedescendant")).toBe(screen.getByRole("option", { name: "Apple" }).id);

    await fireEvent.keyDown(input, { key: "ArrowDown" });
    expect(input.getAttribute("aria-activedescendant")).toBe(screen.getByRole("option", { name: "Banana" }).id);

    // "Cherry" is disabled — ArrowDown skips it and wraps back to Apple.
    await fireEvent.keyDown(input, { key: "ArrowDown" });
    expect(input.getAttribute("aria-activedescendant")).toBe(screen.getByRole("option", { name: "Apple" }).id);
  });

  it("Enter commits the highlighted option: sets modelValue, fills the input with its label, and closes the popup", async () => {
    renderHarness();
    const input = screen.getByRole("combobox") as HTMLInputElement;
    input.focus();
    await nextTick();
    await nextTick();
    await fireEvent.keyDown(input, { key: "ArrowDown" });
    await fireEvent.keyDown(input, { key: "Enter" });
    await nextTick();

    expect(input.value).toBe("Apple");
    expect(input).toHaveAttribute("aria-expanded", "false");
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
  });

  it("clicking an option selects it without the input ever losing focus (mousedown is prevented)", async () => {
    renderHarness();
    const input = screen.getByRole("combobox") as HTMLInputElement;
    input.focus();
    await nextTick();
    await nextTick();
    const banana = screen.getByRole("option", { name: "Banana" });

    await fireEvent.mouseDown(banana);
    expect(document.activeElement).toBe(input); // mousedown.prevent kept focus on the input

    await fireEvent.click(banana);
    await nextTick();
    expect(input.value).toBe("Banana");
  });

  it("a disabled option cannot be selected via click or Enter", async () => {
    renderHarness();
    const input = screen.getByRole("combobox") as HTMLInputElement;
    input.focus();
    await nextTick();
    await nextTick();
    const cherry = screen.getByRole("option", { name: "Cherry" });
    expect(cherry).toHaveAttribute("aria-disabled", "true");

    await fireEvent.click(cherry);
    await nextTick();
    expect(input.value).toBe("");
    expect(screen.getByRole("listbox")).toBeInTheDocument(); // still open — nothing committed
  });

  it("multi-select: selecting toggles values into an array, keeps the popup open, and clears the input", async () => {
    renderHarness({ multiple: true });
    const input = screen.getByRole("combobox") as HTMLInputElement;
    input.focus();
    await nextTick();
    await nextTick();
    await fireEvent.update(input, "a"); // narrows to Apple/Banana in the harness's own filter
    await nextTick();

    const apple = screen.getByRole("option", { name: "Apple" });
    await fireEvent.click(apple);
    await nextTick();

    expect(input.value).toBe(""); // cleared for the next filter term
    expect(screen.getByRole("listbox")).toBeInTheDocument(); // stays open
    expect(screen.getByRole("listbox")).toHaveAttribute("aria-multiselectable", "true");

    await fireEvent.update(input, "a");
    await nextTick();
    expect(screen.getByRole("option", { name: "Apple" })).toHaveAttribute("aria-selected", "true");
  });

  it("multi-select: re-selecting an already-selected option removes it", async () => {
    renderHarness({ multiple: true });
    const input = screen.getByRole("combobox") as HTMLInputElement;
    input.focus();
    await nextTick();
    await nextTick();
    const apple = screen.getByRole("option", { name: "Apple" });

    await fireEvent.click(apple);
    await nextTick();
    expect(screen.getByRole("option", { name: "Apple" })).toHaveAttribute("aria-selected", "true");

    await fireEvent.click(screen.getByRole("option", { name: "Apple" }));
    await nextTick();
    expect(screen.getByRole("option", { name: "Apple" })).toHaveAttribute("aria-selected", "false");
  });

  it("first Escape clears non-empty input text and keeps the popup open; a second Escape closes it", async () => {
    renderHarness();
    const input = screen.getByRole("combobox") as HTMLInputElement;
    input.focus();
    await nextTick();
    await nextTick();
    await fireEvent.update(input, "ap");
    await nextTick();
    expect(input.value).toBe("ap");

    await fireEvent.keyDown(input, { key: "Escape" });
    await nextTick();
    expect(input.value).toBe("");
    expect(screen.getByRole("listbox")).toBeInTheDocument();

    await fireEvent.keyDown(input, { key: "Escape" });
    await nextTick();
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
  });

  it("closes on an outside click", async () => {
    renderHarness();
    const input = screen.getByRole("combobox");
    input.focus();
    await nextTick();
    await nextTick();
    expect(screen.getByRole("listbox")).toBeInTheDocument();

    await fireEvent.pointerDown(document.body);
    await nextTick();
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
  });

  it("wires role=combobox/listbox/option and aria-selected/aria-disabled correctly", async () => {
    renderHarness({ modelValue: "Banana" });
    const input = screen.getByRole("combobox");
    input.focus();
    await nextTick();
    await nextTick();

    expect(screen.getByRole("listbox")).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "Banana" })).toHaveAttribute("aria-selected", "true");
    expect(screen.getByRole("option", { name: "Apple" })).toHaveAttribute("aria-selected", "false");
  });

  it("shows the loading slot instead of options while loading", async () => {
    render(
      defineComponent({
        setup() {
          return () =>
            h(Combobox, { modelValue: undefined }, {
              default: () => [
                h(ComboboxInput, { "aria-label": "Fruit" }),
                h(ComboboxContent, { loading: true }, { default: () => [h(ComboboxOption, { value: "Apple" }, () => "Apple")] }),
              ],
            });
        },
      }),
    );
    const input = screen.getByRole("combobox");
    input.focus();
    await nextTick();
    await nextTick();
    expect(screen.getByText("Loading…")).toBeInTheDocument();
    expect(screen.queryByRole("option")).not.toBeInTheDocument();
  });

  it("shows the error slot instead of options, taking priority over loading", async () => {
    render(
      defineComponent({
        setup() {
          return () =>
            h(Combobox, { modelValue: undefined }, {
              default: () => [
                h(ComboboxInput, { "aria-label": "Fruit" }),
                h(
                  ComboboxContent,
                  { loading: true, error: "Search failed" },
                  { default: () => [h(ComboboxOption, { value: "Apple" }, () => "Apple")] },
                ),
              ],
            });
        },
      }),
    );
    const input = screen.getByRole("combobox");
    input.focus();
    await nextTick();
    await nextTick();
    expect(screen.getByRole("alert")).toHaveTextContent("Search failed");
    expect(screen.getByRole("alert")).toHaveClass("stance-combobox__status--error");
    expect(screen.queryByText("Loading…")).not.toBeInTheDocument();
    expect(screen.queryByRole("option")).not.toBeInTheDocument();
  });

  it("never emits !important in Combobox's styles", () => {
    expect(comboboxContentSource).not.toContain("!important");
    expect(comboboxOptionSource).not.toContain("!important");
  });

  it("wraps Combobox's default styles in :where() to keep specificity at zero", () => {
    for (const source of [comboboxContentSource, comboboxOptionSource]) {
      const styleBlock = source.slice(source.indexOf("<style"));
      expect(styleBlock).not.toMatch(/^\.stance-combobox/m);
    }
  });

  describe.each(themes)("axe: $name theme", (theme) => {
    it.each(modes)("no violations in %s mode (open)", async (mode) => {
      const cleanup = withThemeStyle(theme);
      renderHarness();
      const input = screen.getByRole("combobox");
      input.focus();
      await nextTick();
    await nextTick();

      const listbox = screen.getByRole("listbox");
      listbox.setAttribute("data-theme", theme.name);
      if (mode === "dark") listbox.classList.add("dark");

      const results = await runAxe(listbox.parentElement!);
      expect(results).toHaveNoViolations();
      cleanup();
    });
  });
});
