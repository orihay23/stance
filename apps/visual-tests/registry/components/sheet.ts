import type { Locator, Page } from "@playwright/test";
import type { ComponentSpec } from "../types";
import { densityInteractionCaptures } from "../types";

// Sheet teleports its panel to the shared overlay root (outside the themed
// section's own DOM subtree), so every capture here is full-page (no
// `selector`) — only the click that opens it is scoped to the right section
// via `interactionSelector`, since each "Open <side>" button appears in
// both the light and dark sections. One capture per side in light mode
// (to confirm each edge anchors and sizes correctly) plus one dark capture
// (to confirm theming), rather than exhaustively multiplying every side by
// every mode.
//
// The panel slides in over --stance-motion-duration (150ms default) — the
// harness's own built-in 150ms post-beforeCapture wait sits right at that
// boundary, so each opener here adds explicit extra settle time rather than
// risk a screenshot mid-slide.
function openSide(name: string) {
  return async (scope: Locator | Page) => {
    await scope.getByRole("button", { name }).click();
    // Always a Locator here — every capture below sets interactionSelector,
    // per CaptureSpec's own contract (see types.ts) — so `scope` is never
    // the bare Page, which has no .page() accessor of its own.
    await (scope as Locator).page().waitForTimeout(200);
  };
}

export const sheet: ComponentSpec = {
  component: "Sheet",
  variants: [
    {
      variantTitle: "Light + Dark",
      captures: [
        {
          name: "light-right-open",
          interactionSelector: "[data-theme]:not(.dark)",
          beforeCapture: openSide("Open right"),
        },
        {
          name: "light-left-open",
          interactionSelector: "[data-theme]:not(.dark)",
          beforeCapture: openSide("Open left"),
        },
        {
          name: "light-top-open",
          interactionSelector: "[data-theme]:not(.dark)",
          beforeCapture: openSide("Open top"),
        },
        {
          name: "light-bottom-open",
          interactionSelector: "[data-theme]:not(.dark)",
          beforeCapture: openSide("Open bottom"),
        },
        {
          name: "dark-right-open",
          interactionSelector: "[data-theme].dark",
          beforeCapture: openSide("Open right"),
        },
      ],
    },
    {
      variantTitle: "Density",
      captures: densityInteractionCaptures((section) => openSide("Open right")(section)),
    },
  ],
};
