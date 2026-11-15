"use client";

import { Keyboard } from "lucide-react";
import { ShortcutList } from "@/components/accessibility/keyboard-shortcuts";
import {
  setKeyboardShortcutsEnabled,
  useKeyboardShortcutsEnabled,
} from "@/components/accessibility/keyboard-shortcuts-preference";

export function AccessibilitySettings() {
  const enabled = useKeyboardShortcutsEnabled();

  return (
    <section id="accessibility" className="shelfie-surface scroll-mt-6 space-y-5 p-5 sm:p-6" aria-labelledby="accessibility-title">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex gap-3">
          <span className="reading-stat-icon mt-0.5" aria-hidden="true"><Keyboard /></span>
          <div className="space-y-1">
            <h2 id="accessibility-title" className="text-base font-semibold">Keyboard navigation</h2>
            <p className="max-w-2xl text-sm leading-6 text-muted-foreground">
              Shelfie always works with Tab, Shift+Tab, Enter, Space, the arrow keys and Esc. Turn on shortcuts to jump between
              pages with single keys. This setting is saved on this device.
            </p>
          </div>
        </div>
        <label className="flex shrink-0 cursor-pointer items-center gap-3 rounded-lg border border-border/70 px-3 py-2 text-sm font-medium transition hover:border-primary/50 hover:bg-primary/5">
          <input
            type="checkbox"
            role="switch"
            className="peer sr-only"
            checked={enabled}
            onChange={(event) => setKeyboardShortcutsEnabled(event.target.checked)}
            aria-label="Enable keyboard shortcuts"
          />
          <span className="shelfie-recommendation-switch relative h-6 w-11 rounded-full bg-muted transition-colors peer-checked:bg-primary peer-focus-visible:ring-2 peer-focus-visible:ring-ring peer-focus-visible:ring-offset-2" data-enabled={enabled}>
            <span className="absolute left-1 top-1 size-4 rounded-full bg-white shadow-sm transition-transform" />
          </span>
          <span>{enabled ? "On" : "Off"}</span>
        </label>
      </div>

      <div className="rounded-lg border border-border/70 p-3">
        <ShortcutList />
      </div>
      <p className="text-xs text-muted-foreground" aria-live="polite">
        {enabled
          ? "Shortcuts are on. Press ? anywhere to see this list."
          : "Shortcuts are off. Turn them on to use the keys above."}
      </p>
    </section>
  );
}
