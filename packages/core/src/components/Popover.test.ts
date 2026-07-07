/**
 * Manual checklist (verify by hand in the playground, in addition to the
 * automated checks below — jsdom doesn't run real layout, so floating-ui
 * positioning and native browser Tab-traversal can't be exercised here):
 *
 * 1. Open a non-modal popover — content appears anchored below the trigger,
 *    flips to stay in the viewport near an edge, and follows the trigger on
 *    scroll/resize.
 * 2. With a non-modal popover open, Tab out of its content into the rest of
 *    the page — that should work (nothing traps it), and the background
 *    should remain clickable/interactive the whole time.
 * 3. With a `modal` popover open, Tab should cycle within the content only,
 *    and the rest of the page should be inert (unreachable by mouse or
 *    keyboard), matching Dialog's behavior.
 * 4. Escape closes either kind and focus visibly returns to the trigger.
 * 5. Turn on a screen reader: the trigger should announce expanded/collapsed
 *    state as the popover opens and closes.
 */
import { defineComponent, h, nextTick, ref } from "vue";
import { render, screen } from "@testing-library/vue";
import { fireEvent } from "@testing-library/vue";
import { describe, expect, it } from "vitest";
import { allThemes, neutral } from "@stance/themes";
import { compileTheme } from "@stance/themes";
import Popover, { type PopoverProps } from "./Popover.vue";
import PopoverTrigger from "./PopoverTrigger.vue";
import PopoverContent from "./PopoverContent.vue";
import popoverContentSource from "./PopoverContent.vue?raw";
import { runAxe } from "../../tests/axe-matcher";

const themes = allThemes;
const modes = ["light", "dark"] as const;

function withThemeStyle(theme: (typeof themes)[number]) {
  const style = document.createElement("style");
  style.textContent = compileTheme(theme);
  document.head.appendChild(style);
  return () => style.remove();
}

/** A realistic harness: PopoverTrigger + PopoverContent with two focusable buttons inside. */
function renderHarness(popoverProps: Partial<PopoverProps> = {}) {
  const Harness = defineComponent({
    setup() {
      const open = ref(false);
      return () =>
        h(
          Popover,
          {
            modelValue: open.value,
            "onUpdate:modelValue": (v: boolean) => {
              open.value = v;
            },
            ...popoverProps,
          },
          {
            default: () => [
              h(PopoverTrigger, null, { default: () => "Open popover" }),
              h(PopoverContent, null, {
                default: () => [
                  h("button", { key: "first" }, "First"),
                  h("button", { key: "second" }, "Second"),
                ],
              }),
            ],
          },
        );
    },
  });
  return render(Harness);
}

