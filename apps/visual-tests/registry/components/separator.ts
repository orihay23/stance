import type { ComponentSpec } from "../types";
import { lightDarkCaptures } from "../types";

export const separator: ComponentSpec = {
  component: "Separator",
  variants: [
    { variantTitle: "Light + Dark", captures: lightDarkCaptures() },
    { variantTitle: "Decorative (aria-hidden, no role)", captures: [{ name: "default", selector: "[data-theme]" }] },
  ],
};
