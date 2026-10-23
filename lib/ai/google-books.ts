import { norm } from "@/lib/ai/reading-context";

export type BookCandidate = {
  title: string;
  author: string;
  reason: string;
  tier?: "known" | "hidden";
  from_wishlist?: boolean;
};

export type ResolvedBook = {
  google_books_id: string;
  title: string;
  authors: string[];
  description: string;
  cover_url: string | null;
  published_date: string | null;
  reason: string;
  tier?: "known" | "hidden";
  from_wishlist?: boolean;
};

type GoogleVolumeInfo = {
  title?: unknown;
  authors?: unknown;
  description?: unknown;
  imageLinks?: unknown;
  publishedDate?: unknown;
};

type GoogleVolume = { id?: unknown; volumeInfo?: GoogleVolumeInfo };

async function fetchVolumes(url: URL) {
  for (let attempt = 0; attempt < 3; attempt += 1) {
    const response = await fetch(url, { cache: "no-store", signal: AbortSignal.timeout(8000) });
    if (response.ok) return await response.json() as { items?: unknown[] };
    if ((response.status !== 429 && response.status !== 503) || attempt === 2) return null;
    await new Promise((resolve) => setTimeout(resolve, 250 * 2 ** attempt));
  }
  return null;
}

function titleMatches(expected: string, actual: string) {
  const expectedWords = norm(expected).split(" ").filter((word) => word.length > 2);
  const actualWords = new Set(norm(actual).split(" ").filter((word) => word.length > 2));
  const normalizedExpected = norm(expected);
  const normalizedActual = norm(actual);
  if (!normalizedExpected || !normalizedActual) return false;
  if (normalizedExpected === normalizedActual
    || normalizedActual.startsWith(`${normalizedExpected} `)
    || normalizedExpected.startsWith(`${normalizedActual} `)) return true;
  const overlap = expectedWords.filter((word) => actualWords.has(word)).length;
  return expectedWords.length >= 2 && overlap >= Math.max(2, Math.ceil(expectedWords.length * 0.7));
}

function authorMatches(expected: string, actualAuthors: string[]) {
  const expectedAuthors = expected.split(/\s*(?:,|&|\band\b)\s*/i).map(norm).filter(Boolean);
  return expectedAuthors.some((expectedAuthor) => actualAuthors.some((actualAuthor) => {
    const normalizedActual = norm(actualAuthor);
    return normalizedActual === expectedAuthor
      || normalizedActual.includes(expectedAuthor)
      || expectedAuthor.includes(normalizedActual);
  }));
}

export async function resolveGoogleBook(candidate: BookCandidate): Promise<ResolvedBook | null> {
  const queries = [
    { value: `intitle:${candidate.title} inauthor:${candidate.author}`, requireAuthor: true },
    { value: `intitle:${candidate.title}`, requireAuthor: false },
  ];
  for (const query of queries) {
    const url = new URL("https://www.googleapis.com/books/v1/volumes");
    url.searchParams.set("q", query.value);
    url.searchParams.set("maxResults", "10");
    url.searchParams.set("printType", "books");
    if (process.env.GOOGLE_BOOKS_API_KEY) url.searchParams.set("key", process.env.GOOGLE_BOOKS_API_KEY);

    const data = await fetchVolumes(url);
    if (!data) continue;
    const volumes = (data.items ?? []).map((item): GoogleVolume | null => (
      item !== null && typeof item === "object" && !Array.isArray(item) ? item as GoogleVolume : null
    )).filter((item): item is GoogleVolume => Boolean(item));
    const titleAndAuthorMatch = volumes.find((item) => {
      if (!item || !item.volumeInfo || typeof item.volumeInfo !== "object") return false;
      const info = item.volumeInfo;
      const title = typeof info.title === "string" ? info.title : "";
      const authors = Array.isArray(info.authors)
        ? info.authors.filter((author): author is string => typeof author === "string")
        : [];
      return titleMatches(candidate.title, title)
        && authorMatches(candidate.author, authors)
        && !/\b(bundle|box set|boxset|omnibus|anthology)\b/i.test(title);
    });
    const volume = titleAndAuthorMatch ?? (!query.requireAuthor ? volumes.find((item) => {
      if (!item || !item.volumeInfo || typeof item.volumeInfo !== "object") return false;
      const info = item.volumeInfo;
      const title = typeof info.title === "string" ? info.title : "";
      return titleMatches(candidate.title, title)
        && !/\b(bundle|box set|boxset|omnibus|anthology)\b/i.test(title);
    }) : undefined);

    if (!volume || typeof volume.id !== "string" || !volume.volumeInfo) continue;
    const info = volume.volumeInfo;
    const title = typeof info.title === "string" ? info.title : null;
    if (!title) continue;
    const authors = Array.isArray(info.authors)
      ? info.authors.filter((author): author is string => typeof author === "string")
      : [];
    const imageLinks = info.imageLinks && typeof info.imageLinks === "object" && !Array.isArray(info.imageLinks)
      ? info.imageLinks as Record<string, unknown>
      : {};
    const cover = typeof imageLinks.thumbnail === "string" ? imageLinks.thumbnail.replace(/^http:/, "https:") : null;
    return {
      google_books_id: volume.id,
      title,
      authors,
      description: typeof info.description === "string" ? info.description : "",
      cover_url: cover,
      published_date: typeof info.publishedDate === "string" ? info.publishedDate : null,
      reason: candidate.reason,
      tier: candidate.tier,
      from_wishlist: candidate.from_wishlist,
    };
  }
  return null;
}

export async function resolveGoogleBooks(candidates: BookCandidate[], concurrency = 6) {
  const resolved: Array<ResolvedBook | null> = Array.from({ length: candidates.length }, () => null);
  let nextIndex = 0;

  async function worker() {
    while (nextIndex < candidates.length) {
      const index = nextIndex++;
      try {
        resolved[index] = await resolveGoogleBook(candidates[index]);
      } catch {
        // One unavailable Google Books lookup should not block the rest.
      }
    }
  }

  const workerCount = Math.min(concurrency, candidates.length);
  await Promise.all(Array.from({ length: workerCount }, () => worker()));
  return resolved.filter((book): book is ResolvedBook => book !== null);
}
