export const BOOKS_PAGE_SIZE = 12;
export const MAX_QUERY_LENGTH = 200;

export type SearchParams = Record<string, string | string[] | undefined>;

export function parseBookSearch(params: SearchParams) {
  const query = typeof params.q === "string"
    ? params.q.trim().slice(0, MAX_QUERY_LENGTH)
    : "";
  const page = typeof params.page === "string" ? Number(params.page) : 1;

  return {
    query,
    page: Number.isSafeInteger(page) && page > 0 && page <= 1000 ? page : 1,
  };
}

export function bookSearchHref(query: string, page = 1) {
  if (!query) return "/protected";
  return `/protected?${new URLSearchParams({ q: query, page: String(page) })}`;
}
