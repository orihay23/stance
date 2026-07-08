import type { ComponentSpec } from "../types";
import { lightDarkCaptures } from "../types";

export const collapsible: ComponentSpec = {
  component: "Collapsible",
  variants: [
    {
      // Renders already expanded — covers theme x mode x expanded in one
      // shot, plus a dedicated collapsed capture below so expanded-vs-
      // collapsed is a distinct, visually-checked state (mirrors Accordion).
      variantTitle: "Light + Dark",
      captures: [
        ...lightDarkCaptures(),
        {
          name: "light-collapsed",
          selector: "[data-theme]:not(.dark)",
          beforeCapture: async (scope) => {
            await scope.getByRole("button", { name: "What's included in the Pro plan?" }).click();
          },
        },
      ],
    },
    { variantTitle: "Disabled", captures: [{ name: "default", selector: "[data-theme]" }] },
  ],
};
