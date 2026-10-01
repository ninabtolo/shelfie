"use client";

import { useState } from "react";

const MINIMUM_DESCRIPTION_LENGTH = 300;

export function BookDescription({ description }: { description: string | null }) {
  const [expanded, setExpanded] = useState(false);
  const hasMore = Boolean(description && description.length > MINIMUM_DESCRIPTION_LENGTH);

  return (
    <div className="space-y-2">
      <p
        className={`whitespace-pre-line break-words text-sm leading-relaxed text-muted-foreground ${
          !expanded && hasMore ? "line-clamp-6" : ""
        }`}
      >
        {description ?? "No description available."}
      </p>
      {hasMore && (
        <button
          type="button"
          onClick={() => setExpanded((current) => !current)}
          className="text-sm font-medium text-primary underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          aria-expanded={expanded}
        >
          {expanded ? "Show less" : "Read more"}
        </button>
      )}
    </div>
  );
}
