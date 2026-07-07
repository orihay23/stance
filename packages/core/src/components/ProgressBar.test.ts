/**
 * Manual checklist (verify by hand in the playground, in addition to the
 * automated checks below):
 *
 * 1. Turn on a screen reader and change a determinate bar's value — the new
 *    percentage is announced.
 * 2. Confirm an indeterminate bar's animation slows down (rather than
 *    stopping outright, which would look broken/stuck) with
 *    prefers-reduced-motion enabled.
 */
import { render, screen } from "@testing-library/vue";
import { describe, expect, it } from "vitest";
import { allThemes } from "@stance/themes";
import { compileTheme } from "@stance/themes";
import ProgressBar from "./ProgressBar.vue";
import progressBarSource from "./ProgressBar.vue?raw";
import { runAxe } from "../../tests/axe-matcher";

const themes = allThemes;
const modes = ["light", "dark"] as const;

function withThemeStyle(theme: (typeof themes)[number]) {
  const style = document.createElement("style");
  style.textContent = compileTheme(theme);
  document.head.appendChild(style);
  return () => style.remove();
}

describe("ProgressBar", () => {
  it("defaults to value=0, max=100", () => {
    render(ProgressBar);
    const bar = screen.getByRole("progressbar");
    expect(bar).toHaveAttribute("aria-valuenow", "0");
    expect(bar).toHaveAttribute("aria-valuemin", "0");
    expect(bar).toHaveAttribute("aria-valuemax", "100");
  });

  it("reflects a given value/max as aria attributes", () => {
    render(ProgressBar, { props: { value: 30, max: 50 } });
    const bar = screen.getByRole("progressbar");
    expect(bar).toHaveAttribute("aria-valuenow", "30");
    expect(bar).toHaveAttribute("aria-valuemax", "50");
  });

  it("clamps value within [0, max]", () => {
    const { rerender } = render(ProgressBar, { props: { value: -10, max: 100 } });
    expect(screen.getByRole("progressbar")).toHaveAttribute("aria-valuenow", "0");
    return rerender({ value: 150, max: 100 }).then(() => {
      expect(screen.getByRole("progressbar")).toHaveAttribute("aria-valuenow", "100");
    });
  });

  it("omits aria-valuenow entirely when indeterminate", () => {
    render(ProgressBar, { props: { indeterminate: true, value: 40 } });
    const bar = screen.getByRole("progressbar");
    expect(bar).not.toHaveAttribute("aria-valuenow");
    expect(bar).toHaveAttribute("data-indeterminate", "true");
  });

  it("does not set data-indeterminate when determinate (the default)", () => {
    render(ProgressBar);
    expect(screen.getByRole("progressbar")).not.toHaveAttribute("data-indeterminate");
  });

  it("applies aria-label from the label prop", () => {
    render(ProgressBar, { props: { label: "Upload progress" } });
    expect(screen.getByRole("progressbar", { name: "Upload progress" })).toBeInTheDocument();
  });

  it("exposes value/max/percent to the default slot", () => {
    render(ProgressBar, {
      props: { value: 25, max: 50 },
      slots: { default: (scope: { value: number; max: number; percent: number }) => `${scope.percent}%` },
    });
    expect(screen.getByText("50%")).toBeInTheDocument();
  });

  it("merges a consumer class with the internal class list", () => {
    const { container } = render(ProgressBar, { props: { class: "mt-4" } });
    const bar = container.querySelector(".stance-progress")!;
    expect(bar.className).toContain("stance-progress");
    expect(bar.className).toContain("mt-4");
  });

  it("never emits !important in its styles", () => {
    expect(progressBarSource).not.toContain("!important");
  });

  it("wraps default styles in :where() to keep specificity at zero", () => {
    const styleBlock = progressBarSource.slice(progressBarSource.indexOf("<style"));
    expect(styleBlock).not.toMatch(/^\.stance-progress/m);
  });

  describe.each(themes)("axe: $name theme", (theme) => {
    it.each(modes)("no violations in %s mode (determinate)", async (mode) => {
      const cleanup = withThemeStyle(theme);
      const { container } = render(ProgressBar, { props: { value: 42, label: "Upload progress" } });
      container.setAttribute("data-theme", theme.name);
      if (mode === "dark") container.classList.add("dark");

      const results = await runAxe(container);
      expect(results).toHaveNoViolations();
      cleanup();
    });

    it.each(modes)("no violations in %s mode (indeterminate)", async (mode) => {
      const cleanup = withThemeStyle(theme);
      const { container } = render(ProgressBar, { props: { indeterminate: true, label: "Loading" } });
      container.setAttribute("data-theme", theme.name);
      if (mode === "dark") container.classList.add("dark");

      const results = await runAxe(container);
      expect(results).toHaveNoViolations();
      cleanup();
    });
  });
});
