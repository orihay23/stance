/**
 * Manual checklist (verify by hand in the playground, in addition to the
 * automated checks below):
 *
 * 1. With a screen reader on, a count badge (with a `label`) announces the
 *    label text, not the raw visible glyph/number twice.
 * 2. A purely decorative badge (no `label`) is silent to a screen reader —
 *    it doesn't announce redundant or meaningless content.
 */
import { render, screen } from "@testing-library/vue";
import { describe, expect, it } from "vitest";
import { neutral } from "@stance/themes";
import { compileTheme } from "@stance/themes";
import Badge, { type BadgeVariant } from "./Badge.vue";
import badgeSource from "./Badge.vue?raw";
import { runAxe } from "../../tests/axe-matcher";

const themes = [neutral];
const modes = ["light", "dark"] as const;

function withThemeStyle(theme: (typeof themes)[number]) {
  const style = document.createElement("style");
  style.textContent = compileTheme(theme);
  document.head.appendChild(style);
  return () => style.remove();
}

describe("Badge", () => {
  it("renders slot content", () => {
    render(Badge, { slots: { default: "New" } });
    expect(screen.getByText("New")).toBeInTheDocument();
  });

  it("defaults to variant=neutral", () => {
    const { container } = render(Badge, { slots: { default: "New" } });
    expect(container.querySelector(".stance-badge")).toHaveAttribute("data-variant", "neutral");
  });

  it.each<BadgeVariant>(["neutral", "primary", "success", "warning", "destructive"])(
    "applies data-variant=%s",
    (variant) => {
      const { container } = render(Badge, { props: { variant }, slots: { default: "New" } });
      expect(container.querySelector(".stance-badge")).toHaveAttribute("data-variant", variant);
    },
  );

  it("without a label, renders only the visible slot content (no hidden text, nothing aria-hidden)", () => {
    const { container } = render(Badge, { slots: { default: "New" } });
    expect(container.querySelector(".stance-badge__visually-hidden")).not.toBeInTheDocument();
    expect(screen.getByText("New")).not.toHaveAttribute("aria-hidden");
  });

  it("with a label, hides the visible content from assistive tech and exposes the label instead", () => {
    render(Badge, { props: { label: "3 unread notifications" }, slots: { default: "3" } });
    expect(screen.getByText("3 unread notifications")).toBeInTheDocument();
    const visible = screen.getByText("3");
    expect(visible.closest("[aria-hidden='true']")).toBeTruthy();
  });

  it("merges a consumer class with the internal class list", () => {
    const { container } = render(Badge, { props: { class: "mt-4" }, slots: { default: "New" } });
    const badge = container.querySelector(".stance-badge")!;
    expect(badge.className).toContain("stance-badge");
    expect(badge.className).toContain("mt-4");
  });

  it("never emits !important in its styles", () => {
    expect(badgeSource).not.toContain("!important");
  });

  it("wraps default styles in :where() to keep specificity at zero", () => {
    const styleBlock = badgeSource.slice(badgeSource.indexOf("<style"));
    expect(styleBlock).not.toMatch(/^\.stance-badge/m);
  });

  describe.each(themes)("axe: $name theme", (theme) => {
    it.each(modes)("no violations in %s mode (decorative)", async (mode) => {
      const cleanup = withThemeStyle(theme);
      const { container } = render(Badge, { slots: { default: "New" } });
      container.setAttribute("data-theme", theme.name);
      if (mode === "dark") container.classList.add("dark");

      const results = await runAxe(container);
      expect(results).toHaveNoViolations();
      cleanup();
    });

    it.each(modes)("no violations in %s mode (with label)", async (mode) => {
      const cleanup = withThemeStyle(theme);
      const { container } = render(Badge, {
        props: { label: "3 unread notifications", variant: "primary" },
        slots: { default: "3" },
      });
      container.setAttribute("data-theme", theme.name);
      if (mode === "dark") container.classList.add("dark");

      const results = await runAxe(container);
      expect(results).toHaveNoViolations();
      cleanup();
    });
  });
});
