import assert from "node:assert/strict";
import test from "node:test";
import {
  GO_TO_SHORTCUTS,
  isEditableTarget,
  resolveShortcut,
  shouldIgnoreKeyEvent,
} from "../lib/accessibility/shortcuts.ts";

const plainKey = (key, extra = {}) => ({
  key,
  altKey: false,
  ctrlKey: false,
  metaKey: false,
  repeat: false,
  defaultPrevented: false,
  ...extra,
});

test("single keys map to their actions", () => {
  assert.deepEqual(resolveShortcut("g", false), { type: "start-go" });
  assert.deepEqual(resolveShortcut("/", false), { type: "focus-search" });
  assert.deepEqual(resolveShortcut("?", false), { type: "show-help" });
  assert.equal(resolveShortcut("x", false), null);
  // Destination keys do nothing without the "g" prefix.
  assert.equal(resolveShortcut("l", false), null);
});

test("g + key navigates to every listed destination, case-insensitively", () => {
  for (const { key, href } of GO_TO_SHORTCUTS) {
    assert.deepEqual(resolveShortcut(key, true), { type: "navigate", href });
    assert.deepEqual(resolveShortcut(key.toUpperCase(), true), { type: "navigate", href });
  }
  assert.equal(resolveShortcut("z", true), null);
  assert.equal(resolveShortcut("/", true), null);
});

test("go-to keys are unique", () => {
  const keys = GO_TO_SHORTCUTS.map((shortcut) => shortcut.key);
  assert.equal(new Set(keys).size, keys.length);
  assert.ok(!keys.includes("g"));
});

test("typing targets are detected", () => {
  assert.equal(isEditableTarget({ tagName: "INPUT" }), true);
  assert.equal(isEditableTarget({ tagName: "textarea" }), true);
  assert.equal(isEditableTarget({ tagName: "SELECT" }), true);
  assert.equal(isEditableTarget({ tagName: "DIV", isContentEditable: true }), true);
  assert.equal(isEditableTarget({ tagName: "DIV", getAttribute: (name) => (name === "role" ? "textbox" : null) }), true);
  assert.equal(isEditableTarget({ tagName: "BUTTON", getAttribute: () => null }), false);
  assert.equal(isEditableTarget({ tagName: "A" }), false);
  assert.equal(isEditableTarget(null), false);
});

test("modifier keys, repeats and typing suppress shortcuts", () => {
  const body = { tagName: "BODY" };
  assert.equal(shouldIgnoreKeyEvent(plainKey("g"), body), false);
  // Shift is allowed because "?" needs it on most layouts.
  assert.equal(shouldIgnoreKeyEvent(plainKey("?", { shiftKey: true }), body), false);
  assert.equal(shouldIgnoreKeyEvent(plainKey("g", { ctrlKey: true }), body), true);
  assert.equal(shouldIgnoreKeyEvent(plainKey("g", { metaKey: true }), body), true);
  assert.equal(shouldIgnoreKeyEvent(plainKey("g", { altKey: true }), body), true);
  assert.equal(shouldIgnoreKeyEvent(plainKey("g", { repeat: true }), body), true);
  assert.equal(shouldIgnoreKeyEvent(plainKey("g", { defaultPrevented: true }), body), true);
  assert.equal(shouldIgnoreKeyEvent(plainKey("g", { isComposing: true }), body), true);
  assert.equal(shouldIgnoreKeyEvent(plainKey("g"), { tagName: "INPUT" }), true);
});
