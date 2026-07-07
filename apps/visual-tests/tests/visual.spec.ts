import { expect, test } from "@playwright/test";
import { components } from "../registry/components";
import { resolveVariantId, storyIdFor } from "../registry/manifest";

for (const componentSpec of components) {
  test.describe(componentSpec.component, () => {
    for (const variantSpec of componentSpec.variants) {
      test.describe(variantSpec.variantTitle, () => {
        for (const capture of variantSpec.captures) {
          const snapshotName = `${componentSpec.component.toLowerCase()}-${variantSpec.variantTitle
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/(^-|-$)/g, "")}-${capture.name}.png`;

          test(capture.name, async ({ page }) => {
            const storyId = storyIdFor(componentSpec.component);
            const variantId = resolveVariantId(componentSpec.component, variantSpec.variantTitle);

            await page.goto(`/__sandbox.html?storyId=${storyId}&variantId=${variantId}`, {
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
      });
    }
  });
}
