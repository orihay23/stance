import { readonly, ref } from "vue";

export interface ToastOptions {
  title?: string;
  description?: string;
  /** @default "default" */
  variant?: "default" | "success" | "destructive";
  /**
   * Uses `role="alert"` (assertive) instead of `role="status"` (polite) —
   * for messages the user must not miss, interrupting whatever a screen
   * reader is currently announcing. Reserve this for genuinely urgent
   * cases; overuse defeats the purpose. @default false
   */
  urgent?: boolean;
  /**
   * Milliseconds before auto-dismiss. Pass `null` to disable auto-dismiss
   * entirely, requiring the user to close it manually — every toast has
   * one of these two escape hatches (WCAG 2.2.1: no fixed timing that can't
   * be adjusted, extended, or turned off). @default 5000
   */
  duration?: number | null;
}

export interface ToastInstance {
  id: string;
  title: string;
  description: string;
  variant: "default" | "success" | "destructive";
  urgent: boolean;
  duration: number | null;
}

// Module-level singleton store — toasts are typically triggered from
// arbitrary application code (a submit handler, an async callback), not
// from a template with local state, so this can't be a provide/inject
// context scoped to a component tree; it has to be reachable from anywhere.
const toasts = ref<ToastInstance[]>([]);
let idCounter = 0;

function show(options: ToastOptions = {}): string {
  if (import.meta.env.DEV && !options.title?.trim() && !options.description?.trim()) {
    console.error("[stance/useToast] requires a `title` and/or `description` — an empty toast has nothing to announce.");
  }
  const id = `stance-toast-${++idCounter}`;
  toasts.value = [
    ...toasts.value,
    {
      id,
      title: options.title ?? "",
      description: options.description ?? "",
      variant: options.variant ?? "default",
      urgent: options.urgent ?? false,
      duration: options.duration === undefined ? 5000 : options.duration,
    },
  ];
  return id;
}

function dismiss(id: string) {
  toasts.value = toasts.value.filter((t) => t.id !== id);
}

function dismissAll() {
  toasts.value = [];
}

/** The imperative toast API — call `show()` from anywhere (a click handler, an async submit flow, etc). Requires one `<ToastRegion>` mounted once to actually render the stack. */
export function useToast() {
  return { toasts: readonly(toasts), show, dismiss, dismissAll };
}
