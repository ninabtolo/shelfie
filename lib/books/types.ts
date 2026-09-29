/** Google Books data aligned with public.books, before database-generated fields. */
export interface Book {
  google_books_id: string;
  title: string;
  subtitle: string | null;
  authors: string[] | null;
  description: string | null;
  isbn_10: string | null;
  isbn_13: string | null;
  publisher: string | null;
  published_date: string | null;
  page_count: number | null;
  genres: string[] | null;
  language: string | null;
  cover_url: string | null;
}
