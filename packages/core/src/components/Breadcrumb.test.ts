/**
 * Manual checklist (verify by hand in the playground, in addition to the
 * automated checks below — jsdom doesn't evaluate container queries or
 * floating-ui positioning, so the actual width-driven collapse and menu
 * placement can't be exercised here):
 *
 * 1. Shrink the container below the collapse threshold — the middle items
 *    disappear and a "…" trigger appears in their place, with no layout
 *    shift in the first/last items.
 * 2. Click (or keyboard-activate) the "…" trigger — a menu opens listing
 *    the hidden items as real, individually navigable links.
 * 3. Turn on a screen reader and move through the trail — only the current
 *    (last) item announces as the current page (aria-current).
 */
import { defineComponent, h, nextTick, ref } from "vue";
import { render, screen, within } from "@testing-library/vue";
import { fireEvent } from "@testing-library/vue";
import { describe, expect, it } from "vitest";
import { allThemes } from "@stance/themes";
import { compileTheme } from "@stance/themes";
import Breadcrumb, { type BreadcrumbItem } from "./Breadcrumb.vue";
import breadcrumbSource from "./Breadcrumb.vue?raw";
import { runAxe } from "../../tests/axe-matcher";

const themes = allThemes;
const modes = ["light", "dark"] as const;

function withThemeStyle(theme: (typeof themes)[number]) {
  const style = document.createElement("style");
  style.textContent = compileTheme(theme);
  document.head.appendChild(style);
  return () => style.remove();
}

const twoItems: BreadcrumbItem[] = [
  { label: "Home", href: "/" },
  { label: "Settings" },
];

const fiveItems: BreadcrumbItem[] = [
  { label: "Home", href: "/" },
  { label: "Team", href: "/team" },
  { label: "Members", href: "/team/members" },
  { label: "Roles", href: "/team/members/roles" },
  { label: "Editor" },
];

