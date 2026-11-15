"use client";

import { useSyncExternalStore } from "react";
import {
  KEYBOARD_SHORTCUTS_CHANGE_EVENT,
  KEYBOARD_SHORTCUTS_STORAGE_KEY,
} from "@/lib/accessibility/shortcuts";

// Stored per device (like the theme): it is a preference about how this person uses
// this keyboard/browser. If storage is blocked, the choice still applies for this visit.
let memoryValue = false;

function read(): boolean {
  try {
    const stored = window.localStorage.getItem(KEYBOARD_SHORTCUTS_STORAGE_KEY);
    return stored === null ? memoryValue : stored === "on";
  } catch {
    return memoryValue;
  }
}

function subscribe(callback: () => void) {
  window.addEventListener(KEYBOARD_SHORTCUTS_CHANGE_EVENT, callback);
  window.addEventListener("storage", callback);
  return () => {
    window.removeEventListener(KEYBOARD_SHORTCUTS_CHANGE_EVENT, callback);
    window.removeEventListener("storage", callback);
  };
}

export function setKeyboardShortcutsEnabled(enabled: boolean) {
  memoryValue = enabled;
  try {
    window.localStorage.setItem(KEYBOARD_SHORTCUTS_STORAGE_KEY, enabled ? "on" : "off");
  } catch {
    // Storage unavailable (private mode, blocked site data): the toggle just won't persist.
  }
  window.dispatchEvent(new Event(KEYBOARD_SHORTCUTS_CHANGE_EVENT));
}

export function useKeyboardShortcutsEnabled() {
  return useSyncExternalStore(subscribe, read, () => false);
}
