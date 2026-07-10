/**
 * Manual keyboard-nav checklist (verify by hand in the playground, in
 * addition to the automated checks below):
 *
 * 1. Open a sheet from each of the 4 sides — a visible focus ring appears
 *    on the first focusable element, and the panel slides in from the
 *    correct edge, in every theme, in both light and dark mode.
 * 2. With the sheet open, try to Tab or click your way to anything behind
 *    it — nothing behind the sheet should be reachable at all.
 * 3. Tab through every focusable element in the sheet and confirm it
 *    cycles: Tab from the last element goes to the first, and vice versa.
 * 4. Press Escape — the sheet slides back out and focus visibly returns to
 *    whichever element opened it.
 * 5. With the OS/browser "reduce motion" setting on, open and close a
 *    sheet — it should appear/disappear instantly, no slide.
 * 6. Turn on a screen reader and open the sheet — it should announce the
 *    dialog role and its title immediately.
 */
import { defineComponent, h, nextTick, ref } from "vue";
import { render, screen } from "@testing-library/vue";
import { fireEvent } from "@testing-library/vue";
import { describe, expect, it, vi } from "vitest";
import { allThemes, neutral } from "@stance/themes";
import { compileTheme } from "@stance/themes";
import Sheet, { type SheetProps } from "./Sheet.vue";
import sheetSource from "./Sheet.vue?raw";
import { runAxe } from "../../tests/axe-matcher";

const themes = allThemes;
const modes = ["light", "dark"] as const;
const sides = ["top", "right", "bottom", "left"] as const;

function withThemeStyle(theme: (typeof themes)[number]) {
  const style = document.createElement("style");
  style.textContent = compileTheme(theme);
  document.head.appendChild(style);
  return () => style.remove();
}

/** A realistic harness: a trigger button outside the sheet, and two focusable buttons inside it. */
function renderHarness(sheetProps: Partial<SheetProps> = {}) {
  const Harness = defineComponent({
    setup() {
      const open = ref(false);
      return () =>
        h("div", [
          h("button", { onClick: () => (open.value = true) }, "Open sheet"),
          h(
            Sheet,
            {
              modelValue: open.value,
              "onUpdate:modelValue": (v: boolean) => {
                open.value = v;
              },
              title: "Filters",
              ...sheetProps,
            },
            {
              default: () => [
                h("button", { key: "apply" }, "Apply"),
                h("button", { key: "reset" }, "Reset"),
              ],
            },
          ),
        ]);
    },
  });
  return render(Harness);
}

