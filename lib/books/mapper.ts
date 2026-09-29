import type { Book } from "./types";

function record(value: unknown): Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function text(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function textList(value: unknown): string[] | null {
  if (!Array.isArray(value)) return null;
  const values = value.map(text).filter((item): item is string => item !== null);
  return values.length ? [...new Set(values)] : null;
}

function coverUrl(value: unknown): string | null {
  const source = text(value);
  if (!source) return null;

  try {
    const url = new URL(source);
    if (url.protocol !== "http:" && url.protocol !== "https:") return null;
    url.protocol = "https:";
    return url.toString();
  } catch {
    return null;
  }
}

/** Keep descriptions as plain text; never render provider HTML as markup. */
function descriptionText(value: unknown): string | null {
  const description = text(value);
  if (!description) return null;

  const entities: Record<string, string> = {
    amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: " ",
    ndash: "–", mdash: "—", hellip: "…", lsquo: "‘", rsquo: "’",
    ldquo: "“", rdquo: "”",
  };

  return text(description
    .replace(/<(script|style)\b[^>]*>[\s\S]*?<\/\1\s*>/gi, "")
    .replace(/<br\s*\/?\s*>|<\/(?:p|div|li|h[1-6])\s*>/gi, "\n")
    .replace(/<[^>]*>/g, "")
    .replace(/&(#x[\da-f]+|#\d+|[a-z]+);/gi, (entity, name: string) => {
      if (!name.startsWith("#")) return entities[name] ?? entity;
      const code = name[1].toLowerCase() === "x"
        ? parseInt(name.slice(2), 16)
        : parseInt(name.slice(1), 10);
      return code > 0 && code <= 0x10ffff && !(code >= 0xd800 && code <= 0xdfff)
        ? String.fromCodePoint(code)
        : entity;
    })
    .replace(/\n{3,}/g, "\n\n"));
}

export function mapGoogleBook(value: unknown): Book | null {
  const volume = record(value);
  const id = text(volume.id);
  const info = record(volume.volumeInfo);
  const title = text(info.title);
  // Do not invent values for the database's required identifiers and title.
  if (!id || !title) return null;

  const identifiers = Array.isArray(info.industryIdentifiers)
    ? info.industryIdentifiers.map(record)
    : [];
  const images = record(info.imageLinks);
  const pageCount = info.pageCount;

  return {
    google_books_id: id,
    title,
    subtitle: text(info.subtitle),
    authors: textList(info.authors),
    description: descriptionText(info.description),
    isbn_10: text(identifiers.find((item) => item.type === "ISBN_10")?.identifier),
    isbn_13: text(identifiers.find((item) => item.type === "ISBN_13")?.identifier),
    publisher: text(info.publisher),
    published_date: text(info.publishedDate),
    page_count: typeof pageCount === "number" && Number.isInteger(pageCount) && pageCount > 0
      ? pageCount
      : null,
    genres: textList(info.categories),
    language: text(info.language),
    cover_url: coverUrl(images.thumbnail) ?? coverUrl(images.smallThumbnail),
  };
}
