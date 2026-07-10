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
    {
      // Exercises DropdownMenuContextTrigger: a real right-click on the
      // bound surface, rather than a trigger button click, confirming the
      // menu anchors at the pointer position and themes correctly when
      // opened via this mode.
      variantTitle: "Context menu (right-click / long-press)",
      captures: [
        {
          name: "light-context-open",
          interactionSelector: "[data-theme]:not(.dark)",
          beforeCapture: async (scope) => {
            await scope.getByText("Right-click (or long-press) here").click({ button: "right" });
          },
        },
        {
          name: "dark-context-open",
          interactionSelector: "[data-theme].dark",
          beforeCapture: async (scope) => {
            await scope.getByText("Right-click (or long-press) here").click({ button: "right" });
          },
        },
      ],
    },
  ],
};
