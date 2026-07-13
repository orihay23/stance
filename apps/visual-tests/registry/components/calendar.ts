import type { ComponentSpec } from "../types";
import { densityCaptures, lightDarkCaptures } from "../types";

export const calendar: ComponentSpec = {
  component: "Calendar",
  variants: [
    { variantTitle: "Light + Dark", captures: lightDarkCaptures() },
    { variantTitle: "Range mode", captures: [{ name: "default", selector: "[data-theme]" }] },
    { variantTitle: "Min/max constraints", captures: [{ name: "default", selector: "[data-theme]" }] },
    { variantTitle: "Narrow container (responsive check)", captures: [{ name: "default", selector: "[data-theme]" }] },
    { variantTitle: "Density", captures: densityCaptures() },
  ],
};
