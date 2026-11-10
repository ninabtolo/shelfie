import assert from "node:assert/strict";
import test from "node:test";
import { createArrayObjectExtractor } from "../lib/ai/json-stream.ts";

function feed(text, chunkSize) {
  const extractor = createArrayObjectExtractor();
  const out = [];
  for (let i = 0; i < text.length; i += chunkSize) out.push(...extractor.push(text.slice(i, i + chunkSize)));
  return out;
}

const books = [
  { title: "Piranesi", author: "Susanna Clarke", reason: "Uses {braces} and [brackets] in text" },
  { title: "Quote \"inside\"", author: "A\\B", reason: "Escapes \\\" and unicode ç ã 📚" },
  { title: "Nested", author: "X", tags: [{ a: 1 }, { b: [2, 3] }], meta: { deep: { x: "}" } } },
];

test("extracts each array item from an object payload regardless of chunking", () => {
  const text = JSON.stringify({ message: "hi {not an item}", books }, null, 2);
  for (const size of [1, 2, 3, 7, 50, text.length]) {
    assert.deepEqual(feed(text, size), books, `chunk size ${size}`);
  }
});

test("extracts items from a top-level array", () => {
  assert.deepEqual(feed(JSON.stringify(books), 5), books);
});

test("emits objects as soon as they close", () => {
  const extractor = createArrayObjectExtractor();
  assert.deepEqual(extractor.push('{"books":[{"title":"A"},'), [{ title: "A" }]);
  assert.deepEqual(extractor.push('{"title":"B", "reason":"x'), []);
  assert.deepEqual(extractor.push('y"}]}'), [{ title: "B", reason: "xy" }]);
});

test("ignores objects that are not array items", () => {
  assert.deepEqual(feed('{"meta":{"a":1},"books":[]}', 4), []);
});
