import type { ComponentSpec } from "../types";

// DropdownMenuContent teleports to the shared overlay root — full-page
// captures, section-scoped clicks (both sections' trigger is "Actions").
export const dropdownmenu: ComponentSpec = {
  component: "DropdownMenu",
  variants: [
    {
      variantTitle: "Light + Dark",
      captures: [
        {
          name: "light-open",
          interactionSelector: "[data-theme]:not(.dark)",
          beforeCapture: async (scope) => {
            await scope.getByRole("button", { name: "Actions" }).click();
          },
        },
        {
          name: "dark-open",
          interactionSelector: "[data-theme].dark",
          beforeCapture: async (scope) => {
            await scope.getByRole("button", { name: "Actions" }).click();
          },
        },
      ],
    },
  ],
};
