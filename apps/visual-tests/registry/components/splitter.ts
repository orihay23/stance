import type { ComponentSpec } from "../types";
import { lightDarkCaptures } from "../types";

export const splitter: ComponentSpec = {
  component: "Splitter",
  variants: [
    { variantTitle: "Light + Dark (horizontal)", captures: lightDarkCaptures() },
    { variantTitle: "Vertical orientation", captures: [{ name: "default", selector: "[data-theme]" }] },
    { variantTitle: "3+ panes", captures: [{ name: "default", selector: "[data-theme]" }] },
    { variantTitle: "Min/max constraints", captures: [{ name: "default", selector: "[data-theme]" }] },
  ],
};
