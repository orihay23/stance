/**
 * Manual keyboard-nav checklist (verify by hand in the playground, in
 * addition to the automated checks below):
 *
 * 1. Tab to an interactive (button/link) card — a visible focus ring
 *    appears around the whole card in every theme, in both light and dark
 *    mode.
 * 2. With an interactive button-form card focused, press Enter and Space —
 *    both activate it (click fires).
 * 3. Tab through a disabled interactive card — it's skipped entirely
 *    (removed from tab order).
 * 4. A static (non-interactive) card is never reachable by Tab and has no
 *    button/link role.
 */
import { render, screen } from "@testing-library/vue";
import { fireEvent } from "@testing-library/vue";
import { describe, expect, it, vi } from "vitest";
import { neutral } from "@stance/themes";
import { compileTheme } from "@stance/themes";
import Card, { type CardVariant } from "./Card.vue";
import cardSource from "./Card.vue?raw";
import { runAxe } from "../../tests/axe-matcher";

const themes = [neutral];
const modes = ["light", "dark"] as const;

function withThemeStyle(theme: (typeof themes)[number]) {
  const style = document.createElement("style");
  style.textContent = compileTheme(theme);
  document.head.appendChild(style);
  return () => style.remove();
}

describe("Card", () => {
  it("renders a static <div> by default, with no interactive role", () => {
    const { container } = render(Card, { slots: { default: "Content" } });
    const card = container.querySelector(".stance-card")!;
    expect(card.tagName).toBe("DIV");
    expect(card).not.toHaveAttribute("data-interactive");
  });

  it("defaults to variant=elevated", () => {
    const { container } = render(Card, { slots: { default: "Content" } });
    expect(container.querySelector(".stance-card")).toHaveAttribute("data-variant", "elevated");
  });

  it.each<CardVariant>(["elevated", "outlined", "flat"])("applies data-variant=%s", (variant) => {
    const { container } = render(Card, { props: { variant }, slots: { default: "Content" } });
    expect(container.querySelector(".stance-card")).toHaveAttribute("data-variant", variant);
  });

  it("renders the default slot inside a body wrapper", () => {
    render(Card, { slots: { default: "Plain content" } });
    expect(screen.getByText("Plain content").closest(".stance-card__body")).toBeInTheDocument();
  });

  it("only renders a header wrapper when the header slot has content", () => {
    const { container } = render(Card, { slots: { default: "Body" } });
    expect(container.querySelector(".stance-card__header")).not.toBeInTheDocument();
  });

  it("renders header/footer wrappers only when those slots are used", () => {
    render(Card, {
      slots: { header: "Title", default: "Body", footer: "Actions" },
    });
    expect(screen.getByText("Title").closest(".stance-card__header")).toBeInTheDocument();
    expect(screen.getByText("Actions").closest(".stance-card__footer")).toBeInTheDocument();
  });

  it("exposes headingTag to the header slot, defaulting to h3", () => {
    render(Card, {
      slots: {
        header: `<template #header="{ headingTag }"><component :is="headingTag">{{ headingTag }}</component></template>`,
        default: "Body",
      },
    });
    expect(screen.getByText("h3").tagName).toBe("H3");
  });

  it("respects a custom headingLevel in the header slot scope", () => {
    render(Card, {
      props: { headingLevel: 2 },
      slots: {
        header: `<template #header="{ headingTag }"><component :is="headingTag">{{ headingTag }}</component></template>`,
        default: "Body",
      },
    });
    expect(screen.getByText("h2").tagName).toBe("H2");
  });

  it("renders as a real <a href> when href is given", () => {
    const { container } = render(Card, { props: { href: "/somewhere" }, slots: { default: "Go" } });
    const link = screen.getByRole("link", { name: "Go" });
    expect(link).toHaveAttribute("href", "/somewhere");
    expect(container.querySelector(".stance-card")).toHaveAttribute("data-interactive", "true");
  });

  it("renders as a real <button type=button> when interactive is true (no href)", () => {
    render(Card, { props: { interactive: true }, slots: { default: "Go" } });
    const button = screen.getByRole("button", { name: "Go" });
    expect(button).toHaveAttribute("type", "button");
  });

  it("href takes precedence over interactive when both are given", () => {
    render(Card, { props: { interactive: true, href: "/x" }, slots: { default: "Go" } });
    expect(screen.getByRole("link", { name: "Go" })).toBeInTheDocument();
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  it("fires click on an interactive card", async () => {
    const onClick = vi.fn();
    render(Card, { props: { interactive: true }, attrs: { onClick }, slots: { default: "Go" } });
    await fireEvent.click(screen.getByRole("button", { name: "Go" }));
    expect(onClick).toHaveBeenCalledOnce();
  });

  it("disables an interactive button-form card and blocks clicks", () => {
    const onClick = vi.fn();
    render(Card, {
      props: { interactive: true, disabled: true },
      attrs: { onClick },
      slots: { default: "Go" },
    });
    const button = screen.getByRole("button", { name: "Go" });
    expect(button).toBeDisabled();
    (button as HTMLButtonElement).click();
    expect(onClick).not.toHaveBeenCalled();
  });

  it("merges a consumer class with the internal class list", () => {
    const { container } = render(Card, { props: { class: "mt-4" }, slots: { default: "Content" } });
    const card = container.querySelector(".stance-card")!;
    expect(card.className).toContain("stance-card");
    expect(card.className).toContain("mt-4");
  });

  it("never emits !important in its styles", () => {
    expect(cardSource).not.toContain("!important");
  });

  it("wraps default styles in :where() to keep specificity at zero", () => {
    const styleBlock = cardSource.slice(cardSource.indexOf("<style"));
    expect(styleBlock).not.toMatch(/^\.stance-card/m);
  });

  describe.each(themes)("axe: $name theme", (theme) => {
    it.each(modes)("no violations in %s mode (static card)", async (mode) => {
      const cleanup = withThemeStyle(theme);
      const { container } = render(Card, {
        slots: { header: "Title", default: "Body copy.", footer: "Footer actions" },
      });
      container.setAttribute("data-theme", theme.name);
      if (mode === "dark") container.classList.add("dark");

      const results = await runAxe(container);
      expect(results).toHaveNoViolations();
      cleanup();
    });

    it.each(modes)("no violations in %s mode (interactive link card)", async (mode) => {
      const cleanup = withThemeStyle(theme);
      const { container } = render(Card, {
        props: { href: "/somewhere" },
        slots: { default: "Go somewhere" },
      });
      container.setAttribute("data-theme", theme.name);
      if (mode === "dark") container.classList.add("dark");

      const results = await runAxe(container);
      expect(results).toHaveNoViolations();
      cleanup();
    });
  });
});
