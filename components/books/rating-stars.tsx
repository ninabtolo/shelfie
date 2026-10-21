import { Star } from "lucide-react";

export function RatingStars({ rating, size = "md" }: { rating: number; size?: "sm" | "md" }) {
  const safeRating = Math.max(0, Math.min(5, Math.round(rating)));
  const iconSize = size === "sm" ? "size-3.5" : "size-5";

  return (
    <span className="inline-flex items-center gap-0.5 text-primary" aria-label={`${safeRating} out of 5 stars`}>
      {Array.from({ length: 5 }, (_, index) => {
        const filled = index < safeRating;
        return (
          <Star key={index} aria-hidden="true" className={iconSize} fill={filled ? "currentColor" : "none"} />
        );
      })}
    </span>
  );
}
