// Pure keyboard-shortcut logic, kept free of React/DOM imports so it can be unit tested.

export const KEYBOARD_SHORTCUTS_STORAGE_KEY = "shelfie:keyboard-shortcuts";
export const KEYBOARD_SHORTCUTS_CHANGE_EVENT = "shelfie:keyboard-shortcuts-change";

/** How long after pressing "g" the second key of a "go to" sequence is accepted. */
export const GO_SEQUENCE_TIMEOUT_MS = 1500;

export const GO_TO_SHORTCUTS = [
  { key: "d", href: "/protected", label: "Dashboard" },
  { key: "r", href: "/protected/recommendations", label: "For you" },
  { key: "c", href: "/protected/chat", label: "AI chat" },
  { key: "l", href: "/protected/library", label: "My Library" },
  { key: "w", href: "/protected/wishlist", label: "Wishlist" },
  { key: "s", href: "/protected/shared-books", label: "Shared books" },
  { key: "t", href: "/protected/stats", label: "Stats" },
  { key: "p", href: "/protected/profiles", label: "Profiles" },
  { key: "n", href: "/protected/notifications", label: "Notifications" },
  { key: "a", href: "/protected/account", label: "Account" },
] as const;

export const GENERAL_SHORTCUTS = [
  { keys: ["/"], label: "Focus the search box on the current page" },
  { keys: ["?"], label: "Show keyboard shortcuts" },
  { keys: ["Esc"], label: "Close a menu or dialog" },
] as const;

export type ShortcutAction =
  | { type: "navigate"; href: string }
  | { type: "focus-search" }
  | { type: "show-help" }
  | { type: "start-go" }
  | null;

/**
 * Maps a key press to an action. `awaitingGo` is true when the previous key was "g"
 * (within the timeout), in which case the key picks a "go to" destination.
 */
export function resolveShortcut(key: string, awaitingGo: boolean): ShortcutAction {
  if (awaitingGo) {
    const target = GO_TO_SHORTCUTS.find((shortcut) => shortcut.key === key.toLowerCase());
    return target ? { type: "navigate", href: target.href } : null;
  }

  if (key === "g" || key === "G") return { type: "start-go" };
  if (key === "/") return { type: "focus-search" };
  if (key === "?") return { type: "show-help" };
  return null;
}

type KeyEventLike = {
  key: string;
  altKey: boolean;
  ctrlKey: boolean;
  metaKey: boolean;
  repeat: boolean;
  defaultPrevented: boolean;
  isComposing?: boolean;
};

type TargetLike = {
  tagName?: string;
  isContentEditable?: boolean;
  getAttribute?: (name: string) => string | null;
} | null;

const EDITABLE_TAGS = new Set(["INPUT", "TEXTAREA", "SELECT"]);
const TEXT_ROLES = new Set(["textbox", "combobox", "searchbox", "spinbutton"]);

/** True when the user is typing somewhere, so single-key shortcuts must not fire. */
export function isEditableTarget(target: TargetLike): boolean {
  if (!target) return false;
  if (target.isContentEditable) return true;
  if (target.tagName && EDITABLE_TAGS.has(target.tagName.toUpperCase())) return true;
  const role = target.getAttribute?.("role");
  return Boolean(role && TEXT_ROLES.has(role));
}

/** True when a key event should be ignored by the global shortcut handler. */
export function shouldIgnoreKeyEvent(event: KeyEventLike, target: TargetLike): boolean {
  return (
    event.defaultPrevented ||
    event.repeat ||
    Boolean(event.isComposing) ||
    event.altKey ||
    event.ctrlKey ||
    event.metaKey ||
    isEditableTarget(target)
  );
}
