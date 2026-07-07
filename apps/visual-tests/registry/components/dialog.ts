import type { ComponentSpec } from "../types";

// Dialog teleports its panel to the shared overlay root (outside the
// themed section's own DOM subtree), so every capture here is full-page
// (no `selector`) — only the click that opens it is scoped to the right
// section via `interactionSelector`, since "Open dialog" appears in both
// the light and dark sections.
export const dialog: ComponentSpec = {
  component: "Dialog",
  variants: [
    {
      variantTitle: "Light + Dark",
      captures: [
        {
          name: "light-basic-open",
          interactionSelector: "[data-theme]:not(.dark)",
          beforeCapture: async (scope) => {
            await scope.getByRole("button", { name: "Open dialog" }).click();
          },
        },
        {
          name: "dark-basic-open",
          interactionSelector: "[data-theme].dark",
          beforeCapture: async (scope) => {
            await scope.getByRole("button", { name: "Open dialog" }).click();
          },
        },
        {
          name: "light-alertdialog-open",
          interactionSelector: "[data-theme]:not(.dark)",
          beforeCapture: async (scope) => {
            await scope.getByRole("button", { name: "Delete account" }).click();
          },
        },
      ],
    },
  ],
};
