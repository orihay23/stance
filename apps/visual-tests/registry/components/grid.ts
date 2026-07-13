import type { ComponentSpec } from "../types";
import { densityCaptures } from "../types";

// Grid's story never grew a dark-mode section (a gap in the original
// story, not something to fix here) — every variant only demonstrates the
// light theme.
export const grid: ComponentSpec = {
  component: "Grid",
  variants: [
    {
      variantTitle: "Container mode (responds to its own width)",
      captures: [{ name: "default", selector: "[data-theme]" }],
    },
    {
      variantTitle: "Viewport mode (responds to browser width)",
      captures: [{ name: "default", selector: "[data-theme]" }],
    },
    {
      variantTitle: "Skipped breakpoints (base + lg only)",
      captures: [{ name: "default", selector: "[data-theme]" }],
    },
    {
      variantTitle: "Gap scale",
      captures: [{ name: "default", selector: "[data-theme]" }],
    },
    { variantTitle: "Density", captures: densityCaptures() },
  ],
};
