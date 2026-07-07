import type { ComponentSpec } from "../types";

// ToastRegion teleports to the shared overlay root, and — per this story's
// own comment — is mounted once and always renders in whatever theme its
// *mount point* uses, not whichever section's button triggered it. That
// mount point here is the light (non-.dark) wrapper only, so this variant
// genuinely can't demonstrate a dark-mode toast; not a gap in this
// registry, a gap in what the story itself can show without changing it.
export const toast: ComponentSpec = {
  component: "Toast",
  variants: [
    {
      variantTitle: "Light + Dark (shared region)",
      captures: [
        {
          name: "default",
          interactionSelector: "section:not(.dark)",
          beforeCapture: async (scope) => {
            await scope.getByRole("button", { name: "Default" }).click();
          },
        },
        {
          name: "success",
          interactionSelector: "section:not(.dark)",
          beforeCapture: async (scope) => {
            await scope.getByRole("button", { name: "Success" }).click();
          },
        },
        {
          name: "destructive",
          interactionSelector: "section:not(.dark)",
          beforeCapture: async (scope) => {
            await scope.getByRole("button", { name: "Destructive" }).click();
          },
        },
        {
          name: "urgent",
          interactionSelector: "section:not(.dark)",
          beforeCapture: async (scope) => {
            await scope.getByRole("button", { name: "Urgent (role=alert)" }).click();
          },
        },
      ],
    },
  ],
};
