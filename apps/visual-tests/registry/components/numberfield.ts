import type { ComponentSpec } from "../types";
import { lightDarkCaptures } from "../types";

export const numberfield: ComponentSpec = {
  component: "NumberField",
  variants: [
    { variantTitle: "Light + Dark", captures: lightDarkCaptures() },
    { variantTitle: "Min/max constraints", captures: [{ name: "default", selector: "[data-theme]" }] },
    {
      variantTitle: "Locale-aware formatting (currency, percent, decimals)",
      captures: [{ name: "default", selector: "[data-theme]" }],
    },
    { variantTitle: "Invalid / error state", captures: [{ name: "default", selector: "[data-theme]" }] },
  ],
};
