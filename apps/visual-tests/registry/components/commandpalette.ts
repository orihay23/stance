import type { Locator, Page } from "@playwright/test";
import type { ComponentSpec } from "../types";

// CommandPalette teleports its panel to the shared overlay root (outside
// the themed section's own DOM subtree), same as Dialog — every capture
// here is full-page (no `selector`), and the click that opens it is scoped
// to the right section via `interactionSelector`, since "Open command
// palette" appears in both the light and dark sections.
//
// Each CommandPaletteItem highlights on real mouseenter (same convention
// as ComboboxOption/DropdownMenuItem), and the panel opens right where the
// trigger click's pointer already is — so without an explicit mouse move
// afterward, whether the first item ends up spuriously highlighted in the
// baseline depends on exactly where Playwright's click happened to leave
// the cursor, which isn't guaranteed stable across runs. Moving the mouse
// to a neutral corner after opening removes that source of flakiness.
async function openAndClearHover(scope: Locator | Page) {
  await scope.getByRole("button", { name: "Open command palette" }).click();
  // Always a Locator here — both captures below set interactionSelector,
  // per CaptureSpec's own contract (see types.ts) — so `scope` is never
  // the bare Page, which has no .page() accessor of its own.
  await (scope as Locator).page().mouse.move(0, 0);
}

export const commandpalette: ComponentSpec = {
  component: "CommandPalette",
  variants: [
    {
      variantTitle: "Light + Dark",
      captures: [
        {
          name: "light-open",
          interactionSelector: "[data-theme]:not(.dark)",
          beforeCapture: openAndClearHover,
        },
        {
          name: "dark-open",
          interactionSelector: "[data-theme].dark",
          beforeCapture: openAndClearHover,
        },
      ],
    },
  ],
};
