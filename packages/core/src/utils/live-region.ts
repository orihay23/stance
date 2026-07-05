type Politeness = "polite" | "assertive";

const regions = new Map<Politeness, HTMLElement>();

function getRegion(politeness: Politeness): HTMLElement {
  let region = regions.get(politeness);
  if (!region) {
    region = document.createElement("div");
    region.setAttribute("aria-live", politeness);
    region.setAttribute("aria-atomic", "true");
    region.setAttribute("data-stance-live-region", politeness);
    region.style.cssText =
      "position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border:0;";
    document.body.appendChild(region);
    regions.set(politeness, region);
  }
  return region;
}

/**
 * Announces `message` to screen readers via a shared, persistent
 * visually-hidden `aria-live` region (created once, reused for every call).
 * Clears the region first so back-to-back identical messages are still
 * re-announced — an aria-live region only fires on a content *change*, so
 * setting the same text twice in a row would otherwise be silent.
 */
export function announce(message: string, politeness: Politeness = "polite"): void {
  const region = getRegion(politeness);
  region.textContent = "";
  requestAnimationFrame(() => {
    region.textContent = message;
  });
}
