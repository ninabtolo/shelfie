"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { NotebookPen } from "lucide-react";
import { RatingStars } from "@/components/books/rating-stars";
import { createClient } from "@/lib/supabase/client";
import { ReviewForm, type ReviewInput } from "@/components/books/review-form";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";

export function MyReviews({ reviews }: { reviews: ReviewInput[] }) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [items, setItems] = useState(reviews);
  const [error, setError] = useState<string | null>(null);
  const [deleteReviewId, setDeleteReviewId] = useState<string | null>(null);

  useEffect(() => {
    setItems(reviews);
  }, [reviews]);

  async function remove(id: string) {
    setError(null);
    const { error: deleteError } = await createClient().rpc("delete_review", { p_review_id: id });
    if (deleteError) {
      setError("Could not delete this review. Please try again.");
      return;
    }
    setItems((current) => current.filter((review) => review.id !== id));
  }

  return (
    <section className="space-y-4" aria-labelledby="my-reviews-title">
      <h2 id="my-reviews-title" className="shelfie-section-heading"><NotebookPen aria-hidden="true" className="size-6 text-primary" /><span>Your reviews</span></h2>
      {items.length ? items.map((review) => (
        <div key={review.id} className="shelfie-surface p-4 sm:p-5">
          {editingId === review.id ? (
            <ReviewForm review={review} embedded onSaved={() => setEditingId(null)} />
          ) : (
            <>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <RatingStars rating={review.rating} />
                <p className="text-sm text-muted-foreground">{review.reading_status} · {review.is_public ? "Public" : "Private"}</p>
              </div>
              {review.review_text && <p className="mt-3 whitespace-pre-wrap text-sm leading-6">{review.review_text}</p>}
              <div className="mt-4 flex flex-wrap gap-2">
                <Button type="button" variant="outline" size="sm" onClick={() => setEditingId(review.id)}>Edit</Button>
                <Button type="button" variant="outline" size="sm" onClick={() => setDeleteReviewId(review.id)}>Delete</Button>
              </div>
            </>
          )}
        </div>
      )) : (
        <p className="rounded-xl border border-dashed p-6 text-center text-sm text-muted-foreground">You have not posted a review for this book yet.</p>
      )}
      {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
      <ConfirmationDialog
        open={deleteReviewId !== null}
        title="Delete this review?"
        description="This review will be permanently deleted. This action can’t be undone."
        confirmLabel="Delete review"
        pendingLabel="Deleting…"
        onCancel={() => setDeleteReviewId(null)}
        onConfirm={() => (deleteReviewId ? remove(deleteReviewId) : undefined)}
      />
    </section>
  );
}
