import type { ComponentSpec } from "../types";
import { lightDarkCaptures } from "../types";

export const card: ComponentSpec = {
  component: "Card",
  variants: [
    { variantTitle: "Light + Dark", captures: lightDarkCaptures() },
    {
      variantTitle: "Interactive cards (button / link)",
      captures: [{ name: "default", selector: "[data-theme]" }],
    },
    {
      variantTitle: "Equal-height cards in a row (footer pinned to bottom)",
      captures: [{ name: "default", selector: "[data-theme]" }],
    },
    {
      variantTitle: "Narrow container (responsive check)",
      captures: [{ name: "default", selector: "[data-theme]" }],
    },
  ],
};