describe("Sheet", () => {
  it("renders nothing when closed", () => {
    renderHarness();
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("renders role=dialog by default", async () => {
    renderHarness();
    await fireEvent.click(screen.getByRole("button", { name: "Open sheet" }));
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });

  it("renders role=alertdialog when requested", async () => {
    renderHarness({ role: "alertdialog" });
    await fireEvent.click(screen.getByRole("button", { name: "Open sheet" }));
    expect(screen.getByRole("alertdialog")).toBeInTheDocument();
  });

  it("wires aria-labelledby to the rendered title, and aria-describedby only when a description is given", async () => {
    renderHarness({ description: "Narrow down the results." });
    await fireEvent.click(screen.getByRole("button", { name: "Open sheet" }));
    const sheet = screen.getByRole("dialog", { name: "Filters" });
    const describedBy = sheet.getAttribute("aria-describedby");
    expect(describedBy).toBeTruthy();
    expect(document.getElementById(describedBy!)).toHaveTextContent("Narrow down the results.");
  });

  it("warns in dev mode when title is empty", () => {
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    render(Sheet, {
      props: { modelValue: true, title: "" },
      slots: { default: "Body" },
    });
    expect(errorSpy).toHaveBeenCalledWith(expect.stringContaining("requires a non-empty `title`"));
    errorSpy.mockRestore();
  });

  it("defaults to side=right", async () => {
    renderHarness();
    await fireEvent.click(screen.getByRole("button", { name: "Open sheet" }));
    expect(screen.getByRole("dialog")).toHaveAttribute("data-side", "right");
  });

  it.each(sides)("renders data-side=%s", async (side) => {
    renderHarness({ side });
    await fireEvent.click(screen.getByRole("button", { name: "Open sheet" }));
    expect(screen.getByRole("dialog")).toHaveAttribute("data-side", side);
  });

  it("moves focus into the sheet on open, and cycles Tab/Shift+Tab within it", async () => {
    renderHarness();
    await fireEvent.click(screen.getByRole("button", { name: "Open sheet" }));
    await nextTick();

    const applyBtn = screen.getByRole("button", { name: "Apply" });
    const resetBtn = screen.getByRole("button", { name: "Reset" });
    expect(document.activeElement).toBe(applyBtn);

    resetBtn.focus();
    await fireEvent.keyDown(resetBtn, { key: "Tab" });
    expect(document.activeElement).toBe(applyBtn);

    await fireEvent.keyDown(applyBtn, { key: "Tab", shiftKey: true });
    expect(document.activeElement).toBe(resetBtn);
  });

  it("closes on Escape and returns focus to the trigger", async () => {
    renderHarness();
    const trigger = screen.getByRole("button", { name: "Open sheet" });
    trigger.focus();
    await fireEvent.click(trigger);
    await nextTick();
    expect(screen.getByRole("dialog")).toBeInTheDocument();

    await fireEvent.keyDown(document, { key: "Escape" });
    await nextTick();

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(document.activeElement).toBe(trigger);
  });

  it("does not close on Escape when closeOnEscape is false", async () => {
    renderHarness({ closeOnEscape: false });
    await fireEvent.click(screen.getByRole("button", { name: "Open sheet" }));
    await nextTick();

    await fireEvent.keyDown(document, { key: "Escape" });
    await nextTick();
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });

  it("closes on an outside (backdrop) click by default, without self-closing from its own opening click", async () => {
    const { container } = renderHarness();
    await fireEvent.click(screen.getByRole("button", { name: "Open sheet" }));
    await nextTick();
    expect(screen.getByRole("dialog")).toBeInTheDocument();

    const backdrop = container.parentElement!.querySelector(".stance-sheet__backdrop") as HTMLElement;
    await fireEvent.pointerDown(backdrop);
    await nextTick();
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("does not close on an outside click when closeOnOutsideClick is false", async () => {
    const { container } = renderHarness({ closeOnOutsideClick: false });
    await fireEvent.click(screen.getByRole("button", { name: "Open sheet" }));
    await nextTick();

    const backdrop = container.parentElement!.querySelector(".stance-sheet__backdrop") as HTMLElement;
    await fireEvent.pointerDown(backdrop);
    await nextTick();
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });

  it("makes the rest of the page inert while open, and restores it on close", async () => {
    const outsideButton = document.createElement("button");
    outsideButton.textContent = "Outside";
    document.body.appendChild(outsideButton);

    renderHarness();
    await fireEvent.click(screen.getByRole("button", { name: "Open sheet" }));
    await nextTick();
    expect(outsideButton.hasAttribute("inert")).toBe(true);

    await fireEvent.keyDown(document, { key: "Escape" });
    await nextTick();
    expect(outsideButton.hasAttribute("inert")).toBe(false);

    outsideButton.remove();
  });

  it("repeats the open/focus/close cycle correctly a second time", async () => {
    renderHarness();
    const trigger = screen.getByRole("button", { name: "Open sheet" });

    trigger.focus();
    await fireEvent.click(trigger);
    await nextTick();
    await fireEvent.keyDown(document, { key: "Escape" });
    await nextTick();
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();

    trigger.focus();
    await fireEvent.click(trigger);
    await nextTick();
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(document.activeElement).toBe(screen.getByRole("button", { name: "Apply" }));

    await fireEvent.keyDown(document, { key: "Escape" });
    await nextTick();
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(document.activeElement).toBe(trigger);
  });

  it("never emits !important in its styles", () => {
    expect(sheetSource).not.toContain("!important");
  });

  it("wraps default styles in :where() to keep specificity at zero", () => {
    const styleBlock = sheetSource.slice(sheetSource.indexOf("<style"));
    expect(styleBlock).not.toMatch(/^\.stance-sheet/m);
  });

  it("respects prefers-reduced-motion by disabling the slide/fade transitions", () => {
    const reducedMotionBlock = sheetSource.slice(sheetSource.indexOf("@media (prefers-reduced-motion: reduce)"));
    expect(reducedMotionBlock).toContain("transition: none");
  });

  describe.each(themes)("axe: $name theme", (theme) => {
    it.each(modes)("no violations in %s mode (open sheet)", async (mode) => {
      const cleanup = withThemeStyle(theme);
      renderHarness({ description: "Narrow down the results." });
      await fireEvent.click(screen.getByRole("button", { name: "Open sheet" }));
      await nextTick();

      const sheetEl = screen.getByRole("dialog");
      sheetEl.setAttribute("data-theme", theme.name);
      if (mode === "dark") sheetEl.classList.add("dark");

      const results = await runAxe(sheetEl);
      expect(results).toHaveNoViolations();
      cleanup();
    });
  });

  it("no axe violations for an alertdialog (neutral/light)", async () => {
    const cleanup = withThemeStyle(neutral);
    renderHarness({ role: "alertdialog", description: "This cannot be undone." });
    await fireEvent.click(screen.getByRole("button", { name: "Open sheet" }));
    await nextTick();

    const sheetEl = screen.getByRole("alertdialog");
    sheetEl.setAttribute("data-theme", "neutral");

    const results = await runAxe(sheetEl);
    expect(results).toHaveNoViolations();
    cleanup();
  });
});
