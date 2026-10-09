"use client";

import { useMemo, useState } from "react";
import { Send, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase/client";
import type { Book } from "@/lib/books/types";

export type ShareRecipient = {
  username: string;
  avatar_url: string | null;
  bio: string | null;
};

export function ShareBookForm({
  book,
  recipients,
}: {
  book: Book;
  recipients: ShareRecipient[];
}) {
  const [query, setQuery] = useState("");
  const [selectedUsername, setSelectedUsername] = useState("");
  const [message, setMessage] = useState("");
  const [pending, setPending] = useState(false);
  const [open, setOpen] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const filteredRecipients = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return recipients.filter((recipient) =>
      recipient.username.toLowerCase().includes(normalizedQuery),
    );
  }, [query, recipients]);

  async function shareBook(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedUsername) {
      setFeedback({ type: "error", text: "Select someone you follow first." });
      return;
    }

    setPending(true);
    setFeedback(null);
    const supabase = createClient();
    const { error } = await supabase.rpc("share_book_with_details", {
      p_google_books_id: book.google_books_id,
      p_title: book.title,
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
      p_to_username: selectedUsername,
      p_message: message,
    });

    if (error) {
      setFeedback({ type: "error", text: "Could not share this book. Please try again." });
    } else {
      setFeedback({ type: "success", text: `Book shared with @${selectedUsername}.` });
      setMessage("");
      setQuery("");
      setSelectedUsername("");
    }
    setPending(false);
  }

  return (
    <section className="space-y-4" aria-labelledby="share-book-title">
      <Button type="button" variant="outline" onClick={() => setOpen(!open)} aria-expanded={open}>
        <Share2 aria-hidden="true" />
        Share book
      </Button>
      {open && <div className="space-y-4 rounded-xl border bg-card p-5">
      <div className="space-y-1">
        <h2 id="share-book-title" className="text-lg font-semibold">Share this book</h2>
        <p className="text-sm text-muted-foreground">Send it to someone you follow with a note.</p>
      </div>
      {recipients.length ? (
        <form className="space-y-4" onSubmit={shareBook}>
          <div className="space-y-2">
            <Label htmlFor="share-recipient">Who do you want to send it to?</Label>
            <input
              id="share-recipient"
              type="text"
              value={query}
              onChange={(event) => {
                setQuery(event.target.value);
                setSelectedUsername("");
              }}
              placeholder="Search the people you follow"
              autoComplete="off"
              className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm outline-none focus-visible:ring-1 focus-visible:ring-ring"
              aria-describedby="share-recipient-options"
            />
            <div id="share-recipient-options" className="grid gap-1" role="listbox" aria-label="People you follow">
              {filteredRecipients.map((recipient) => (
                <button
                  key={recipient.username}
                  type="button"
                  role="option"
                  aria-selected={selectedUsername === recipient.username}
                  onClick={() => {
                    setSelectedUsername(recipient.username);
                    setQuery(`@${recipient.username}`);
                  }}
                  className={`rounded-md border px-3 py-2 text-left text-sm hover:bg-accent ${
                    selectedUsername === recipient.username ? "border-primary bg-accent" : ""
                  }`}
                >
                  <span className="font-medium">@{recipient.username}</span>
                  {recipient.bio && <span className="ml-2 text-muted-foreground">{recipient.bio}</span>}
                </button>
              ))}
              {!filteredRecipients.length && (
                <p className="text-sm text-muted-foreground">No followed person matches that search.</p>
              )}
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="share-message">Message (optional)</Label>
            <textarea
              id="share-message"
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              placeholder="Read this"
              maxLength={500}
              rows={3}
              className="flex min-h-20 w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm outline-none focus-visible:ring-1 focus-visible:ring-ring"
            />
            <p className="text-right text-xs text-muted-foreground">{message.length}/500</p>
          </div>
          <Button type="submit" disabled={pending || !selectedUsername}>
            <Send aria-hidden="true" />
            {pending ? "Sharing..." : "Share book"}
          </Button>
          {feedback && (
            <p role={feedback.type === "error" ? "alert" : "status"} className={`text-sm ${feedback.type === "error" ? "text-destructive" : "text-primary"}`}>
              {feedback.text}
            </p>
          )}
        </form>
      ) : (
        <p className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
          Follow someone first to share books with them.
        </p>
      )}
      </div>}
    </section>
  );
}
