/**
 * Manual keyboard-nav checklist (verify by hand in the playground, in
 * addition to the automated checks below):
 *
 * 1. Tab into an input — a visible focus ring (using --stance-color-ring)
 *    appears around the whole field (including prefix/suffix icons), in
 *    every theme, in both light and dark mode.
 * 2. Type into the field — the value updates and prefix/suffix icons stay
 *    in place without shifting the caret or clipping text.
 * 3. Tab to an invalid input with an error message — a screen reader
 *    announces the error text as part of the field's description (not
 *    silently, and not only visually).
 * 4. Tab to a disabled input — it's skipped entirely (removed from tab
 *    order).
 * 5. Tab to a readonly input — it receives focus (not skipped) but typing
 *    does not change its value.
 * 6. In a password field, confirm the OS/browser's native reveal or
 *    autofill affordances still work (we don't override native `<input>`
 *    behavior).
 */
import { render, screen } from "@testing-library/vue";
import { fireEvent } from "@testing-library/vue";
import { describe, expect, it } from "vitest";
import Input, { type InputType } from "./Input.vue";
import inputSource from "./Input.vue?raw";
import { runAxe } from "../../tests/axe-matcher";
import { compactDensity, neutralPalette, palettes, withPaletteAndDensityStyle, withPaletteStyle } from "../../tests/theme-test-utils";

const modes = ["light", "dark"] as const;

