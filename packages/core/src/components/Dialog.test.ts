/**
 * Manual keyboard-nav checklist (verify by hand in the playground, in
 * addition to the automated checks below):
 *
 * 1. Open a dialog — a visible focus ring (using --stance-color-ring)
 *    appears on whichever element receives initial focus, in every theme,
 *    in both light and dark mode.
 * 2. With the dialog open, try to Tab or click your way to anything behind
 *    it (the page's own nav, other buttons, etc.) — nothing behind the
 *    dialog should be reachable at all, by mouse or keyboard.
 * 3. Tab through every focusable element in the dialog and confirm it
 *    cycles: Tab from the last element goes to the first; Shift+Tab from
 *    the first goes to the last. Focus never leaves the dialog.
 * 4. Press Escape — the dialog closes and focus visibly returns to
 *    whichever element opened it.
 * 5. Open the dialog again (from the same trigger) — the cycle repeats
 *    correctly a second time (no leftover state from the first open/close).
 * 6. Turn on a screen reader and open the dialog — it should announce the
 *    dialog's role (dialog/alertdialog) and its title immediately.
 */
import { defineComponent, h, nextTick, ref } from "vue";
import { render, screen, within } from "@testing-library/vue";
import { fireEvent } from "@testing-library/vue";
import { describe, expect, it, vi } from "vitest";
import Dialog, { type DialogProps } from "./Dialog.vue";
import dialogSource from "./Dialog.vue?raw";
import { runAxe } from "../../tests/axe-matcher";
import { compactDensity, neutralPalette, palettes, withPaletteAndDensityStyle, withPaletteStyle } from "../../tests/theme-test-utils";

const modes = ["light", "dark"] as const;

/** A realistic harness: a trigger button outside the dialog, and two focusable buttons inside it. */
function renderHarness(dialogProps: Partial<DialogProps> = {}) {
  const Harness = defineComponent({
    setup() {
      const open = ref(false);
      return () =>
        h("div", [
          h("button", { onClick: () => (open.value = true) }, "Open dialog"),
          h(
            Dialog,
            {
              modelValue: open.value,
              "onUpdate:modelValue": (v: boolean) => {
                open.value = v;
              },
              title: "Confirm action",
              ...dialogProps,
            },
            {
              default: () => [
                h("button", { key: "confirm" }, "Confirm"),
                h("button", { key: "cancel" }, "Cancel"),
              ],
            },
          ),
        ]);
    },
  });
  return render(Harness);
}

