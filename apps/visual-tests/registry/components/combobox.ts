import type { ComponentSpec } from "../types";
import { lightDarkCaptures } from "../types";

export const combobox: ComponentSpec = {
  component: "Combobox",
  variants: [
    { variantTitle: "Light + Dark", captures: lightDarkCaptures() },
    { variantTitle: "Pre-selected value", captures: [{ name: "default", selector: "[data-theme]" }] },
    { variantTitle: "Disabled", captures: [{ name: "default", selector: "[data-theme]" }] },
    // Only the deterministic resting state (before typing) is captured —
    // the loading/error states are driven by a live setTimeout in the
    // story, and racing a screenshot against a timer is exactly the kind
    // of flakiness a CI-gated visual test shouldn't invite. Verified by
    // hand instead (see the Combobox.test.ts manual checklist), same as
    // Slider's/DatePicker's floating-ui positioning.
    { variantTitle: "Async search (simulated network)", captures: [{ name: "default", selector: "[data-theme]" }] },
  ],
};
