"use client";

import { useEffect, type RefObject } from "react";

const FOCUSABLE_SELECTOR = [
  "a[href]",
  "button:not([disabled])",
  "input:not([disabled]):not([type='hidden'])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  "[tabindex]:not([tabindex='-1'])",
].join(",");

function getFocusable(container: HTMLElement) {
  return Array.from(container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)).filter(
    (element) => element.getClientRects().length > 0 && !element.closest("[inert]"),
  );
}

/**
 * Keeps keyboard focus inside `containerRef` while `active` is true: moves focus in on
 * activation, wraps Tab / Shift+Tab at the edges, and restores focus to whatever was
 * focused before (usually the button that opened the dialog) on deactivation.
 * The container should have tabIndex={-1} so it can hold focus when it has no controls.
 */
export function useFocusTrap(
  containerRef: RefObject<HTMLElement | null>,
  active: boolean,
  initialFocusRef?: RefObject<HTMLElement | null>,
) {
  useEffect(() => {
    if (!active) return;
    const container = containerRef.current;
    if (!container) return;

    const previouslyFocused = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    (initialFocusRef?.current ?? getFocusable(container)[0] ?? container).focus();

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key !== "Tab" || !container) return;
      const items = getFocusable(container);
      if (!items.length) {
        event.preventDefault();
        container.focus();
        return;
      }

      const first = items[0];
      const last = items[items.length - 1];
      const current = document.activeElement;
      const outside = !container.contains(current);

      if (event.shiftKey && (current === first || current === container || outside)) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && (current === last || outside)) {
        event.preventDefault();
        first.focus();
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      if (previouslyFocused?.isConnected) previouslyFocused.focus();
    };
    // Refs are stable; re-running only on activation is intended.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active]);
}
