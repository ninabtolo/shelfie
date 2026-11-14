import assert from "node:assert/strict";
import test from "node:test";
import { authorScore, bestMatch, isConfidentMatch, mainTitle, surname, titleScore } from "../lib/ai/book-match.ts";

test("title matching handles subtitles, articles and accents", () => {
  assert.equal(titleScore("Piranesi", "Piranesi"), 1);
  assert.equal(titleScore("The Name of the Wind", "Name of the Wind"), 1);
  assert.equal(titleScore("O Cortiço", "O cortico"), 1);
  assert.ok(titleScore("Kindred", "Kindred: A Graphic Novel Adaptation") >= 0.8);
  assert.ok(titleScore("The Left Hand of Darkness", "The Left Hand of Darkness", "50th Anniversary Edition") >= 0.9);
  assert.equal(titleScore("Circe", "Circus"), 0);
  assert.equal(titleScore("Stoner", "Stone"), 0);
});

test("author matching tolerates initials and particles", () => {
  assert.equal(authorScore("Ursula K. Le Guin", ["Ursula K. Le Guin"]), 1);
  assert.ok(authorScore("Ursula K. Le Guin", ["Ursula Le Guin"]) >= 0.7);
  assert.ok(authorScore("J. R. R. Tolkien", ["John Ronald Reuel Tolkien"]) >= 0.7);
  assert.equal(authorScore("Olga Ravn", ["Peter Hitchcock"]), 0);
  assert.equal(authorScore("Olga Ravn", []), 0);
});

test("prefers the original over summaries and study guides", () => {
  const candidate = { title: "The Employees", author: "Olga Ravn" };
  const match = bestMatch(candidate, [
    { title: "Summary of The Employees", authors: ["Quick Reads"], hasCover: true },
    { title: "The Employees: Study Guide", authors: ["Olga Ravn"], hasCover: true },
    { title: "The Employees", subtitle: "A workplace novel in the 22nd century", authors: ["Olga Ravn"], hasCover: true, hasDescription: true },
  ]);
  assert.equal(match?.index, 2);
  assert.ok(isConfidentMatch(match));
});

test("rejects a same-title book by a different author unless the title is exact", () => {
  assert.equal(bestMatch({ title: "The Hours", author: "Michael Cunningham" }, [
    { title: "Hours of Darkness", authors: ["Someone Else"] },
  ]), null);
  const exactOnly = bestMatch({ title: "Circe", author: "Madeline Miller" }, [{ title: "Circe", authors: ["Other Person"] }]);
  assert.ok(exactOnly && !isConfidentMatch(exactOnly));
});

test("query helpers", () => {
  assert.equal(mainTitle("Kindred: A Graphic Novel"), "Kindred");
  assert.equal(mainTitle("Dune (Book 1)"), "Dune");
  assert.equal(surname("Ursula K. Le Guin"), "le guin");
  assert.equal(surname("Patrick Rothfuss"), "rothfuss");
  assert.equal(surname("Neil Gaiman and Terry Pratchett"), "gaiman");
});

test("bookKey treats editions, subtitles and author spellings as the same book", async () => {
  const { bookKey } = await import("../lib/ai/book-match.ts");
  assert.equal(bookKey("The Name of the Wind", "Patrick Rothfuss"), bookKey("Name of the Wind: 10th Anniversary Edition", "Pat Rothfuss"));
  assert.equal(bookKey("Piranesi", "Susanna Clarke"), bookKey("Piranesi (Portuguese Edition)", "Susanna  Clarke"));
  assert.equal(bookKey("Vicious", "V. E. Schwab"), bookKey("Vicious", "Victoria Schwab"));
  assert.equal(bookKey("A Mão Esquerda da Escuridão", "Ursula K. Le Guin"), bookKey("Mao Esquerda da Escuridao", "Ursula Le Guin"));
  assert.notEqual(bookKey("Circe", "Madeline Miller"), bookKey("The Song of Achilles", "Madeline Miller"));
  assert.notEqual(bookKey("Kindred", "Octavia E. Butler"), bookKey("Kindred", "Someone Else"));
});

test("surname keeps middle initials and still splits co-authors", () => {
  assert.equal(surname("Octavia E. Butler"), "butler");
  assert.equal(surname("V. E. Schwab"), "schwab");
  assert.equal(surname("Neil Gaiman e Terry Pratchett"), "gaiman");
  assert.equal(surname("Neil Gaiman and Terry Pratchett"), "gaiman");
});
