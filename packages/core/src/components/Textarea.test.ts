/**
 * Manual keyboard-nav checklist (verify by hand in the playground, in
 * addition to the automated checks below):
 *
 * 1. Tab into a textarea — a visible focus ring (using --stance-color-ring)
 *    appears around it, in every theme, in both light and dark mode.
 * 2. In fixed (non-auto-grow) mode, drag the native resize handle
 *    (bottom-right corner) — it still works; we don't disable native
 *    resize unless auto-grow is on.
 * 3. In auto-grow mode, type enough text to exceed `maxRows` — the
 *    textarea stops growing and becomes internally scrollable. Arrow
 *    keys / Page Up / Page Down / Ctrl+Home / Ctrl+End must still move
 *    the caret and scroll the content into view, exactly like a plain
 *    scrollable textarea — auto-grow must not trap or break this.
 * 4. Tab past a disabled textarea — it's skipped entirely (removed from
 *    tab order).
 * 5. Tab to an invalid textarea with an error message — a screen reader
 *    announces the error text as part of the field's description.
 */
import { render, screen } from "@testing-library/vue";
import { fireEvent } from "@testing-library/vue";
import { nextTick } from "vue";
import { describe, expect, it } from "vitest";
import { neutral } from "@stance/themes";
import { compileTheme } from "@stance/themes";
import Textarea from "./Textarea.vue";
import textareaSource from "./Textarea.vue?raw";
import { runAxe } from "../../tests/axe-matcher";

const themes = [neutral];
const modes = ["light", "dark"] as const;

function withThemeStyle(theme: (typeof themes)[number]) {
  const style = document.createElement("style");
  style.textContent = compileTheme(theme);
  document.head.appendChild(style);
  return () => style.remove();
}

/** jsdom never computes real layout, so scrollHeight is always 0 — stub it. */
function stubScrollHeight(el: HTMLTextAreaElement, value: number) {
  Object.defineProperty(el, "scrollHeight", { configurable: true, value });
}

/** Pin the CSS values resize() reads via getComputedStyle to known numbers. */
function pinBoxMetrics(el: HTMLTextAreaElement) {
  el.style.lineHeight = "20px";
  el.style.paddingTop = "8px";
  el.style.paddingBottom = "8px";
  el.style.borderTopWidth = "1px";
  el.style.borderBottomWidth = "1px";
}

