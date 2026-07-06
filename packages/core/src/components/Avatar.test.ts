/**
 * Manual checklist (verify by hand in the playground, in addition to the
 * automated checks below):
 *
 * 1. Point `src` at a URL that 404s — the avatar falls back to initials (or
 *    the generic icon) instead of showing a broken-image glyph.
 * 2. Turn on a screen reader: a named avatar (image or fallback) announces
 *    the name; an avatar with no `name` is silent (purely decorative).
 */
import { render, screen } from "@testing-library/vue";
import { fireEvent } from "@testing-library/vue";
import { describe, expect, it } from "vitest";
import { neutral } from "@stance/themes";
import { compileTheme } from "@stance/themes";
import Avatar, { type AvatarSize } from "./Avatar.vue";
import avatarSource from "./Avatar.vue?raw";
import { runAxe } from "../../tests/axe-matcher";

const themes = [neutral];
const modes = ["light", "dark"] as const;

function withThemeStyle(theme: (typeof themes)[number]) {
  const style = document.createElement("style");
  style.textContent = compileTheme(theme);
  document.head.appendChild(style);
  return () => style.remove();
}

describe("Avatar", () => {
  it("renders an <img> with alt=name when src and name are both given", () => {
    render(Avatar, { props: { src: "/bea.jpg", name: "Bea Nakamura" } });
    expect(screen.getByRole("img", { name: "Bea Nakamura" })).toHaveAttribute("src", "/bea.jpg");
  });

  it("renders an <img> with an empty alt when src is given but name is not (decorative)", () => {
    const { container } = render(Avatar, { props: { src: "/bea.jpg" } });
    const img = container.querySelector("img")!;
    expect(img).toHaveAttribute("alt", "");
  });

  it("falls back to initials derived from name when no src is given", () => {
    render(Avatar, { props: { name: "Bea Nakamura" } });
    expect(screen.getByText("BN")).toBeInTheDocument();
    expect(screen.getByRole("img", { name: "Bea Nakamura" })).toBeInTheDocument();
  });

  it("derives a single-letter initial from a one-word name", () => {
    render(Avatar, { props: { name: "Cher" } });
    expect(screen.getByText("C")).toBeInTheDocument();
  });

  it("respects an explicit initials override", () => {
    render(Avatar, { props: { name: "Bea Nakamura", initials: "XY" } });
    expect(screen.getByText("XY")).toBeInTheDocument();
    expect(screen.queryByText("BN")).not.toBeInTheDocument();
  });

  it("falls back to a decorative icon when there's no src and no name", () => {
    const { container } = render(Avatar);
    expect(container.querySelector(".stance-avatar__icon")).toBeInTheDocument();
    expect(container.querySelector(".stance-avatar__fallback")).toHaveAttribute("aria-hidden", "true");
    expect(container.querySelector(".stance-avatar__fallback")).not.toHaveAttribute("role");
  });

  it("falls back to initials when the image fails to load", async () => {
    render(Avatar, { props: { src: "/broken.jpg", name: "Bea Nakamura" } });
    expect(screen.queryByText("BN")).not.toBeInTheDocument();
    await fireEvent.error(screen.getByRole("img", { name: "Bea Nakamura" }));
    expect(screen.getByText("BN")).toBeInTheDocument();
  });

  it("resets the failed state and retries the image when src changes", async () => {
    const { rerender, container } = render(Avatar, { props: { src: "/broken.jpg", name: "Bea Nakamura" } });
    await fireEvent.error(container.querySelector("img")!);
    expect(container.querySelector("img")).not.toBeInTheDocument();

    await rerender({ src: "/good.jpg", name: "Bea Nakamura" });
    expect(container.querySelector("img")).toHaveAttribute("src", "/good.jpg");
  });

  it("defaults to size=md", () => {
    const { container } = render(Avatar, { props: { name: "Bea" } });
    expect(container.querySelector(".stance-avatar")).toHaveAttribute("data-size", "md");
  });

  it.each<AvatarSize>(["sm", "md", "lg", "xl"])("applies data-size=%s", (size) => {
    const { container } = render(Avatar, { props: { name: "Bea", size } });
    expect(container.querySelector(".stance-avatar")).toHaveAttribute("data-size", size);
  });

  it("merges a consumer class with the internal class list", () => {
    const { container } = render(Avatar, { props: { name: "Bea", class: "mt-4" } });
    const avatar = container.querySelector(".stance-avatar")!;
    expect(avatar.className).toContain("stance-avatar");
    expect(avatar.className).toContain("mt-4");
  });

  it("never emits !important in its styles", () => {
    expect(avatarSource).not.toContain("!important");
  });

  it("wraps default styles in :where() to keep specificity at zero", () => {
    const styleBlock = avatarSource.slice(avatarSource.indexOf("<style"));
    expect(styleBlock).not.toMatch(/^\.stance-avatar/m);
  });

  describe.each(themes)("axe: $name theme", (theme) => {
    it.each(modes)("no violations in %s mode (image)", async (mode) => {
      const cleanup = withThemeStyle(theme);
      const { container } = render(Avatar, { props: { src: "/bea.jpg", name: "Bea Nakamura" } });
      container.setAttribute("data-theme", theme.name);
      if (mode === "dark") container.classList.add("dark");

      const results = await runAxe(container);
      expect(results).toHaveNoViolations();
      cleanup();
    });

    it.each(modes)("no violations in %s mode (initials fallback)", async (mode) => {
      const cleanup = withThemeStyle(theme);
      const { container } = render(Avatar, { props: { name: "Bea Nakamura" } });
      container.setAttribute("data-theme", theme.name);
      if (mode === "dark") container.classList.add("dark");

      const results = await runAxe(container);
      expect(results).toHaveNoViolations();
      cleanup();
    });

    it.each(modes)("no violations in %s mode (decorative, no name)", async (mode) => {
      const cleanup = withThemeStyle(theme);
      const { container } = render(Avatar);
      container.setAttribute("data-theme", theme.name);
      if (mode === "dark") container.classList.add("dark");

      const results = await runAxe(container);
      expect(results).toHaveNoViolations();
      cleanup();
    });
  });
});
