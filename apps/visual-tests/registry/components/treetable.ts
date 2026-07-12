import type { ComponentSpec } from "../types";
import { densityCaptures, lightDarkCaptures } from "../types";

export const treetable: ComponentSpec = {
  component: "TreeTable",
  variants: [
    { variantTitle: "Light + Dark", captures: lightDarkCaptures() },
    { variantTitle: "Row selection", captures: [{ name: "default", selector: "[data-theme]" }] },
    {
      variantTitle: "Sort + filter (ancestor-preserving)",
      captures: [{ name: "default", selector: "[data-theme]" }],
    },
    { variantTitle: "Narrow container (responsive check)", captures: [{ name: "default", selector: "[data-theme]" }] },
    { variantTitle: "Density", captures: densityCaptures() },
  ],
};