describe("Textarea", () => {
  it("reflects modelValue as the value", () => {
    render(Textarea, { props: { modelValue: "hello" }, attrs: { "aria-label": "Bio" } });
    expect(screen.getByRole("textbox", { name: "Bio" })).toHaveValue("hello");
  });

  it("emits update:modelValue on input", async () => {
    const { emitted, getByRole } = render(Textarea, { attrs: { "aria-label": "Bio" } });
    const textarea = getByRole("textbox", { name: "Bio" });
    await fireEvent.update(textarea, "abc");
    expect(emitted("update:modelValue")?.[0]).toEqual(["abc"]);
  });

  it("defaults to 3 rows", () => {
    render(Textarea, { attrs: { "aria-label": "Bio" } });
    expect(screen.getByRole("textbox", { name: "Bio" })).toHaveAttribute("rows", "3");
  });

  it("respects a custom rows value", () => {
    render(Textarea, { props: { rows: 6 }, attrs: { "aria-label": "Bio" } });
    expect(screen.getByRole("textbox", { name: "Bio" })).toHaveAttribute("rows", "6");
  });

  it("respects disabled, readonly, and required", () => {
    render(Textarea, {
      props: { disabled: true, readonly: true, required: true },
      attrs: { "aria-label": "Bio" },
    });
    const textarea = screen.getByRole("textbox", { name: "Bio", hidden: true });
    expect(textarea).toBeDisabled();
    expect(textarea).toHaveAttribute("readonly");
    expect(textarea).toBeRequired();
  });

  it("sets aria-invalid, without a dangling aria-describedby if there's no error slot", () => {
    render(Textarea, { props: { invalid: true }, attrs: { "aria-label": "Bio" } });
    const textarea = screen.getByRole("textbox", { name: "Bio" });
    expect(textarea).toHaveAttribute("aria-invalid", "true");
    expect(textarea).not.toHaveAttribute("aria-describedby");
  });

  it("wires aria-describedby to the error slot's id when invalid and an error slot is provided", () => {
    render(Textarea, {
      props: { invalid: true },
      attrs: { "aria-label": "Bio" },
      slots: { error: "Bio is required" },
    });
    const textarea = screen.getByRole("textbox", { name: "Bio" });
    const describedBy = textarea.getAttribute("aria-describedby");
    expect(describedBy).toBeTruthy();
    expect(document.getElementById(describedBy!)).toHaveTextContent("Bio is required");
  });

  it("merges a consumer class with the internal class list", () => {
    render(Textarea, { props: { class: "mt-4" }, attrs: { "aria-label": "Bio" } });
    const textarea = screen.getByRole("textbox", { name: "Bio" });
    expect(textarea.className).toContain("stance-textarea");
    expect(textarea.className).toContain("mt-4");
  });

  it("does not touch inline height/overflow in fixed (non-auto-grow) mode", async () => {
    const { getByRole } = render(Textarea, { attrs: { "aria-label": "Bio" } });
    const textarea = getByRole("textbox", { name: "Bio" }) as HTMLTextAreaElement;
    stubScrollHeight(textarea, 500);
    await fireEvent.update(textarea, "some text");
    expect(textarea.style.height).toBe("");
  });

  it("grows to fit content up to maxRows, then caps height and switches to internal scroll", async () => {
    const { getByRole } = render(Textarea, {
      props: { autoGrow: true, maxRows: 5 },
      attrs: { "aria-label": "Bio" },
    });
    const textarea = getByRole("textbox", { name: "Bio" }) as HTMLTextAreaElement;
    pinBoxMetrics(textarea);

    // Content that fits within the cap: maxHeight = 20*5 + 16 + 2 = 118px.
    stubScrollHeight(textarea, 60);
    await fireEvent.update(textarea, "a couple lines");
    await nextTick();
    expect(textarea.style.height).toBe("62px"); // scrollHeight(60) + borderY(2)
    expect(textarea.style.overflowY).toBe("hidden");

    // Content that exceeds the cap: should clamp to maxHeight and scroll.
    stubScrollHeight(textarea, 400);
    await fireEvent.update(textarea, "way more text than fits");
    await nextTick();
    expect(textarea.style.height).toBe("118px");
    expect(textarea.style.overflowY).toBe("auto");
  });

  it("re-runs the resize calculation when modelValue changes externally", async () => {
    const { getByRole, rerender } = render(Textarea, {
      props: { autoGrow: true, maxRows: 5, modelValue: "" },
      attrs: { "aria-label": "Bio" },
    });
    const textarea = getByRole("textbox", { name: "Bio" }) as HTMLTextAreaElement;
    pinBoxMetrics(textarea);
    stubScrollHeight(textarea, 400);

    await rerender({ modelValue: "programmatically set, much longer than the box" });
    await nextTick();
    expect(textarea.style.height).toBe("118px");
    expect(textarea.style.overflowY).toBe("auto");
  });

  it("never emits !important in its styles", () => {
    expect(textareaSource).not.toContain("!important");
  });

  it("wraps default styles in :where() to keep specificity at zero", () => {
    const styleBlock = textareaSource.slice(textareaSource.indexOf("<style"));
    expect(styleBlock).not.toMatch(/^\.stance-textarea/m);
  });

  describe.each(themes)("axe: $name theme", (theme) => {
    it.each(modes)("no violations in %s mode (default textarea)", async (mode) => {
      const cleanup = withThemeStyle(theme);
      const { container } = render(Textarea, { attrs: { "aria-label": "Bio" } });
      container.setAttribute("data-theme", theme.name);
      if (mode === "dark") container.classList.add("dark");

      const results = await runAxe(container);
      expect(results).toHaveNoViolations();
      cleanup();
    });
  });

  it("no axe violations for an invalid textarea with an error message (neutral/light)", async () => {
    const cleanup = withThemeStyle(neutral);
    const { container } = render(Textarea, {
      props: { invalid: true },
      attrs: { "aria-label": "Bio" },
      slots: { error: "Bio is required" },
    });
    container.setAttribute("data-theme", "neutral");

    const results = await runAxe(container);
    expect(results).toHaveNoViolations();
    cleanup();
  });

  it("no axe violations in auto-grow mode (neutral/light)", async () => {
    const cleanup = withThemeStyle(neutral);
    const { container } = render(Textarea, {
      props: { autoGrow: true, maxRows: 5 },
      attrs: { "aria-label": "Bio" },
    });
    container.setAttribute("data-theme", "neutral");

    const results = await runAxe(container);
    expect(results).toHaveNoViolations();
    cleanup();
  });
});
