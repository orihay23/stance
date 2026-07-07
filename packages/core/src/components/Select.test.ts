/**
 * Manual keyboard-nav checklist (verify by hand in the playground, in
 * addition to the automated checks below):
 *
 * 1. Tab into a select — a visible focus ring (using --stance-color-ring)
 *    appears around the trigger, in every theme, in both light and dark
 *    mode.
 * 2. With a select focused, press Space or Enter (or click) — the native
 *    options popup opens. This project intentionally does not restyle
 *    that popup (see the Select design discussion) — in Firefox/Safari
 *    it renders with OS-default appearance, not our theme tokens. Confirm
 *    it's still fully operable (arrow keys move the highlighted option,
 *    typing jumps to a matching option, Enter/Escape close it) — that
 *    behavior is 100% native and isn't something our code implements.
 * 3. Tab past a disabled select — it's skipped entirely (removed from tab
 *    order).
 * 4. Tab to an invalid select with an error message — a screen reader
 *    announces the error text as part of the field's description.
 */
import { render, screen } from "@testing-library/vue";
import { fireEvent } from "@testing-library/vue";
import { describe, expect, it } from "vitest";
import { allThemes, neutral } from "@stance/themes";
import { compileTheme } from "@stance/themes";
import Select from "./Select.vue";
import selectSource from "./Select.vue?raw";
import { runAxe } from "../../tests/axe-matcher";

const themes = allThemes;
const modes = ["light", "dark"] as const;

const options = '<option value="a">Apples</option><option value="b">Bananas</option>';

function withThemeStyle(theme: (typeof themes)[number]) {
  const style = document.createElement("style");
  style.textContent = compileTheme(theme);
  document.head.appendChild(style);
  return () => style.remove();
}

describe("Select", () => {
  it("renders its option slot content", () => {
    render(Select, { attrs: { "aria-label": "Fruit" }, slots: { default: options } });
    const select = screen.getByRole("combobox", { name: "Fruit" });
    expect(select.querySelectorAll("option")).toHaveLength(2);
  });

  it("renders a disabled placeholder option", () => {
    render(Select, {
      props: { placeholder: "Choose a fruit" },
      attrs: { "aria-label": "Fruit" },
      slots: { default: options },
    });
    const placeholderOption = screen.getByText("Choose a fruit") as HTMLOptionElement;
    expect(placeholderOption.tagName).toBe("OPTION");
    expect(placeholderOption).toBeDisabled();
  });

  it("reflects modelValue as the selected option", () => {
    render(Select, {
      props: { modelValue: "b" },
      attrs: { "aria-label": "Fruit" },
      slots: { default: options },
    });
    expect(screen.getByRole("combobox", { name: "Fruit" })).toHaveValue("b");
  });

  it("emits update:modelValue when the selection changes", async () => {
    const { emitted, getByRole } = render(Select, {
      attrs: { "aria-label": "Fruit" },
      slots: { default: options },
    });
    const select = getByRole("combobox", { name: "Fruit" });
    await fireEvent.update(select, "b");
    expect(emitted("update:modelValue")?.[0]).toEqual(["b"]);
  });

  it("respects disabled and required", () => {
    render(Select, {
      props: { disabled: true, required: true },
      attrs: { "aria-label": "Fruit" },
      slots: { default: options },
    });
    const select = screen.getByRole("combobox", { name: "Fruit", hidden: true });
    expect(select).toBeDisabled();
    expect(select).toBeRequired();
  });

  it("sets aria-invalid when invalid, without a dangling aria-describedby if there's no error slot", () => {
    render(Select, {
      props: { invalid: true },
      attrs: { "aria-label": "Fruit" },
      slots: { default: options },
    });
    const select = screen.getByRole("combobox", { name: "Fruit" });
    expect(select).toHaveAttribute("aria-invalid", "true");
    expect(select).not.toHaveAttribute("aria-describedby");
  });

  it("wires aria-describedby to the error slot's id when invalid and an error slot is provided", () => {
    render(Select, {
      props: { invalid: true },
      attrs: { "aria-label": "Fruit" },
      slots: { default: options, error: "Please choose a fruit" },
    });
    const select = screen.getByRole("combobox", { name: "Fruit" });
    const describedBy = select.getAttribute("aria-describedby");
    expect(describedBy).toBeTruthy();
    expect(document.getElementById(describedBy!)).toHaveTextContent("Please choose a fruit");
  });

  it("forwards $attrs to the real <select>, not the wrapper", () => {
    const { container } = render(Select, {
      attrs: { "aria-label": "Fruit", name: "fruit" },
      slots: { default: options },
    });
    const select = container.querySelector("select");
    const wrapper = container.querySelector(".stance-select-wrapper");
    expect(select).toHaveAttribute("name", "fruit");
    expect(select).toHaveAccessibleName("Fruit");
    expect(wrapper).not.toHaveAttribute("name");
    expect(wrapper).not.toHaveAttribute("aria-label");
  });

  it("merges a consumer class with the internal wrapper class list", () => {
    const { container } = render(Select, {
      props: { class: "mt-4" },
      attrs: { "aria-label": "Fruit" },
      slots: { default: options },
    });
    const wrapper = container.querySelector(".stance-select-wrapper");
    expect(wrapper?.className).toContain("stance-select-wrapper");
    expect(wrapper?.className).toContain("mt-4");
  });

  it("never emits !important in its styles", () => {
    expect(selectSource).not.toContain("!important");
  });

  it("wraps default styles in :where() to keep specificity at zero", () => {
    const styleBlock = selectSource.slice(selectSource.indexOf("<style"));
    expect(styleBlock).not.toMatch(/^\.stance-select/m);
  });

  describe.each(themes)("axe: $name theme", (theme) => {
    it.each(modes)("no violations in %s mode (default select)", async (mode) => {
      const cleanup = withThemeStyle(theme);
      const { container } = render(Select, { attrs: { "aria-label": "Fruit" }, slots: { default: options } });
      container.setAttribute("data-theme", theme.name);
      if (mode === "dark") container.classList.add("dark");

      const results = await runAxe(container);
      expect(results).toHaveNoViolations();
      cleanup();
    });
  });

  it("no axe violations for an invalid select with an error message (neutral/light)", async () => {
    const cleanup = withThemeStyle(neutral);
    const { container } = render(Select, {
      props: { invalid: true },
      attrs: { "aria-label": "Fruit" },
      slots: { default: options, error: "Please choose a fruit" },
    });
    container.setAttribute("data-theme", "neutral");

    const results = await runAxe(container);
    expect(results).toHaveNoViolations();
    cleanup();
  });

  it("no axe violations when disabled (neutral/light)", async () => {
    const cleanup = withThemeStyle(neutral);
    const { container } = render(Select, {
      props: { disabled: true },
      attrs: { "aria-label": "Fruit" },
      slots: { default: options },
    });
    container.setAttribute("data-theme", "neutral");

    const results = await runAxe(container);
    expect(results).toHaveNoViolations();
    cleanup();
  });
});
