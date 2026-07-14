import { describe, expect, it } from "vitest";
import { detectThemeContext } from "./theme-context";

function el(html: string): Element {
  const container = document.createElement("div");
  container.innerHTML = html;
  return container.firstElementChild!;
}

describe("detectThemeContext", () => {
  it("returns all-null/false when no ancestor carries any theme attribute", () => {
    const trigger = el(`<div><button id="t">Open</button></div>`);
    expect(detectThemeContext(trigger.querySelector("#t"))).toEqual({
      theme: null,
      palette: null,
      density: null,
      dark: false,
    });
  });

  it("detects the legacy data-theme and co-located .dark class", () => {
    const trigger = el(`<div data-theme="neutral" class="dark"><button id="t">Open</button></div>`);
    const ctx = detectThemeContext(trigger.querySelector("#t"));
    expect(ctx.theme).toBe("neutral");
    expect(ctx.dark).toBe(true);
    expect(ctx.palette).toBeNull();
    expect(ctx.density).toBeNull();
  });

  it("detects data-theme-palette and data-theme-density independently, at different ancestor depths", () => {
    const trigger = el(
      `<div data-theme-palette="neutral"><div data-theme-density="compact"><button id="t">Open</button></div></div>`,
    );
    const ctx = detectThemeContext(trigger.querySelector("#t"));
    expect(ctx.palette).toBe("neutral");
    expect(ctx.density).toBe("compact");
    expect(ctx.theme).toBeNull();
    expect(ctx.dark).toBe(false);
  });

  it("detects .dark co-located with data-theme-palette when there's no legacy data-theme", () => {
    const trigger = el(`<div data-theme-palette="neutral" class="dark"><button id="t">Open</button></div>`);
    const ctx = detectThemeContext(trigger.querySelector("#t"));
    expect(ctx.palette).toBe("neutral");
    expect(ctx.dark).toBe(true);
  });

  it("prefers the legacy data-theme element for .dark when both are present on different ancestors", () => {
    const trigger = el(
      `<div data-theme="neutral" class="dark"><div data-theme-palette="serious"><button id="t">Open</button></div></div>`,
    );
    const ctx = detectThemeContext(trigger.querySelector("#t"));
    expect(ctx.theme).toBe("neutral");
    expect(ctx.palette).toBe("serious");
    expect(ctx.dark).toBe(true);
  });

  it("returns all-null/false for a null/undefined anchor", () => {
    expect(detectThemeContext(null)).toEqual({ theme: null, palette: null, density: null, dark: false });
    expect(detectThemeContext(undefined)).toEqual({ theme: null, palette: null, density: null, dark: false });
  });

  // Regression test: Node SSR (no jsdom) has no `HTMLElement` global at
  // all — `x instanceof HTMLElement` throws a bare ReferenceError there
  // (unlike `typeof HTMLElement`, which safely resolves to "undefined"),
  // and every overlay component calls this eagerly at setup time via
  // useOverlayThemeContext regardless of whether it ever opens. Found by
  // hand: adding a <Popover> to the docs site's SSR-rendered nav bar threw
  // this exact error on every page. Deleting the global here is the
  // closest a jsdom-based test can get to reproducing a real Node SSR
  // environment without spinning up an actual server-render pass.
  it("does not throw when HTMLElement is not a global (Node SSR)", () => {
    const original = globalThis.HTMLElement;
    // @ts-expect-error -- deliberately simulating an environment without HTMLElement
    delete globalThis.HTMLElement;
    try {
      expect(detectThemeContext(null)).toEqual({ theme: null, palette: null, density: null, dark: false });

      const trigger = el(`<div data-theme="neutral" class="dark"><button id="t">Open</button></div>`);
      expect(detectThemeContext(trigger.querySelector("#t"))).toEqual({
        theme: null,
        palette: null,
        density: null,
        dark: false,
      });
    } finally {
      globalThis.HTMLElement = original;
    }
  });
});
