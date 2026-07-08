import type { ComponentSpec } from "../types";
import { lightDarkCaptures } from "../types";

export const combobox: ComponentSpec = {
  component: "Combobox",
  variants: [
    { variantTitle: "Light + Dark", captures: lightDarkCaptures() },
    { variantTitle: "Pre-selected value", captures: [{ name: "default", selector: "[data-theme]" }] },
    { variantTitle: "Disabled", captures: [{ name: "default", selector: "[data-theme]" }] },
  ],
};
