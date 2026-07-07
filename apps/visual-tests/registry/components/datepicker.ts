import type { ComponentSpec } from "../types";
import { lightDarkCaptures } from "../types";

// The calendar dialog teleports to the shared overlay root and carries its
// own `data-theme` once open — so any "open" capture has to be full-page
// (unscoped), otherwise `[data-theme]` would match both the field wrapper
// and the teleported dialog and throw a strict-mode error.
export const datepicker: ComponentSpec = {
  component: "DatePicker",
  variants: [
    {
      variantTitle: "Light + Dark (single date)",
      captures: [
        ...lightDarkCaptures(),
        {
          name: "light-calendar-open",
          interactionSelector: "[data-theme]:not(.dark)",
          beforeCapture: async (scope) => {
            await scope.getByRole("button", { name: "Choose date" }).click();
          },
        },
      ],
    },
    {
      variantTitle: "Range mode",
      captures: [
        { name: "closed", selector: "[data-theme]" },
        {
          name: "calendar-open",
          interactionSelector: "[data-theme]",
          beforeCapture: async (scope) => {
            await scope.getByRole("button", { name: "Choose date" }).click();
          },
        },
      ],
    },
    { variantTitle: "Min/max constraints", captures: [{ name: "default", selector: "[data-theme]" }] },
    { variantTitle: "Locale (de-DE, Monday-start week)", captures: [{ name: "default", selector: "[data-theme]" }] },
    { variantTitle: "Narrow container (responsive check)", captures: [{ name: "default", selector: "[data-theme]" }] },
  ],
};
