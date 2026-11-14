import { bookKey, norm } from "@/lib/ai/book-match";

export type Review = {
  rating?: number;
  review_text?: string | null;
  reading_status?: string;
  created_at?: string;
};

export type Book = {
  google_books_id?: string;
  title?: string;
  authors?: string[];
  genres?: string[];
  description?: string | null;
  language?: string | null;
  status?: string;
  favorite?: boolean;
  reviews?: Review[];
};

export type ReadingProfile = {
  library?: Book[];
  wishlist?: Book[];
  dismissed?: Book[];
};

export function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

export { norm };

export function identity(title: string, author: string) {
  return bookKey(title, author);
}

export function bookIdentities(book: Book) {
  return (book.authors?.length ? book.authors : [""]).map((author) => identity(book.title ?? "", author));
}

export function evidenceStrength(book: Book) {
  const rating = book.reviews?.[0]?.rating;
  const ratingWeight = typeof rating === "number" ? Math.abs(rating - 3) * 4 : 0;
  const reviewWeight = book.reviews?.some((review) => review.review_text?.trim()) ? 5 : 0;
  const favoriteWeight = book.favorite ? 8 : 0;
  const statusWeight = book.status === "abandoned" ? 4 : book.status ? 2 : 0;
  return ratingWeight + reviewWeight + favoriteWeight + statusWeight;
}

/**
 * This is the single compact representation shared by automatic
 * recommendations and the conversational assistant. Keep it deliberately
 * bounded because reviews and descriptions are user-controlled text.
 */
export function compactProfile(profile: ReadingProfile) {
  return {
    weighting: {
      explicit_review_text: 10,
      rating: 9,
      favorite: 8,
      reading_status: 5,
      author_and_recurring_style: 4,
      themes_and_plot_from_description: 3,
      genre: 2,
      wishlist: 1,
    },
    library: (profile.library ?? []).slice(0, 120)
      .sort((a, b) => evidenceStrength(b) - evidenceStrength(a))
      .map((book) => ({
        title: book.title,
        authors: book.authors,
        genres: book.genres,
        description: book.description,
        language: book.language,
        status: book.status,
        favorite: book.favorite,
        signal_strength: evidenceStrength(book),
        reviews: (book.reviews ?? []).slice(0, 3).map((review) => ({
          rating: review.rating,
          review_text: review.review_text,
          reading_status: review.reading_status,
        })),
      })),
    wishlist: (profile.wishlist ?? []).slice(0, 120).map((book) => ({
      title: book.title,
      authors: book.authors,
      genres: book.genres,
    })),
    dismissed: (profile.dismissed ?? []).slice(0, 120).map((book) => ({
      title: book.title,
      authors: book.authors,
    })),
  };
}

export function excludedBookKeys(profile: ReadingProfile, extra: Book[] = []) {
  const excluded = [...(profile.library ?? []), ...(profile.dismissed ?? []), ...extra];
  return {
    ids: new Set(excluded.map((book) => book.google_books_id).filter(Boolean)),
    names: new Set(excluded.flatMap(bookIdentities)),
  };
}

export function wishlistKeys(profile: ReadingProfile) {
  return new Set((profile.wishlist ?? []).flatMap(bookIdentities));
}
