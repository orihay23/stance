import type { ComponentSpec } from "../types";
import { lightDarkCaptures } from "../types";

export const slider: ComponentSpec = {
  component: "Slider",
  variants: [
    { variantTitle: "Light + Dark", captures: lightDarkCaptures() },
    { variantTitle: "Vertical orientation", captures: [{ name: "default", selector: "[data-theme]" }] },
    {
      variantTitle: "Locale-aware aria-valuetext (currency, percent)",
      captures: [{ name: "default", selector: "[data-theme]" }],
    },
    { variantTitle: "Min/max/step", captures: [{ name: "default", selector: "[data-theme]" }] },
    { variantTitle: "Disabled", captures: [{ name: "default", selector: "[data-theme]" }] },
  ],
};