describe("Popover", () => {
  it("renders no content when closed", () => {
    renderHarness();
    expect(screen.queryByText("First")).not.toBeInTheDocument();
  });

  it("opens on trigger click and wires aria-expanded/aria-controls", async () => {
    renderHarness();
    const trigger = screen.getByRole("button", { name: "Open popover" });
    expect(trigger).toHaveAttribute("aria-expanded", "false");
    expect(trigger).not.toHaveAttribute("aria-controls");

    await fireEvent.click(trigger);
    await nextTick();

    expect(trigger).toHaveAttribute("aria-expanded", "true");
    const controlsId = trigger.getAttribute("aria-controls");
    expect(controlsId).toBeTruthy();
    expect(document.getElementById(controlsId!)).toHaveTextContent("First");
  });

  it("moves focus into the content on open", async () => {
    renderHarness();
    await fireEvent.click(screen.getByRole("button", { name: "Open popover" }));
    await nextTick();
    expect(document.activeElement).toBe(screen.getByRole("button", { name: "First" }));
  });

  it("closes on Escape and returns focus to the trigger (non-modal)", async () => {
    renderHarness();
    const trigger = screen.getByRole("button", { name: "Open popover" });
    trigger.focus();
    await fireEvent.click(trigger);
    await nextTick();
    expect(screen.getByText("First")).toBeInTheDocument();

    await fireEvent.keyDown(document, { key: "Escape" });
    await nextTick();
    expect(screen.queryByText("First")).not.toBeInTheDocument();
    expect(document.activeElement).toBe(trigger);
  });

  it("does not trap Tab by default (non-modal)", async () => {
    renderHarness();
    await fireEvent.click(screen.getByRole("button", { name: "Open popover" }));
    await nextTick();

    const second = screen.getByRole("button", { name: "Second" });
    second.focus();
    await fireEvent.keyDown(second, { key: "Tab" });
    // Non-modal: our composable doesn't intercept Tab, so nothing wraps
    // focus back to "First" — it's left exactly where native Tab would pick
    // up (jsdom doesn't simulate the native move itself).
    expect(document.activeElement).toBe(second);
  });

  it("does not make the background inert by default (non-modal)", async () => {
    const outsideButton = document.createElement("button");
    outsideButton.textContent = "Outside";
    document.body.appendChild(outsideButton);

    renderHarness();
    await fireEvent.click(screen.getByRole("button", { name: "Open popover" }));
    await nextTick();
    expect(outsideButton.hasAttribute("inert")).toBe(false);

    outsideButton.remove();
  });

  it("traps Tab and makes the background inert when modal is true", async () => {
    const outsideButton = document.createElement("button");
    outsideButton.textContent = "Outside";
    document.body.appendChild(outsideButton);

    renderHarness({ modal: true });
    await fireEvent.click(screen.getByRole("button", { name: "Open popover" }));
    await nextTick();
    expect(outsideButton.hasAttribute("inert")).toBe(true);

    const first = screen.getByRole("button", { name: "First" });
    const second = screen.getByRole("button", { name: "Second" });
    expect(document.activeElement).toBe(first);

    second.focus();
    await fireEvent.keyDown(second, { key: "Tab" });
    expect(document.activeElement).toBe(first);

    await fireEvent.keyDown(first, { key: "Tab", shiftKey: true });
    expect(document.activeElement).toBe(second);

    await fireEvent.keyDown(document, { key: "Escape" });
    await nextTick();
    expect(outsideButton.hasAttribute("inert")).toBe(false);
    outsideButton.remove();
  });

  it("closes on an outside click by default, without self-closing from its own opening click", async () => {
    renderHarness();
    await fireEvent.click(screen.getByRole("button", { name: "Open popover" }));
    await nextTick();
    expect(screen.getByText("First")).toBeInTheDocument();

    await fireEvent.pointerDown(document.body);
    await nextTick();
    expect(screen.queryByText("First")).not.toBeInTheDocument();
  });

  it("does not close on an outside click when closeOnOutsideClick is false", async () => {
    renderHarness({ closeOnOutsideClick: false });
    await fireEvent.click(screen.getByRole("button", { name: "Open popover" }));
    await nextTick();

    await fireEvent.pointerDown(document.body);
    await nextTick();
    expect(screen.getByText("First")).toBeInTheDocument();
  });

  it("never emits !important in PopoverContent's styles", () => {
    expect(popoverContentSource).not.toContain("!important");
  });

  it("wraps PopoverContent's default styles in :where() to keep specificity at zero", () => {
    const styleBlock = popoverContentSource.slice(popoverContentSource.indexOf("<style"));
    expect(styleBlock).not.toMatch(/^\.stance-popover/m);
  });

  describe.each(themes)("axe: $name theme", (theme) => {
    it.each(modes)("no violations in %s mode (open, non-modal)", async (mode) => {
      const cleanup = withThemeStyle(theme);
      renderHarness();
      await fireEvent.click(screen.getByRole("button", { name: "Open popover" }));
      await nextTick();

      const contentEl = document.getElementById(
        screen.getByRole("button", { name: "Open popover" }).getAttribute("aria-controls")!,
      )!;
      contentEl.setAttribute("data-theme", theme.name);
      if (mode === "dark") contentEl.classList.add("dark");

      const results = await runAxe(contentEl.parentElement!);
      expect(results).toHaveNoViolations();
      cleanup();
    });
  });

  it("no axe violations while closed (aria-controls not left dangling)", async () => {
    const cleanup = withThemeStyle(neutral);
    const { container } = renderHarness();
    const results = await runAxe(container);
    expect(results).toHaveNoViolations();
    cleanup();
  });
});
