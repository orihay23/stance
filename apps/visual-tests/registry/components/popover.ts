import type { ComponentSpec } from "../types";

// PopoverContent teleports to the shared overlay root, same reasoning as
// Dialog — full-page captures, section-scoped clicks.
export const popover: ComponentSpec = {
  component: "Popover",
  variants: [
    {
      variantTitle: "Light + Dark",
      captures: [
        {
          name: "light-info-open",
          interactionSelector: "[data-theme]:not(.dark)",
          beforeCapture: async (scope) => {
            await scope.getByRole("button", { name: "Show info" }).click();
          },
        },
        {
          name: "dark-info-open",
          interactionSelector: "[data-theme].dark",
          beforeCapture: async (scope) => {
            await scope.getByRole("button", { name: "Show info" }).click();
          },
        },
        {
          name: "light-modal-confirm-open",
          interactionSelector: "[data-theme]:not(.dark)",
          beforeCapture: async (scope) => {
            await scope.getByRole("button", { name: "Remove item" }).click();
          },
        },
      ],
    },
  ],
};
