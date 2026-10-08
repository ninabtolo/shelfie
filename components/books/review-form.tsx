"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
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
    <section className="space-y-4 rounded-xl border bg-card p-5" aria-labelledby="review-form-title">
      <h2 id="review-form-title" className="font-semibold">{editing ? "Edit review" : "Review this book"}</h2>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="grid gap-2">
          <Label htmlFor={`${review?.id ?? "new"}-review-status`}>Status</Label>
          <select
            id={`${review?.id ?? "new"}-review-status`}
            value={status}
            onChange={(event) => setStatus(event.target.value as BookStatus)}
            disabled={pending}
            className="h-9 rounded-md border border-input bg-background px-3 text-sm"
          >
            {statuses.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
          </select>
        </div>
        <div className="grid gap-2">
          <Label>Rating</Label>
          <div className="flex h-9 items-center" role="radiogroup" aria-label="Rating">
            {[1, 2, 3, 4, 5].map((value) => (
              <button
                key={value}
                type="button"
                role="radio"
                aria-checked={rating === value}
                aria-label={`${value} ${value === 1 ? "star" : "stars"}`}
                onClick={() => setRating(value)}
                disabled={pending}
                className={`text-2xl leading-none ${value <= rating ? "text-primary" : "text-muted-foreground"}`}
              >
                {value <= rating ? "★" : "☆"}
              </button>
            ))}
          </div>
        </div>
      </div>
      <div className="grid gap-2">
        <Label htmlFor={`${review?.id ?? "new"}-review-text`}>Review</Label>
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
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" checked={isPublic} onChange={(event) => setIsPublic(event.target.checked)} disabled={pending} className="size-4 accent-primary" />
        Public review
      </label>
      {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
      <Button type="button" onClick={submit} disabled={pending}>
        {pending ? "Saving…" : editing ? "Save changes" : "Post review"}
      </Button>
    </section>
  );
}

export async function deleteReview(reviewId: string) {
  return createClient().rpc("delete_review", { p_review_id: reviewId });
}
