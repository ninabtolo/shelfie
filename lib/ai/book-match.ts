/**
 * Pure helpers for matching an AI-suggested book (title + author) against
 * Google Books volumes. Keep this file free of imports so it can be unit
 * tested directly with Node (see tests/book-match.test.mjs).
 */

export type MatchCandidate = { title: string; author: string };

export type MatchVolume = {
  title: string;
  subtitle?: string | null;
  authors?: string[] | null;
  hasCover?: boolean;
  hasDescription?: boolean;
};

export type VolumeMatch = {
  index: number;
  score: number;
  titleScore: number;
  authorScore: number;
};

export function norm(value: string) {
  return value.normalize("NFKD").replace(/[̀-ͯ]/g, "").toLowerCase()
    .replace(/[^a-z0-9]+/g, " ").trim();
}

const LEADING_ARTICLE = /^(?:the|a|an|o|os|as|um|uma|el|la|los|las|le|les|l|der|die|das|il)\s+/;
const STOP_WORDS = new Set(["the", "and", "of", "for", "with", "from", "into", "que", "dos", "das", "del", "los", "las", "une", "des"]);
// Derivative products that often outrank lesser-known originals on Google Books.
const DERIVATIVE = /\b(?:summary|summaries|study guide|workbook|sparknotes|cliffsnotes|cliffs notes|analysis of|conversation starters|trivia|quiz book|box set|boxset|boxed set|omnibus|collection set|books? \d+\s*(?:-|to)\s*\d+|coloring book|lesson plans?)\b/;

function withoutArticle(value: string) {
  return value.replace(LEADING_ARTICLE, "");
}

/** The main title, without a subtitle or series/edition suffix. */
export function mainTitle(title: string) {
  const main = title.split(/\s*[:(\[—–]\s*|\s+-\s+/)[0]?.trim();
  return main || title.trim();
}

/** The author's family name, used for forgiving `inauthor:` queries. */
export function surname(author: string) {
  // Connectors need spaces on both sides so initials ("V. E. Schwab") stay intact.
  const first = author.split(/\s*[,&]\s*|\s+(?:and|e|y)\s+/i).find((part) => part.trim()) ?? author;
  const words = norm(first).split(" ").filter(Boolean);
  if (words.length === 0) return "";
  const last = words[words.length - 1];
  // Keep particles that are part of the family name: "Le Guin", "de Beauvoir".
  const particle = words.length >= 3 ? words[words.length - 2] : "";
  return ["le", "de", "da", "do", "van", "von", "del", "di", "du", "la"].includes(particle)
    ? `${particle} ${last}`
    : last;
}

/**
 * A forgiving identity for "is this the same book?": the main title without a
 * leading article or subtitle, plus the author's family name. Different
 * editions, subtitles and author spellings ("V. E. Schwab" / "Victoria
 * Schwab") collapse to the same key.
 */
export function bookKey(title: string, author: string) {
  return `${withoutArticle(norm(mainTitle(title)))}|${surname(author)}`;
}

function significantWords(value: string) {
  return value.split(" ").filter((word) => word.length > 2 && !STOP_WORDS.has(word));
}

export function titleScore(expected: string, actual: string, actualSubtitle?: string | null) {
  const e = withoutArticle(norm(expected));
  const a = withoutArticle(norm(actual));
  if (!e || !a) return 0;

  const full = actualSubtitle ? withoutArticle(norm(`${actual} ${actualSubtitle}`)) : a;
  if (e === a || e === full) return 1;

  const eMain = withoutArticle(norm(mainTitle(expected)));
  const aMain = withoutArticle(norm(mainTitle(actual)));
  if (eMain && eMain === aMain) return 0.9;

  const shorter = e.length <= a.length ? e : a;
  if (shorter.length >= 4 && (a.startsWith(`${e} `) || e.startsWith(`${a} `) || full.startsWith(`${e} `))) {
    return 0.8;
  }

  const expectedWords = significantWords(e);
  const actualWords = new Set(significantWords(full));
  if (expectedWords.length < 2) return 0;
  const overlap = expectedWords.filter((word) => actualWords.has(word)).length;
  const recall = overlap / expectedWords.length;
  const precision = actualWords.size ? overlap / actualWords.size : 0;
  return recall >= 0.7 && precision >= 0.5 ? 0.7 * recall : 0;
}

function splitAuthors(value: string) {
  return value.split(/\s*(?:,|&|;|\band\b|\be\b|\by\b)\s*/i).map(norm).filter((name) => name.length > 1);
}

export function authorScore(expected: string, actualAuthors: string[] | null | undefined) {
  const actual = (actualAuthors ?? []).map(norm).filter(Boolean);
  if (actual.length === 0) return 0;
  let best = 0;

  for (const name of splitAuthors(expected)) {
    const expectedWords = name.split(" ");
    const expectedLast = expectedWords[expectedWords.length - 1];
    const expectedInitial = expectedWords.length > 1 ? expectedWords[0][0] : "";

    for (const candidate of actual) {
      if (candidate === name || candidate.includes(name) || name.includes(candidate)) return 1;
      const actualWords = candidate.split(" ");
      const actualLast = actualWords[actualWords.length - 1];
      const actualInitial = actualWords.length > 1 ? actualWords[0][0] : "";
      if (expectedLast.length >= 2 && expectedLast === actualLast) {
        best = Math.max(best, expectedInitial && actualInitial && expectedInitial === actualInitial ? 0.9 : 0.7);
      }
    }
  }
  return best;
}

function isDerivative(candidateTitle: string, volume: MatchVolume) {
  const volumeText = norm(`${volume.title} ${volume.subtitle ?? ""}`);
  return DERIVATIVE.test(volumeText) && !DERIVATIVE.test(norm(candidateTitle));
}

export function scoreVolume(candidate: MatchCandidate, volume: MatchVolume): VolumeMatch | null {
  const tScore = titleScore(candidate.title, volume.title, volume.subtitle);
  if (tScore === 0) return null;
  const aScore = authorScore(candidate.author, volume.authors);

  // Without an author match, only an exact title is trustworthy.
  if (aScore === 0 && tScore < 1) return null;
  if (isDerivative(candidate.title, volume)) return null;

  const score = tScore * 0.55
    + aScore * 0.4
    + (volume.hasCover ? 0.04 : 0)
    + (volume.hasDescription ? 0.02 : 0);
  return { index: -1, score, titleScore: tScore, authorScore: aScore };
}

/** Best acceptable volume, or null when nothing is a trustworthy match. */
export function bestMatch(candidate: MatchCandidate, volumes: MatchVolume[]): VolumeMatch | null {
  let best: VolumeMatch | null = null;
  volumes.forEach((volume, index) => {
    const match = scoreVolume(candidate, volume);
    if (!match) return;
    // Earlier results win ties: Google's relevance order is a useful signal.
    if (!best || match.score > best.score + 0.001) best = { ...match, index };
  });
  return best;
}

/** A match good enough to stop trying fallback queries. */
export function isConfidentMatch(match: VolumeMatch | null) {
  return Boolean(match && match.authorScore >= 0.7 && match.titleScore >= 0.8);
}
