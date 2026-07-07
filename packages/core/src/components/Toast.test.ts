/**
 * Manual checklist (verify by hand in the playground, in addition to the
 * automated checks below):
 *
 * 1. Trigger a toast, then hover it — the auto-dismiss timer should pause
 *    (it doesn't disappear while the mouse is over it), and resume once the
 *    mouse leaves.
 * 2. Tab to a toast's close button before it auto-dismisses — the timer
 *    should pause the same way on focus, and resume on blur.
 * 3. Trigger an `urgent` toast with a screen reader on — it should interrupt
 *    (assertive), unlike a normal toast, which waits its turn (polite).
 */
import { defineComponent, h, nextTick } from "vue";
import { render, screen } from "@testing-library/vue";
import { fireEvent } from "@testing-library/vue";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { allThemes } from "@stance/themes";
import { compileTheme } from "@stance/themes";
import ToastRegion from "./ToastRegion.vue";
import toastSource from "./Toast.vue?raw";
import { useToast } from "../composables/useToast";
import { runAxe } from "../../tests/axe-matcher";

const themes = allThemes;
const modes = ["light", "dark"] as const;

function withThemeStyle(theme: (typeof themes)[number]) {
  const style = document.createElement("style");
  style.textContent = compileTheme(theme);
  document.head.appendChild(style);
  return () => style.remove();
}

function renderRegion() {
  const Harness = defineComponent({
    setup() {
      return () => h(ToastRegion);
    },
  });
  return render(Harness);
}

describe("Toast", () => {
  const { dismissAll } = useToast();

  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    dismissAll();
    vi.useRealTimers();
  });

  it("renders nothing when there are no toasts", () => {
    renderRegion();
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("shows a toast with role=status by default", async () => {
    const { show } = useToast();
    renderRegion();
    show({ title: "Saved", description: "Your changes were saved." });
    await nextTick();

    const toast = screen.getByRole("status");
    expect(toast).toHaveTextContent("Saved");
    expect(toast).toHaveTextContent("Your changes were saved.");
  });

  it("uses role=alert when urgent", async () => {
    const { show } = useToast();
    renderRegion();
    show({ title: "Payment failed", urgent: true });
    await nextTick();

    expect(screen.getByRole("alert")).toHaveTextContent("Payment failed");
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
  });

  it("auto-dismisses after the configured duration", async () => {
    const { show } = useToast();
    renderRegion();
    show({ title: "Auto", duration: 1000 });
    await nextTick();
    expect(screen.getByRole("status")).toBeInTheDocument();

    vi.advanceTimersByTime(999);
    await nextTick();
    expect(screen.getByRole("status")).toBeInTheDocument();

    vi.advanceTimersByTime(1);
    await nextTick();
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
  });

  it("never auto-dismisses when duration is null", async () => {
    const { show } = useToast();
    renderRegion();
    show({ title: "Manual only", duration: null });
    await nextTick();

    vi.advanceTimersByTime(100_000);
    await nextTick();
    expect(screen.getByRole("status")).toBeInTheDocument();
  });

  it("pauses the timer on hover and resumes on mouseleave", async () => {
    const { show } = useToast();
    renderRegion();
    show({ title: "Hover pause", duration: 1000 });
    await nextTick();
    const toast = screen.getByRole("status");

    vi.advanceTimersByTime(500);
    await fireEvent.mouseEnter(toast);
    vi.advanceTimersByTime(2000); // well past the original duration, but paused
    await nextTick();
    expect(screen.getByRole("status")).toBeInTheDocument();

    await fireEvent.mouseLeave(toast);
    vi.advanceTimersByTime(499);
    await nextTick();
    expect(screen.getByRole("status")).toBeInTheDocument();

    vi.advanceTimersByTime(1);
    await nextTick();
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
  });

  it("pauses the timer on focus and resumes on blur", async () => {
    const { show } = useToast();
    renderRegion();
    show({ title: "Focus pause", duration: 1000 });
    await nextTick();
    const toast = screen.getByRole("status");

    vi.advanceTimersByTime(500);
    await fireEvent.focusIn(toast);
    vi.advanceTimersByTime(2000);
    await nextTick();
    expect(screen.getByRole("status")).toBeInTheDocument();

    await fireEvent.focusOut(toast);
    vi.advanceTimersByTime(500);
    await nextTick();
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
  });

  it("dismisses on close button click", async () => {
    const { show } = useToast();
    renderRegion();
    show({ title: "Closable", duration: null });
    await nextTick();

    await fireEvent.click(screen.getByRole("button", { name: "Dismiss notification" }));
    await nextTick();
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
  });

  it("stacks multiple toasts independently", async () => {
    const { show } = useToast();
    renderRegion();
    show({ title: "First", duration: null });
    show({ title: "Second", duration: null });
    await nextTick();

    expect(screen.getAllByRole("status")).toHaveLength(2);
  });

  it("warns in dev mode when neither title nor description is given", () => {
    const { show } = useToast();
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    show({});
    expect(errorSpy).toHaveBeenCalledWith(expect.stringContaining("requires a `title` and/or `description`"));
    errorSpy.mockRestore();
  });

  it("never emits !important in its styles", () => {
    expect(toastSource).not.toContain("!important");
  });

  it("wraps default styles in :where() to keep specificity at zero", () => {
    const styleBlock = toastSource.slice(toastSource.indexOf("<style"));
    expect(styleBlock).not.toMatch(/^\.stance-toast/m);
  });

  describe.each(themes)("axe: $name theme", (theme) => {
    it.each(modes)("no violations in %s mode", async (mode) => {
      const cleanup = withThemeStyle(theme);
      const { show } = useToast();
      const { container } = renderRegion();
      show({ title: "Saved", description: "Your changes were saved.", duration: null });
      await nextTick();

      const region = container.parentElement!.querySelector(".stance-toast-region")!;
      region.setAttribute("data-theme", theme.name);
      if (mode === "dark") region.classList.add("dark");

      // axe-core's own internal async scheduling needs real timers.
      vi.useRealTimers();
      const results = await runAxe(region);
      expect(results).toHaveNoViolations();
      cleanup();
    });
  });
});