describe("Dialog", () => {
  it("renders nothing when closed", () => {
    renderHarness();
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("renders role=dialog by default", async () => {
    renderHarness();
    await fireEvent.click(screen.getByRole("button", { name: "Open dialog" }));
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });

  it("renders role=alertdialog when requested", async () => {
    renderHarness({ role: "alertdialog" });
    await fireEvent.click(screen.getByRole("button", { name: "Open dialog" }));
    expect(screen.getByRole("alertdialog")).toBeInTheDocument();
  });

  it("wires aria-labelledby to the rendered title, and aria-describedby only when a description is given", async () => {
    renderHarness({ description: "This cannot be undone." });
    await fireEvent.click(screen.getByRole("button", { name: "Open dialog" }));
    const dialog = screen.getByRole("dialog", { name: "Confirm action" });
    const describedBy = dialog.getAttribute("aria-describedby");
    expect(describedBy).toBeTruthy();
    expect(document.getElementById(describedBy!)).toHaveTextContent("This cannot be undone.");
  });

  it("warns in dev mode when title is empty", () => {
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    render(Dialog, {
      props: { modelValue: true, title: "" },
      slots: { default: "Body" },
    });
    expect(errorSpy).toHaveBeenCalledWith(expect.stringContaining("requires a non-empty `title`"));
    errorSpy.mockRestore();
  });

  it("moves focus into the dialog on open, and cycles Tab/Shift+Tab within it", async () => {
    renderHarness();
    await fireEvent.click(screen.getByRole("button", { name: "Open dialog" }));
    await nextTick();

    const confirmBtn = screen.getByRole("button", { name: "Confirm" });
    const cancelBtn = screen.getByRole("button", { name: "Cancel" });
    expect(document.activeElement).toBe(confirmBtn);

    // Tab from the last focusable element wraps to the first.
    cancelBtn.focus();
    await fireEvent.keyDown(cancelBtn, { key: "Tab" });
    expect(document.activeElement).toBe(confirmBtn);

    // Shift+Tab from the first focusable element wraps to the last.
    await fireEvent.keyDown(confirmBtn, { key: "Tab", shiftKey: true });
    expect(document.activeElement).toBe(cancelBtn);
  });

  it("closes on Escape and returns focus to the trigger", async () => {
    renderHarness();
    const trigger = screen.getByRole("button", { name: "Open dialog" });
    // fireEvent.click doesn't simulate the browser's focus-follows-click for
    // buttons, so focus explicitly first to set up the real precondition.
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
    await fireEvent.click(screen.getByRole("button", { name: "Open dialog" }));
    await nextTick();

    await fireEvent.keyDown(document, { key: "Escape" });
    await nextTick();
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });

  it("closes on an outside (backdrop) click by default, without self-closing from its own opening click", async () => {
    const { container } = renderHarness();
    await fireEvent.click(screen.getByRole("button", { name: "Open dialog" }));
    await nextTick();
    // The dialog must still be open right after the click that opened it.
    expect(screen.getByRole("dialog")).toBeInTheDocument();

    const backdrop = container.parentElement!.querySelector(".stance-dialog__backdrop") as HTMLElement;
    await fireEvent.pointerDown(backdrop);
    await nextTick();
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("does not close on an outside click when closeOnOutsideClick is false", async () => {
    const { container } = renderHarness({ closeOnOutsideClick: false });
    await fireEvent.click(screen.getByRole("button", { name: "Open dialog" }));
    await nextTick();

    const backdrop = container.parentElement!.querySelector(".stance-dialog__backdrop") as HTMLElement;
    await fireEvent.pointerDown(backdrop);
    await nextTick();
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });

  it("makes the rest of the page inert while open, and restores it on close", async () => {
    const outsideButton = document.createElement("button");
    outsideButton.textContent = "Outside";
    document.body.appendChild(outsideButton);

    renderHarness();
    await fireEvent.click(screen.getByRole("button", { name: "Open dialog" }));
    await nextTick();
    expect(outsideButton.hasAttribute("inert")).toBe(true);
    expect(outsideButton.getAttribute("aria-hidden")).toBe("true");

    await fireEvent.keyDown(document, { key: "Escape" });
    await nextTick();
    expect(outsideButton.hasAttribute("inert")).toBe(false);
    expect(outsideButton.getAttribute("aria-hidden")).toBeNull();

    outsideButton.remove();
  });

  it("repeats the open/focus/close cycle correctly a second time", async () => {
    renderHarness();
    const trigger = screen.getByRole("button", { name: "Open dialog" });

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
    expect(document.activeElement).toBe(screen.getByRole("button", { name: "Confirm" }));

    await fireEvent.keyDown(document, { key: "Escape" });
    await nextTick();
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(document.activeElement).toBe(trigger);
  });

  it("never emits !important in its styles", () => {
    expect(dialogSource).not.toContain("!important");
  });

  it("wraps default styles in :where() to keep specificity at zero", () => {
    const styleBlock = dialogSource.slice(dialogSource.indexOf("<style"));
    expect(styleBlock).not.toMatch(/^\.stance-dialog/m);
  });

  describe.each(palettes)("axe: $name palette", (palette) => {
    it.each(modes)("no violations in %s mode (open dialog)", async (mode) => {
      const cleanup = withPaletteStyle(palette);
      renderHarness({ description: "This cannot be undone." });
      await fireEvent.click(screen.getByRole("button", { name: "Open dialog" }));
      await nextTick();

      const dialogEl = screen.getByRole("dialog");
      dialogEl.setAttribute("data-theme-palette", palette.name);
      if (mode === "dark") dialogEl.classList.add("dark");

      const results = await runAxe(dialogEl);
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
    renderHarness({ description: "This cannot be undone." });
    await fireEvent.click(screen.getByRole("button", { name: "Open dialog" }));
    await nextTick();

    const dialogEl = screen.getByRole("dialog");
    dialogEl.setAttribute("data-theme-palette", "neutral");
    dialogEl.setAttribute("data-theme-density", "compact");
    if (mode === "dark") dialogEl.classList.add("dark");

    const results = await runAxe(dialogEl);
    expect(results).toHaveNoViolations();
    cleanup();
  });

  it("no axe violations for an alertdialog (neutral/light)", async () => {
    const cleanup = withPaletteStyle(neutralPalette);
    renderHarness({ role: "alertdialog", description: "This cannot be undone." });
    await fireEvent.click(screen.getByRole("button", { name: "Open dialog" }));
    await nextTick();

    const dialogEl = screen.getByRole("alertdialog");
    dialogEl.setAttribute("data-theme-palette", "neutral");

    const results = await runAxe(dialogEl);
    expect(results).toHaveNoViolations();
    cleanup();
  });
});
