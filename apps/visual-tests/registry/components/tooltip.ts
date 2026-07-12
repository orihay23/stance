import type { ComponentSpec } from "../types";
import { densityInteractionCaptures } from "../types";

// Tooltip content teleports to the shared overlay root, and is shown on
// hover/focus rather than click — full-page captures, section-scoped hover.
export const tooltip: ComponentSpec = {
  component: "Tooltip",
  variants: [
    {
      variantTitle: "Light + Dark",
      captures: [
        {
          name: "light-visible",
          interactionSelector: "[data-theme]:not(.dark)",
          beforeCapture: async (scope) => {
            await scope.getByRole("button", { name: "Save" }).hover();
          },
        },
        {
          name: "dark-visible",
          interactionSelector: "[data-theme].dark",
          beforeCapture: async (scope) => {
            await scope.getByRole("button", { name: "Save" }).hover();
          },
        },
      ],
    },
    {
      variantTitle: "Density",
      captures: densityInteractionCaptures((section) => section.getByRole("button", { name: "Save" }).hover()),
    },
  ],
};
