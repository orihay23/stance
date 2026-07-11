import { expect, test } from "@playwright/test";
import { allThemes } from "@stance/themes";
import { components } from "../registry/components";
import { resolveVariantId, storyIdFor } from "../registry/manifest";

// Captures whose name starts with "light"/"dark" are the theme-comparison
// matrix the Definition of Done means by "N themes × light/dark"
// combinations (currently 4 themes × 2 modes = 8 — allThemes.length has
// grown since this comment originally said "3 themes"; read the count from
// allThemes rather than a hardcoded number, since it changes here for free
// too) — this covers both lightDarkCaptures()'s plain "light"/
// "dark" names and the hand-written registry entries that qualify further
// (Dialog's "light-basic-open"/"light-alertdialog-open", Popover's
// "light-info-open"/"light-modal-confirm-open", DropdownMenu's
// "light-open", Tooltip's "light-visible", etc. — all genuinely
// demonstrating that mode, just with a more specific capture name). Every
// story's Light + Dark variant reads its data-theme from the shared
// `storyTheme` ref (apps/playground/src/useStoryTheme.ts), itself seeded
// from this same `?theme=` query param, so looping themes here needs no
// per-story wiring. Every other capture (narrow-container responsive
// checks, DataTable's extra pagination/selection/filtering demo variants,
// Toast's type-named captures — see toast.ts's own comment on why it can't
// demonstrate dark mode at all, let alone per-theme) stays single-theme —
// multiplying those by every theme wouldn't test anything the light/dark
// matrix doesn't already cover, and would multiply the screenshot count for
// no benefit.
const THEMED_CAPTURE_PATTERN = /^(light|dark)(-|$)/;

for (const componentSpec of components) {
  test.describe(componentSpec.component, () => {
    for (const variantSpec of componentSpec.variants) {
      test.describe(variantSpec.variantTitle, () => {
        for (const capture of variantSpec.captures) {
          const themesForCapture = THEMED_CAPTURE_PATTERN.test(capture.name) ? allThemes : [allThemes[0]!];

          for (const theme of themesForCapture) {
            const themeSuffix = themesForCapture.length > 1 ? `-${theme.name}` : "";
            const snapshotName = `${componentSpec.component.toLowerCase()}-${variantSpec.variantTitle
              .toLowerCase()
              .replace(/[^a-z0-9]+/g, "-")
              .replace(/(^-|-$)/g, "")}-${capture.name}${themeSuffix}.png`;

            const testTitle = themesForCapture.length > 1 ? `${capture.name} (${theme.name})` : capture.name;

            test(testTitle, async ({ page }) => {
              const storyId = storyIdFor(componentSpec.component);
              const variantId = resolveVariantId(componentSpec.component, variantSpec.variantTitle);

              await page.goto(`/__sandbox.html?storyId=${storyId}&variantId=${variantId}&theme=${theme.name}`, {
                waitUntil: "load",
              });
              // Settles Vue mount + any onMounted-injected theme <style> tag
              // before the screenshot, without depending on story-specific timing.
              await page.waitForTimeout(300);

              const target = capture.selector ? page.locator(capture.selector) : page;
              if (capture.beforeCapture) {
                const interactionScope = capture.interactionSelector
                  ? page.locator(capture.interactionSelector)
                  : target;
                await capture.beforeCapture(interactionScope);
                await page.waitForTimeout(150);
              }

              await expect(target).toHaveScreenshot(snapshotName);
            });
          }
        }
      });
    }
  });
}