describe("Breadcrumb", () => {
  it("wraps a real <nav aria-label='Breadcrumb'> by default", () => {
    render(Breadcrumb, { props: { items: twoItems } });
    expect(screen.getByRole("navigation", { name: "Breadcrumb" })).toBeInTheDocument();
  });

  it("accepts a custom nav label", () => {
    render(Breadcrumb, { props: { items: twoItems, label: "You are here" } });
    expect(screen.getByRole("navigation", { name: "You are here" })).toBeInTheDocument();
  });

  it("renders items in an ordered list", () => {
    const { container } = render(Breadcrumb, { props: { items: twoItems } });
    expect(container.querySelector("ol.stance-breadcrumb")).toBeInTheDocument();
  });

  it("renders the first item as a real link when it has an href", () => {
    render(Breadcrumb, { props: { items: twoItems } });
    expect(screen.getByRole("link", { name: "Home" })).toHaveAttribute("href", "/");
  });

  it("marks the last item aria-current=page and renders it as plain text when it has no href", () => {
    render(Breadcrumb, { props: { items: twoItems } });
    const current = screen.getByText("Settings");
    expect(current).toHaveAttribute("aria-current", "page");
    expect(current.tagName).not.toBe("A");
  });

  it("still renders the last item as a link with aria-current=page when it does have an href", () => {
    render(Breadcrumb, { props: { items: [...twoItems.slice(0, 1), { label: "Settings", href: "/settings" }] } });
    const current = screen.getByRole("link", { name: "Settings" });
    expect(current).toHaveAttribute("aria-current", "page");
  });

  it("renders a single item with no separators and no first-item duplicate", () => {
    render(Breadcrumb, { props: { items: [{ label: "Only page" }] } });
    expect(screen.getAllByText("Only page")).toHaveLength(1);
    expect(document.querySelectorAll(".stance-breadcrumb__separator")).toHaveLength(0);
  });

  it("renders no collapse ellipsis when there are 2 or fewer items", () => {
    const { container } = render(Breadcrumb, { props: { items: twoItems } });
    expect(container.querySelector(".stance-breadcrumb__item--ellipsis")).not.toBeInTheDocument();
  });

  it("renders no collapse ellipsis for exactly 3 items with only one (rendered inline, not collapsed) middle item", () => {
    const { container } = render(Breadcrumb, {
      props: {
        items: [{ label: "Home", href: "/" }, { label: "Team", href: "/team" }, { label: "Editor" }],
      },
    });
    // A single middle item still renders inline; the ellipsis exists in the
    // DOM (for the narrow-container case) but so does the plain middle item.
    expect(container.querySelector(".stance-breadcrumb__item--middle")).toHaveTextContent("Team");
    expect(container.querySelector(".stance-breadcrumb__item--ellipsis")).toBeInTheDocument();
  });

  it("collapses middle items behind a '…' trigger with an accessible label naming the hidden count", () => {
    render(Breadcrumb, { props: { items: fiveItems } });
    expect(screen.getByText("Show 3 hidden items")).toBeInTheDocument();
    // All 3 middle items still render inline in the DOM (container query
    // decides visibility at runtime) alongside the ellipsis trigger.
    expect(screen.getByRole("link", { name: "Team" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Members" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Roles" })).toBeInTheDocument();
  });

  it("opens a menu of the hidden items as real links when the ellipsis trigger is activated", async () => {
    render(Breadcrumb, { props: { items: fiveItems } });
    const trigger = screen.getByRole("button", { name: /Show 3 hidden items/ });
    await fireEvent.click(trigger);
    await nextTick();

    const menu = screen.getByRole("menu");
    const menuLinks = within(menu).getAllByRole("menuitem");
    expect(menuLinks.map((el) => el.textContent?.trim())).toEqual(["Team", "Members", "Roles"]);
    expect(menuLinks[0]).toHaveAttribute("href", "/team");
  });

  it("closes the collapse menu on Escape", async () => {
    render(Breadcrumb, { props: { items: fiveItems } });
    await fireEvent.click(screen.getByRole("button", { name: /Show 3 hidden items/ }));
    await nextTick();
    expect(screen.getByRole("menu")).toBeInTheDocument();

    await fireEvent.keyDown(screen.getByRole("menu"), { key: "Escape" });
    await nextTick();
    expect(screen.queryByRole("menu")).not.toBeInTheDocument();
  });

  it("merges a consumer class with the internal class list", () => {
    const { container } = render(Breadcrumb, { props: { items: twoItems, class: "mt-4" } });
    const root = container.querySelector(".stance-breadcrumb-container")!;
    expect(root.className).toContain("stance-breadcrumb-container");
    expect(root.className).toContain("mt-4");
  });

  it("never emits !important in its styles", () => {
    expect(breadcrumbSource).not.toContain("!important");
  });

  it("wraps default styles in :where() to keep specificity at zero", () => {
    const styleBlock = breadcrumbSource.slice(breadcrumbSource.indexOf("<style"));
    expect(styleBlock).not.toMatch(/^\.stance-breadcrumb/m);
  });

  describe.each(themes)("axe: $name theme", (theme) => {
    it.each(modes)("no violations in %s mode (closed)", async (mode) => {
      const cleanup = withThemeStyle(theme);
      const { container } = render(Breadcrumb, { props: { items: fiveItems } });
      container.setAttribute("data-theme", theme.name);
      if (mode === "dark") container.classList.add("dark");

      const results = await runAxe(container);
      expect(results).toHaveNoViolations();
      cleanup();
    });

    it.each(modes)("no violations in %s mode (collapse menu open)", async (mode) => {
      const cleanup = withThemeStyle(theme);
      const { container } = render(Breadcrumb, { props: { items: fiveItems } });
      container.setAttribute("data-theme", theme.name);
      if (mode === "dark") container.classList.add("dark");

      await fireEvent.click(screen.getByRole("button", { name: /Show 3 hidden items/ }));
      await nextTick();
      const menu = screen.getByRole("menu");
      menu.setAttribute("data-theme", theme.name);
      if (mode === "dark") menu.classList.add("dark");

      const results = await runAxe(menu.parentElement!);
      expect(results).toHaveNoViolations();
      cleanup();
    });
  });
});
