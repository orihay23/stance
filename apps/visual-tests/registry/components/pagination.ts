import type { ComponentSpec } from "../types";
import { lightDarkCaptures } from "../types";

export const pagination: ComponentSpec = {
  component: "Pagination",
  variants: [
    { variantTitle: "Light + Dark", captures: lightDarkCaptures() },
    { variantTitle: "Page-size picker", captures: [{ name: "default", selector: "[data-theme]" }] },
    {
      variantTitle: "Narrow container (responsive check — collapses to 'Page X of Y')",
      captures: [{ name: "default", selector: "[data-theme]" }],
    },
  ],
};