describe("Input", () => {
  it("defaults to type=text", () => {
    render(Input, { attrs: { "aria-label": "Name" } });
    expect(screen.getByRole("textbox", { name: "Name" })).toHaveAttribute("type", "text");
  });

  it.each<InputType>(["text", "email", "password", "number"])("respects type=%s", (type) => {
    const { container } = render(Input, { props: { type }, attrs: { "aria-label": "Field" } });
    const input = container.querySelector("input");
    expect(input).toHaveAttribute("type", type);
  });

  it("reflects modelValue as the input's value", () => {
    render(Input, { props: { modelValue: "hello" }, attrs: { "aria-label": "Name" } });
    expect(screen.getByRole("textbox", { name: "Name" })).toHaveValue("hello");
  });

  it("emits update:modelValue on input", async () => {
    const { emitted, getByRole } = render(Input, { attrs: { "aria-label": "Name" } });
    const input = getByRole("textbox", { name: "Name" });
    await fireEvent.update(input, "abc");
    expect(emitted("update:modelValue")?.[0]).toEqual(["abc"]);
  });

  it("respects disabled, readonly, and required", () => {
    render(Input, {
      props: { disabled: true, readonly: true, required: true },
      attrs: { "aria-label": "Name" },
    });
    const input = screen.getByRole("textbox", { name: "Name", hidden: true });
    expect(input).toBeDisabled();
    expect(input).toHaveAttribute("readonly");
    expect(input).toHaveAttribute("required");
  });

  it("sets aria-invalid when invalid, without a dangling aria-describedby if there's no error slot", () => {
    render(Input, { props: { invalid: true }, attrs: { "aria-label": "Name" } });
    const input = screen.getByRole("textbox", { name: "Name" });
    expect(input).toHaveAttribute("aria-invalid", "true");
    expect(input).not.toHaveAttribute("aria-describedby");
  });

  it("wires aria-describedby to the error slot's id when invalid and an error slot is provided", () => {
    render(Input, {
      props: { invalid: true },
      attrs: { "aria-label": "Name" },
      slots: { error: "Name is required" },
    });
    const input = screen.getByRole("textbox", { name: "Name" });
    const describedBy = input.getAttribute("aria-describedby");
    expect(describedBy).toBeTruthy();
    const errorEl = document.getElementById(describedBy!);
    expect(errorEl).toHaveTextContent("Name is required");
  });

  it("does not render or wire the error slot when not invalid", () => {
    render(Input, {
      props: { invalid: false },
      attrs: { "aria-label": "Name" },
      slots: { error: "Name is required" },
    });
    const input = screen.getByRole("textbox", { name: "Name" });
    expect(input).not.toHaveAttribute("aria-describedby");
    expect(screen.queryByText("Name is required")).not.toBeInTheDocument();
  });

  it("uses a provided id verbatim, and auto-generates one when omitted", () => {
    const { container: withId } = render(Input, {
      props: { id: "email-field" },
      attrs: { "aria-label": "Email" },
    });
    expect(withId.querySelector("input")).toHaveAttribute("id", "email-field");

    const { container: withoutId } = render(Input, { attrs: { "aria-label": "Email" } });
    const input = withoutId.querySelector("input");
    expect(input?.id).toBeTruthy();
  });

  it("renders prefix and suffix slot content", () => {
    render(Input, {
      attrs: { "aria-label": "Amount" },
      slots: { prefix: "$", suffix: "USD" },
    });
    expect(screen.getByText("$")).toBeInTheDocument();
    expect(screen.getByText("USD")).toBeInTheDocument();
  });

  it("forwards $attrs to the real <input>, not the wrapper div", () => {
    const { container } = render(Input, {
      attrs: { "aria-label": "Email", name: "email", autocomplete: "email" },
    });
    const input = container.querySelector("input");
    const wrapper = container.querySelector(".stance-input-wrapper");
    expect(input).toHaveAttribute("name", "email");
    expect(input).toHaveAttribute("autocomplete", "email");
    expect(input).toHaveAccessibleName("Email");
    expect(wrapper).not.toHaveAttribute("name");
    expect(wrapper).not.toHaveAttribute("aria-label");
  });

  it("merges a consumer class with the internal wrapper class list", () => {
    const { container } = render(Input, {
      props: { class: "mt-4" },
      attrs: { "aria-label": "Name" },
    });
    const wrapper = container.querySelector(".stance-input-wrapper");
    expect(wrapper?.className).toContain("stance-input-wrapper");
    expect(wrapper?.className).toContain("mt-4");
  });

  it("never emits !important in its styles", () => {
    expect(inputSource).not.toContain("!important");
  });

  it("wraps default styles in :where() to keep specificity at zero", () => {
    const styleBlock = inputSource.slice(inputSource.indexOf("<style"));
    expect(styleBlock).not.toMatch(/^\.stance-input/m);
  });

  describe.each(palettes)("axe: $name palette", (palette) => {
    it.each(modes)("no violations in %s mode (default input)", async (mode) => {
      const cleanup = withPaletteStyle(palette);
      const { container } = render(Input, { attrs: { "aria-label": "Name" } });
      container.setAttribute("data-theme-palette", palette.name);
      if (mode === "dark") container.classList.add("dark");

      const results = await runAxe(container);
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
    const { container } = render(Input, { attrs: { "aria-label": "Name" } });
    container.setAttribute("data-theme-palette", "neutral");
    container.setAttribute("data-theme-density", "compact");
    if (mode === "dark") container.classList.add("dark");

    const results = await runAxe(container);
    expect(results).toHaveNoViolations();
    cleanup();
  });

  it("no axe violations for an invalid input with an error message (neutral/light)", async () => {
    const cleanup = withPaletteStyle(neutralPalette);
    const { container } = render(Input, {
      props: { invalid: true },
      attrs: { "aria-label": "Name" },
      slots: { error: "Name is required" },
    });
    container.setAttribute("data-theme-palette", "neutral");

    const results = await runAxe(container);
    expect(results).toHaveNoViolations();
    cleanup();
  });

  it("no axe violations for an input with prefix/suffix icons (neutral/light)", async () => {
    const cleanup = withPaletteStyle(neutralPalette);
    const { container } = render(Input, {
      attrs: { "aria-label": "Amount" },
      slots: { prefix: '<span aria-hidden="true">$</span>', suffix: '<span aria-hidden="true">USD</span>' },
    });
    container.setAttribute("data-theme-palette", "neutral");

    const results = await runAxe(container);
    expect(results).toHaveNoViolations();
    cleanup();
  });
});
