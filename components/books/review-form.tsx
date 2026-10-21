"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase/client";
import type { Book } from "@/lib/books/types";

export type BookStatus = "reading" | "read" | "abandoned";

const statuses: { value: BookStatus; label: string }[] = [
  { value: "reading", label: "Reading" },
  { value: "read", label: "Read" },
  { value: "abandoned", label: "Abandoned" },
];

export type ReviewInput = {
  id: string;
  rating: number;
  review_text: string | null;
  reading_status: BookStatus;
  is_public: boolean;
};

export function ReviewForm({
  book,
  initialStatus = "reading",
  review,
}: {
  book?: Book;
  initialStatus?: BookStatus;
  review?: ReviewInput;
}) {
  const router = useRouter();
  const [status, setStatus] = useState<BookStatus>(review?.reading_status ?? initialStatus);
  const [rating, setRating] = useState(review?.rating ?? 0);
  const [reviewText, setReviewText] = useState(review?.review_text ?? "");
  const [isPublic, setIsPublic] = useState(review?.is_public ?? false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const editing = Boolean(review);

  async function submit() {
    if (!rating) {
      setError("Choose a rating from one to five stars.");
      return;
    }
    setPending(true);
    setError(null);
    const supabase = createClient();
    const result = review
      ? await supabase.rpc("update_review", {
          p_review_id: review.id,
          p_rating: rating,
          p_status: status,
          p_review_text: reviewText,
          p_is_public: isPublic,
        })
      : book
        ? await supabase.rpc("add_review", {
            p_google_books_id: book.google_books_id,
            p_title: book.title,
            p_status: status,
            p_rating: rating,
            p_review_text: reviewText,
            p_is_public: isPublic,
            p_subtitle: book.subtitle,
            p_authors: book.authors,
            p_description: book.description,
            p_isbn_10: book.isbn_10,
            p_isbn_13: book.isbn_13,
            p_publisher: book.publisher,
            p_published_date: book.published_date,
            p_page_count: book.page_count,
            p_genres: book.genres,
            p_language: book.language,
            p_cover_url: book.cover_url,
          })
        : { error: new Error("Book information is required.") };

    if (result.error) {
      setError("Could not save your review. Please try again.");
      setPending(false);
      return;
    }
    setPending(false);
    if (!editing) {
      setRating(0);
      setReviewText("");
    }
    router.refresh();
  }

  return (
    <section className="shelfie-review-panel w-full" aria-labelledby="review-form-title">
      <div className="space-y-2 p-5 pb-4 sm:p-6 sm:pb-5">
        <p className="text-[0.68rem] font-semibold uppercase tracking-[0.22em] text-primary">A note for your future self</p>
        <h2 id="review-form-title" className="shelfie-heading text-2xl font-semibold">{editing ? "Edit review" : "Review this book"}</h2>
        <p className="text-sm text-muted-foreground">Leave a small trace of what this story awakened in you.</p>
      </div>
      <div className="shelfie-review-step flex gap-3 p-5 sm:p-6">
        <span className="shelfie-step-number">01</span>
        <div className="min-w-0 flex-1 space-y-2">
          <div>
            <Label htmlFor={`${review?.id ?? "new"}-review-status`} className="font-medium">Reading status</Label>
            <p className="text-xs text-muted-foreground">Where are you in this story?</p>
          </div>
          <select
            id={`${review?.id ?? "new"}-review-status`}
            value={status}
            onChange={(event) => setStatus(event.target.value as BookStatus)}
            disabled={pending}
            className="h-9 w-full max-w-sm rounded-md border border-input bg-background px-3 text-sm"
          >
            {statuses.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
          </select>
        </div>
      </div>
      <div className="shelfie-review-step flex gap-3 p-5 sm:p-6">
        <span className="shelfie-step-number">02</span>
        <div className="min-w-0 flex-1 space-y-2">
          <div>
            <Label className="font-medium">How did it feel?</Label>
            <p className="text-xs text-muted-foreground">Choose the star that feels closest to your experience.</p>
          </div>
          <div className="shelfie-rating-box flex min-h-20 flex-col justify-center gap-1 px-4 py-3" role="radiogroup" aria-label="Rating">
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5].map((value) => (
                <button
                  key={value}
                  type="button"
                  role="radio"
                  aria-checked={rating === value}
                  aria-label={`${value} ${value === 1 ? "star" : "stars"}`}
                  onClick={() => setRating(value)}
                  disabled={pending}
                  className={`rounded-sm p-0.5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${value <= rating ? "text-primary" : "text-muted-foreground/60"}`}
                >
                  <Star aria-hidden="true" className="size-6" fill={value <= rating ? "currentColor" : "none"} />
                </button>
              ))}
            </div>
            <p className="text-xs text-muted-foreground">{rating ? `${rating} out of 5 stars` : "No rating yet"}</p>
          </div>
        </div>
      </div>
      <div className="shelfie-review-step flex gap-3 p-5 sm:p-6">
        <span className="shelfie-step-number">03</span>
        <div className="min-w-0 flex-1 space-y-2">
          <div>
            <Label htmlFor={`${review?.id ?? "new"}-review-text`} className="font-medium">Leave a few words</Label>
            <p className="text-xs text-muted-foreground">A sentence is enough. Let your future self remember the feeling.</p>
          </div>
          <textarea
            id={`${review?.id ?? "new"}-review-text`}
            value={reviewText}
            onChange={(event) => setReviewText(event.target.value)}
            maxLength={5000}
            rows={4}
            placeholder="Share your thoughts (optional)"
            disabled={pending}
            className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          />
        </div>
      </div>
      <div className="p-5 sm:p-6">
        <label className="flex items-start gap-2 text-sm">
          <input type="checkbox" checked={isPublic} onChange={(event) => setIsPublic(event.target.checked)} disabled={pending} className="mt-0.5 size-4 accent-primary" />
          <span><span className="font-medium">Let the reading circle see this</span><span className="block text-xs text-muted-foreground">Your review will appear on your public profile and this book&apos;s page.</span></span>
        </label>
      </div>
      <div className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
        <p className="text-xs text-muted-foreground">You can edit this later.</p>
        <div className="flex flex-col items-stretch gap-2 sm:items-end">
          {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
          <Button type="button" onClick={submit} disabled={pending}>
            {pending ? "Saving…" : editing ? "Save changes" : "Post review"}
          </Button>
        </div>
      </div>
    </section>
  );
}

export async function deleteReview(reviewId: string) {
  return createClient().rpc("delete_review", { p_review_id: reviewId });
}
