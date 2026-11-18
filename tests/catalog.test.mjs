import assert from "node:assert/strict";
import test from "node:test";
import { toCatalogRow } from "../lib/books/catalog.ts";

const book = {
  google_books_id: "zyTCAlFPjgYC",
  title: "The Google Story",
  subtitle: null,
  authors: ["David A. Vise", "Mark Malseed"],
  description: "A book.",
  isbn_10: "055380457X",
  isbn_13: "9780553804577",
  publisher: "Delacorte Press",
  published_date: "2005",
  page_count: 207,
  genres: ["Business & Economics"],
  language: "en",
  cover_url: "https://books.google.com/books/content?id=zyTCAlFPjgYC&printsec=frontcover&img=1",
};

test("keeps normal Google Books data unchanged", () => {
  assert.deepEqual(toCatalogRow(book), book);
});

test("trims oversized fields to the database limits", () => {
  const row = toCatalogRow({
    ...book,
    title: "x".repeat(900),
    description: "y".repeat(30_000),
    authors: Array.from({ length: 80 }, () => "a".repeat(200)),
    page_count: 999_999,
  });
  assert.equal(row.title.length, 500);
  assert.equal(row.description.length, 20_000);
  assert.equal(row.authors.length, 20);
  assert.ok(row.authors.join("").length <= 2000);
  assert.equal(row.page_count, null);
});

test("drops covers that are not served by Google Books over https", () => {
  assert.equal(toCatalogRow({ ...book, cover_url: "https://evil.example/cover.jpg" }).cover_url, null);
  assert.equal(toCatalogRow({ ...book, cover_url: "http://books.google.com/x" }).cover_url, null);
  assert.equal(toCatalogRow({ ...book, cover_url: "not a url" }).cover_url, null);
});
