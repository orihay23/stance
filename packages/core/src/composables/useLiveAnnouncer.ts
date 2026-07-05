import { announce } from "../utils/live-region";

/**
 * Shared screen-reader announcement API for components whose important
 * state changes (a new page, a filtered result count) aren't otherwise
 * tied to a role/aria-live element of their own — DataTable's pagination
 * and filtering both use this; Toast doesn't, since each toast's own
 * role="status"/"alert" already makes it a live region.
 */
export function useLiveAnnouncer() {
  return { announce };
}
