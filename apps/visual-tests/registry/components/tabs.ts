import type { ComponentSpec } from "../types";
import { lightDarkCaptures } from "../types";

export const tabs: ComponentSpec = {
  component: "Tabs",
  variants: [
    { variantTitle: "Light + Dark", captures: lightDarkCaptures() },
    { variantTitle: "Vertical orientation", captures: [{ name: "default", selector: "[data-theme]" }] },
    { variantTitle: "Narrow container (responsive check)", captures: [{ name: "default", selector: "[data-theme]" }] },
  ],
};
