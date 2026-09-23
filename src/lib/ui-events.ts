/* Cross-component signals, matching the existing 'open-search' convention. */

export const QUICK_ADD = "open-quick-add";
export const TOAST = "show-toast";

export function openQuickAdd(productId: string) {
  document.dispatchEvent(new CustomEvent(QUICK_ADD, { detail: { productId } }));
}

export function showToast(message: string) {
  document.dispatchEvent(new CustomEvent(TOAST, { detail: { message } }));
}
