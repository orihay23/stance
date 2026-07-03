import { twMerge } from "tailwind-merge";

/**
 * Merges an internal class list with a consumer-supplied class list,
 * deduping conflicting Tailwind utilities so the consumer's class wins.
 */
export function cn(...classLists: Array<string | undefined | null | false>): string {
  return twMerge(classLists.filter(Boolean).join(" "));
}
