import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

/**
 * Resolves variantIds from the built Histoire manifest by (component,
 * variant title) instead of hardcoding numeric-suffixed IDs like
 * "src-accordion-story-vue-2" — those shift if a variant is reordered or
 * inserted, silently pointing a registry entry at the wrong screenshot.
 * Throws loudly if a referenced variant doesn't exist, rather than quietly
 * dropping coverage.
 */

interface HistoireVariant {
  id: string;
  title?: string;
}

interface HistoireStory {
  id: string;
  title: string;
  variants: HistoireVariant[];
}

interface HistoireManifest {
  stories: HistoireStory[];
}

const manifestPath = fileURLToPath(
  new URL("../../playground/.histoire/dist/histoire.json", import.meta.url),
);

let cachedManifest: HistoireManifest | undefined;

function loadManifest(): HistoireManifest {
  if (!cachedManifest) {
    cachedManifest = JSON.parse(readFileSync(manifestPath, "utf-8")) as HistoireManifest;
  }
  return cachedManifest;
}

export function storyIdFor(component: string): string {
  return `src-${component.toLowerCase()}-story-vue`;
}

export function resolveVariantId(component: string, variantTitle: string): string {
  const storyId = storyIdFor(component);
  const manifest = loadManifest();
  const story = manifest.stories.find((s) => s.id === storyId);
  if (!story) {
    throw new Error(
      `[visual-tests] No Histoire story found for component "${component}" (expected id "${storyId}"). Run "pnpm --filter @stance/playground story:build" first.`,
    );
  }
  const variant = story.variants.find((v) => v.title === variantTitle);
  if (!variant) {
    const available = story.variants.map((v) => v.title).join(", ");
    throw new Error(
      `[visual-tests] No variant titled "${variantTitle}" on story "${component}". Available variants: ${available}`,
    );
  }
  return variant.id;
}
