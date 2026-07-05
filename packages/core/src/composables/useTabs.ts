import type { ComputedRef, InjectionKey, Ref } from "vue";
import { inject } from "vue";

export interface TabsContext {
  active: Ref<string>;
  setActive: (value: string) => void;
  orientation: ComputedRef<"horizontal" | "vertical">;
  /** Shared id prefix so Tab/TabPanel can generate matching `{tabsId}-tab-{value}` / `{tabsId}-panel-{value}` ids. */
  tabsId: string;
}

export const TABS_KEY: InjectionKey<TabsContext> = Symbol("Tabs");

/** Reads the enclosing Tabs' context; warns in dev mode if there isn't one. */
export function useTabsContext(componentName: string): TabsContext | undefined {
  const context = inject(TABS_KEY, undefined);
  if (import.meta.env.DEV && !context) {
    console.error(`[stance/${componentName}] must be used within a <Tabs>.`);
  }
  return context;
}
