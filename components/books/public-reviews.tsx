import type { BookStatus } from "@/components/books/review-form";
import { MessageCircle } from "lucide-react";
import { RatingStars } from "@/components/books/rating-stars";

export type PublicReview = {
  review_id: string;
  username: string;
  avatar_url: string | null;
  rating: number;
  review_text: string | null;
  reading_status: BookStatus;
  created_at: string;
  title?: string;
  google_books_id?: string;
};

const statusLabels: Record<BookStatus, string> = {
  reading: "Reading",
  read: "Read",
  abandoned: "Abandoned",
};

export function PublicReviews({ reviews, title = "Public reviews" }: { reviews: PublicReview[]; title?: string }) {
  return (
    <section className="space-y-4" aria-labelledby="public-reviews-title">
      <h2 id="public-reviews-title" className="shelfie-section-heading"><MessageCircle aria-hidden="true" className="size-6 text-primary" /><span>{title}</span></h2>
      {reviews.length ? (
        <ul className="space-y-4">
          {reviews.map((review) => (
            <li key={review.review_id} className="shelfie-surface p-4 sm:p-5">
              <div className="flex items-start gap-3">
                {review.avatar_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={review.avatar_url} alt="" className="size-9 rounded-full object-cover" />
                ) : (
                  <div className="flex size-9 items-center justify-center rounded-full bg-secondary font-semibold">{review.username[0]?.toUpperCase()}</div>
                )}
                <div className="min-w-0 flex-1">
                  <p className="font-medium">@{review.username}</p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(review.created_at).toLocaleString()} · {statusLabels[review.reading_status]}
                  </p>
                </div>
                <RatingStars rating={review.rating} size="sm" />
              </div>
              {review.title && (
                <p className="mt-3 font-semibold">
                  {review.title}
                </p>
              )}
              {review.review_text && <p className="mt-3 whitespace-pre-wrap text-sm">{review.review_text}</p>}
            </li>
          ))}
        </ul>
      ) : (
        <p className="rounded-xl border border-dashed p-6 text-center text-sm text-muted-foreground">No public reviews yet.</p>
      )}
    </section>
  );
}
