"use client";

import { useEffect, useRef } from "react";

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

/*
 * Keyboard behaviour for an overlay (WCAG 2.2 — 2.1.2, 2.4.3):
 * opening moves focus into it, Tab and Shift+Tab stay inside, Esc closes it,
 * and closing puts focus back on whatever opened it.
 *
 * Spread the result on the overlay's root: it carries the ref plus aria-modal,
 * and `inert` while closed — the sheets stay mounted (they slide), so without it
 * a closed sheet's buttons were still reachable by Tab and by screen readers.
 */
export function useDialog<T extends HTMLElement>(open: boolean, onClose: () => void) {
  const ref = useRef<T>(null);
  const closeRef = useRef(onClose);
  useEffect(() => {
    closeRef.current = onClose;
  });

  useEffect(() => {
    if (!open) return;
    const root = ref.current;
    if (!root) return;
    const opener = document.activeElement instanceof HTMLElement ? document.activeElement : null;

    const focusables = () => [...root.querySelectorAll<HTMLElement>(FOCUSABLE)].filter((el) => el.offsetParent !== null);
    // After the slide-in starts, so the element is visible and focus doesn't jump the page.
    const timer = window.setTimeout(() => (focusables()[0] ?? root).focus({ preventScroll: true }), 30);

    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        closeRef.current();
        return;
      }
      if (event.key !== "Tab") return;
      const items = focusables();
      if (items.length === 0) return;
      const first = items[0]!;
      const last = items[items.length - 1]!;
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", onKey);

    return () => {
      window.clearTimeout(timer);
      document.removeEventListener("keydown", onKey);
      if (opener && document.contains(opener)) opener.focus({ preventScroll: true });
    };
  }, [open]);

  return { ref, "aria-modal": open ? true : undefined, inert: !open, tabIndex: -1 } as const;
}
