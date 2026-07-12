import type { ComponentSpec } from "../types";
import { densityCaptures, lightDarkCaptures } from "../types";

export const accordion: ComponentSpec = {
  component: "Accordion",
  variants: [
    {
      // Renders with the "Shipping" item already expanded — covers theme x
      // mode x expanded in one shot, plus a dedicated collapsed capture
      // below to make expanded-vs-collapsed a distinct, visually-checked
      // state rather than something only theme variation happens to show.
      variantTitle: "Light + Dark (single-open)",
      captures: [
        ...lightDarkCaptures(),
        {
          name: "light-collapsed",
          selector: "[data-theme]:not(.dark)",
          beforeCapture: async (scope) => {
            await scope.getByRole("button", { name: "Shipping" }).click();
          },
        },
      ],
    },
    {
      // Single `[data-theme]` wrapper, no dark counterpart in this variant
      // — scoping to it (rather than the full page) crops out the dead
      // viewport space around the actual content.
      variantTitle: "Multiple-open mode",
      captures: [{ name: "default", selector: "[data-theme]" }],
    },
    {
      variantTitle: "Narrow container (responsive check)",
      captures: [{ name: "default", selector: "[data-theme]" }],
    },
    { variantTitle: "Density", captures: densityCaptures() },
  ],
};
