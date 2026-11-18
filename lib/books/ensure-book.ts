/**
 * Asks the server to add a Google Books volume to the shared catalog
 * (POST /api/books). Call it before the library, wishlist, review or share
 * RPCs, which only accept books that already exist in public.books.
 * Throws an Error with a user-facing message when it fails.
 */
export async function ensureBookSaved(googleBooksId: string): Promise<void> {
  const response = await fetch("/api/books", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ google_books_id: googleBooksId }),
  });
  if (response.ok) return;

  const data = await response.json().catch(() => null) as { error?: unknown } | null;
  throw new Error(typeof data?.error === "string" ? data.error : "Could not save this book. Please try again.");
}
