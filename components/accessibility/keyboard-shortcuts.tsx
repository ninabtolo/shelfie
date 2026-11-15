"use client";

import { Keyboard, X } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  GENERAL_SHORTCUTS,
  GO_SEQUENCE_TIMEOUT_MS,
  GO_TO_SHORTCUTS,
  resolveShortcut,
  shouldIgnoreKeyEvent,
} from "@/lib/accessibility/shortcuts";
import { useKeyboardShortcutsEnabled } from "./keyboard-shortcuts-preference";
import { useFocusTrap } from "./use-focus-trap";

const SEARCH_INPUT_SELECTOR = "[role='search'] input:not([type='hidden'])";

function focusSearchInput() {
  const input = document.querySelector<HTMLInputElement>(SEARCH_INPUT_SELECTOR);
  if (!input) return false;
  input.focus();
  input.select();
  return true;
}

/** Global single-key shortcuts. Renders nothing unless the user turned them on in Account. */
export function KeyboardShortcuts() {
  const enabled = useKeyboardShortcutsEnabled();
  const router = useRouter();
  const pathname = usePathname();
  const [awaitingGo, setAwaitingGo] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const awaitingGoRef = useRef(false);
  const goTimeoutRef = useRef<number | null>(null);
  const pendingSearchFocusRef = useRef(false);
  const closeHelp = useCallback(() => setHelpOpen(false), []);

  useEffect(() => {
    if (!enabled) return;

    function cancelGo() {
      awaitingGoRef.current = false;
      setAwaitingGo(false);
      if (goTimeoutRef.current) window.clearTimeout(goTimeoutRef.current);
    }

    function handleKeyDown(event: KeyboardEvent) {
      const target = event.target instanceof HTMLElement ? event.target : null;
      // Let open dialogs and menus own the keyboard.
      const overlayOpen = document.querySelector("[aria-modal='true'], [role='menu']");
      if (overlayOpen || shouldIgnoreKeyEvent(event, target)) {
        if (awaitingGoRef.current) cancelGo();
        return;
      }

      const action = resolveShortcut(event.key, awaitingGoRef.current);
      if (awaitingGoRef.current) cancelGo();
      if (!action) return;

      event.preventDefault();
      switch (action.type) {
        case "start-go":
          awaitingGoRef.current = true;
          setAwaitingGo(true);
          goTimeoutRef.current = window.setTimeout(cancelGo, GO_SEQUENCE_TIMEOUT_MS);
          break;
        case "navigate":
          router.push(action.href);
          break;
        case "focus-search":
          if (!focusSearchInput()) {
            // No search box here: the dashboard has the book search.
            pendingSearchFocusRef.current = true;
            router.push("/protected");
          }
          break;
        case "show-help":
          setHelpOpen(true);
          break;
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      cancelGo();
    };
  }, [enabled, router]);

  // After "/" sent us to the dashboard, focus its search box once it has rendered.
  useEffect(() => {
    if (!pendingSearchFocusRef.current) return;
    let attempts = 0;
    const interval = window.setInterval(() => {
      attempts += 1;
      if (focusSearchInput() || attempts > 30) {
        pendingSearchFocusRef.current = false;
        window.clearInterval(interval);
      }
    }, 100);
    return () => window.clearInterval(interval);
  }, [pathname]);

  if (!enabled) return null;

  return (
    <>
      <p className="shelfie-shortcut-hint" aria-live="polite" data-visible={awaitingGo}>
        {awaitingGo ? <>Go to… <span className="text-muted-foreground">press a letter</span></> : null}
      </p>
      <KeyboardShortcutsDialog open={helpOpen} onClose={closeHelp} />
    </>
  );
}

function KeyboardShortcutsDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const dialogRef = useRef<HTMLElement>(null);
  const titleId = useId();
  useFocusTrap(dialogRef, open);

  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [open, onClose]);

  if (!open || typeof document === "undefined") return null;

  return createPortal(
    <div
      className="shelfie-app shelfie-modal-backdrop"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section ref={dialogRef} tabIndex={-1} className="shelfie-modal" role="dialog" aria-modal="true" aria-labelledby={titleId}>
        <header className="shelfie-modal-header">
          <h2 id={titleId} className="flex items-center gap-2 text-2xl font-semibold">
            <Keyboard aria-hidden="true" className="size-5 text-primary" /> Keyboard shortcuts
          </h2>
          <button type="button" className="shelfie-modal-close" onClick={onClose} aria-label="Close keyboard shortcuts">
            <X aria-hidden="true" className="size-5" />
          </button>
        </header>
        <div className="space-y-4 p-4 sm:p-5">
          <ShortcutList />
          <p className="text-xs text-muted-foreground">
            Shortcuts are ignored while you type in a field. You can turn them off in{" "}
            <Link href="/protected/account#accessibility" onClick={onClose} className="font-medium text-primary underline underline-offset-2">
              Account
            </Link>
            .
          </p>
        </div>
      </section>
    </div>,
    document.body,
  );
}

export function ShortcutList() {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <div>
        <h3 className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">General</h3>
        <dl className="mt-2 space-y-1.5 text-sm">
          {GENERAL_SHORTCUTS.map(({ keys, label }) => (
            <div key={label} className="flex items-center justify-between gap-3">
              <dt className="text-muted-foreground">{label}</dt>
              <dd className="shrink-0">{keys.map((key) => <kbd key={key} className="shelfie-kbd">{key}</kbd>)}</dd>
            </div>
          ))}
        </dl>
      </div>
      <div>
        <h3 className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">Go to</h3>
        <dl className="mt-2 space-y-1.5 text-sm">
          {GO_TO_SHORTCUTS.map(({ key, label }) => (
            <div key={key} className="flex items-center justify-between gap-3">
              <dt className="text-muted-foreground">{label}</dt>
              <dd className="shrink-0">
                <kbd className="shelfie-kbd">g</kbd> <span className="text-xs text-muted-foreground">then</span>{" "}
                <kbd className="shelfie-kbd">{key}</kbd>
              </dd>
            </div>
          ))}
        </dl>
      </div>
    </div>
  );
}
