"use client";

import { useState } from "react";
import { Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";

export function RemoveFromLibraryButton({ bookId, title }: { bookId: string; title: string }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function removeBook() {
    if (!window.confirm(`Remove "${title}" from your library?`)) return;

    setPending(true);
    setError(null);
    const supabase = createClient();
    const { error: deleteError } = await supabase
      .from("user_books")
      .delete()
      .eq("book_id", bookId);

    if (deleteError) {
      setError("Could not remove this book. Please try again.");
      setPending(false);
      return;
    }

    router.refresh();
  }

  return (
    <div className="flex shrink-0 flex-col items-end gap-2">
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="text-primary hover:bg-primary/10 hover:text-primary"
        onClick={removeBook}
        disabled={pending}
        aria-label={`Remove ${title} from library`}
        title="Remove from library"
      >
        <Trash2 aria-hidden="true" />
      </Button>
      {error && <p role="alert" className="max-w-32 text-right text-xs text-destructive">{error}</p>}
    </div>
  );
}
