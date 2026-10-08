"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { ReviewForm, type ReviewInput } from "@/components/books/review-form";

export function MyReviews({ reviews }: { reviews: ReviewInput[] }) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [items, setItems] = useState(reviews);
  const [error, setError] = useState<string | null>(null);

  async function remove(id: string) {
    if (!window.confirm("Delete this review?")) return;
    setError(null);
    const { error: deleteError } = await createClient().rpc("delete_review", { p_review_id: id });
    if (deleteError) {
      setError("Could not delete this review. Please try again.");
      return;
    }
    setItems((current) => current.filter((review) => review.id !== id));
  }

  if (!items.length) return null;

  return (
    <section className="space-y-4" aria-labelledby="my-reviews-title">
      <h2 id="my-reviews-title" className="text-2xl font-semibold">Your reviews</h2>
      {items.map((review) => (
        <div key={review.id} className="rounded-xl border bg-card p-4">
          {editingId === review.id ? (
            <ReviewForm review={review} />
          ) : (
            <>
              <div className="flex items-center justify-between gap-4">
                <p className="text-lg text-primary" aria-label={`${review.rating} out of 5 stars`}>
                  {"★".repeat(review.rating)}{"☆".repeat(5 - review.rating)}
                </p>
                <p className="text-sm text-muted-foreground">{review.reading_status} · {review.is_public ? "Public" : "Private"}</p>
              </div>
              {review.review_text && <p className="mt-2 whitespace-pre-wrap text-sm">{review.review_text}</p>}
              <div className="mt-3 flex gap-2">
                <Button type="button" variant="outline" size="sm" onClick={() => setEditingId(review.id)}>Edit</Button>
                <Button type="button" variant="outline" size="sm" onClick={() => remove(review.id)}>Delete</Button>
              </div>
            </>
          )}
        </div>
      ))}
      {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
    </section>
  );
}
