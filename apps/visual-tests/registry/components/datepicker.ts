import type { ComponentSpec } from "../types";
import { densityCaptures, lightDarkCaptures } from "../types";

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
    {
      variantTitle: "Density",
      captures: [
        // The closed field is inline (not teleported), so it can reuse the
        // same scoped-selector shape as densityCaptures()'s other callers.
        ...densityCaptures(),
        // The calendar dialog teleports once open (see the "Light + Dark"
        // variant's own comment above) — one representative profile is
        // enough to confirm it inherits data-theme-density through the
        // teleport, same curated-not-exhaustive reasoning as Sheet only
        // opening one side in dark mode.
        {
          name: "compact-calendar-open",
          interactionSelector: '[data-theme-density="compact"]',
          beforeCapture: async (scope) => {
            await scope.getByRole("button", { name: "Choose date" }).click();
          },
        },
      ],
    },
  ],
};
