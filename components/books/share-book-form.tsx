"use client";

import { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { Check, Search, Send, Share2, X } from "lucide-react";
import { BookCover } from "@/components/books/book-cover";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useFocusTrap } from "@/components/accessibility/use-focus-trap";
import { createClient } from "@/lib/supabase/client";
import type { Book } from "@/lib/books/types";

export type ShareRecipient = {
  username: string;
  avatar_url: string | null;
  bio: string | null;
};

const MESSAGE_LIMIT = 500;
// Only a couple of people are listed at once; the search box narrows down the rest.
const VISIBLE_RECIPIENTS = 2;

/** "Share book" button that opens the share dialog, keeping the book header compact. */
export function ShareBookForm({
  book,
  recipients,
}: {
  book: Book;
  recipients: ShareRecipient[];
}) {
  const [open, setOpen] = useState(false);
  const close = useCallback(() => setOpen(false), []);

  return (
    <>
      <Button
        type="button"
        variant="outline"
        className="w-full sm:w-auto"
        onClick={() => setOpen(true)}
        aria-haspopup="dialog"
        aria-expanded={open}
      >
        <Share2 aria-hidden="true" />
        Share book
      </Button>
      {open && <ShareBookDialog book={book} recipients={recipients} onClose={close} />}
    </>
  );
}

function ShareBookDialog({
  book,
  recipients,
  onClose,
}: {
  book: Book;
  recipients: ShareRecipient[];
  onClose: () => void;
}) {
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<ShareRecipient | null>(null);
  const [message, setMessage] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sentTo, setSentTo] = useState<string | null>(null);

  const dialogRef = useRef<HTMLElement>(null);
  const pendingRef = useRef(false);
  const titleId = useId();
  const searchId = useId();
  const messageId = useId();
  useFocusTrap(dialogRef, true);

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape" && !pendingRef.current) onClose();
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [onClose]);

  const filteredRecipients = useMemo(() => {
    const normalized = query.trim().replace(/^@/, "").toLowerCase();
    if (!normalized) return recipients;
    return recipients.filter((recipient) => recipient.username.toLowerCase().includes(normalized));
  }, [query, recipients]);

  const visibleRecipients = filteredRecipients.slice(0, VISIBLE_RECIPIENTS);
  const hiddenRecipientCount = filteredRecipients.length - visibleRecipients.length;
  const authors = book.authors?.join(", ") ?? "Unknown author";

  async function shareBook(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selected) {
      setError("Choose someone you follow first.");
      return;
    }

    pendingRef.current = true;
    setPending(true);
    setError(null);
    const supabase = createClient();
    const { error: shareError } = await supabase.rpc("share_book_with_details", {
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
      p_to_username: selected.username,
      p_message: message,
    });
    pendingRef.current = false;
    setPending(false);

    if (shareError) {
      setError("Could not share this book. Please try again.");
      return;
    }
    setSentTo(selected.username);
  }

  function shareAgain() {
    setSentTo(null);
    setSelected(null);
    setQuery("");
    setMessage("");
    setError(null);
  }

  if (typeof document === "undefined") return null;

  return createPortal(
    <div
      className="shelfie-app shelfie-modal-backdrop"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !pendingRef.current) onClose();
      }}
    >
      <section
        ref={dialogRef}
        tabIndex={-1}
        className="shelfie-modal shelfie-share-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
      >
        <header className="shelfie-modal-header">
          <h2 id={titleId} className="flex min-w-0 items-center gap-2 text-2xl font-semibold">
            <Share2 aria-hidden="true" className="size-5 text-primary" /> Share this book
          </h2>
          <button
            type="button"
            className="shelfie-modal-close shrink-0"
            onClick={onClose}
            disabled={pending}
            aria-label="Close share dialog"
          >
            <X aria-hidden="true" className="size-5" />
          </button>
        </header>

        <div className="shelfie-share-book">
          <BookCover src={book.cover_url} title={book.title} className="w-12 shrink-0" sizes="48px" />
          <div className="min-w-0">
            <p className="shelfie-heading line-clamp-2 text-lg font-semibold leading-tight">{book.title}</p>
            <p className="line-clamp-1 text-sm text-muted-foreground">{authors}</p>
          </div>
        </div>

        {sentTo ? (
          <div className="space-y-5 px-5 pb-6 pt-2 text-center sm:px-6" role="status">
            <div className="shelfie-confirm-icon mx-auto" aria-hidden="true">
              <Check />
            </div>
            <div className="space-y-1">
              <p className="text-xl font-semibold">Book sent!</p>
              <p className="text-sm text-muted-foreground">
                <span className="font-medium text-foreground">@{sentTo}</span> will find it in their shared books.
              </p>
            </div>
            <div className="flex flex-col-reverse justify-center gap-2 sm:flex-row">
              <Button type="button" variant="outline" onClick={shareAgain}>
                Send to someone else
              </Button>
              <Button type="button" onClick={onClose}>
                Done
              </Button>
            </div>
          </div>
        ) : recipients.length ? (
          <form onSubmit={shareBook}>
            <div className="space-y-5 px-5 pb-5 sm:px-6">
              <div className="space-y-2">
                <Label htmlFor={selected ? undefined : searchId}>Who do you want to send it to?</Label>
                {selected ? (
                  <div className="shelfie-share-selected">
                    <RecipientAvatar recipient={selected} />
                    <div className="min-w-0 flex-1">
                      <p className="font-medium">@{selected.username}</p>
                      {selected.bio && <p className="line-clamp-1 text-sm text-muted-foreground">{selected.bio}</p>}
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelected(null)}
                      disabled={pending}
                    >
                      Change
                    </Button>
                  </div>
                ) : (
                  <>
                    <div className="relative">
                      <Search
                        aria-hidden="true"
                        className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
                      />
                      <input
                        id={searchId}
                        type="search"
                        value={query}
                        onChange={(event) => setQuery(event.target.value)}
                        placeholder="Search the people you follow"
                        autoComplete="off"
                        className="flex h-10 w-full rounded-lg border border-input bg-background pl-9 pr-3 text-sm shadow-sm outline-none placeholder:text-muted-foreground focus-visible:ring-1 focus-visible:ring-ring"
                      />
                    </div>
                    {filteredRecipients.length ? (
                      <ul className="shelfie-share-recipients" aria-label="People you follow">
                        {visibleRecipients.map((recipient) => (
                          <li key={recipient.username}>
                            <button
                              type="button"
                              className="shelfie-share-recipient"
                              onClick={() => {
                                setSelected(recipient);
                                setError(null);
                              }}
                            >
                              <RecipientAvatar recipient={recipient} />
                              <span className="min-w-0 flex-1">
                                <span className="block font-medium">@{recipient.username}</span>
                                {recipient.bio && (
                                  <span className="line-clamp-1 text-sm text-muted-foreground">{recipient.bio}</span>
                                )}
                              </span>
                            </button>
                          </li>
                        ))}
                        {hiddenRecipientCount > 0 && (
                          <li className="px-1 pt-1 text-xs text-muted-foreground" aria-live="polite">
                            +{hiddenRecipientCount} more {hiddenRecipientCount === 1 ? "person" : "people"}, search by
                            username to find them.
                          </li>
                        )}
                      </ul>
                    ) : (
                      <p className="rounded-lg border border-dashed p-4 text-center text-sm text-muted-foreground">
                        No one you follow matches “{query.trim()}”.
                      </p>
                    )}
                  </>
                )}
              </div>

              <div className="space-y-2">
                <div className="flex items-baseline justify-between gap-3">
                  <Label htmlFor={messageId}>Message <span className="font-normal text-muted-foreground">(optional)</span></Label>
                  <span className="text-xs text-muted-foreground" aria-live="polite">
                    {message.length}/{MESSAGE_LIMIT}
                  </span>
                </div>
                <textarea
                  id={messageId}
                  value={message}
                  onChange={(event) => setMessage(event.target.value)}
                  placeholder="Please read this, I need someone to talk about it with."
                  maxLength={MESSAGE_LIMIT}
                  rows={3}
                  className="flex min-h-24 w-full resize-none rounded-lg border border-input bg-background px-3 py-2 text-sm shadow-sm outline-none placeholder:text-muted-foreground focus-visible:ring-1 focus-visible:ring-ring"
                />
              </div>

              {error && (
                <p role="alert" className="text-sm text-destructive">
                  {error}
                </p>
              )}
            </div>

            <div className="flex items-center justify-between gap-3 px-5 pb-5 sm:px-6 sm:pb-6">
              <Button type="button" variant="outline" onClick={onClose} disabled={pending}>
                Cancel
              </Button>
              <Button type="submit" disabled={pending || !selected}>
                <Send aria-hidden="true" />
                {pending ? "Sending…" : "Share book"}
              </Button>
            </div>
          </form>
        ) : (
          <div className="space-y-4 px-5 pb-6 sm:px-6">
            <p className="rounded-lg border border-dashed p-5 text-center text-sm text-muted-foreground">
              You can share books with the readers you follow. Follow someone first and they&apos;ll show up here.
            </p>
            <div className="flex justify-end">
              <Button asChild>
                <Link href="/protected/profiles" onClick={onClose}>
                  Find readers
                </Link>
              </Button>
            </div>
          </div>
        )}
      </section>
    </div>,
    document.body,
  );
}

function RecipientAvatar({ recipient }: { recipient: ShareRecipient }) {
  return recipient.avatar_url ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={recipient.avatar_url} alt="" className="size-10 shrink-0 rounded-full object-cover" />
  ) : (
    <span
      aria-hidden="true"
      className="flex size-10 shrink-0 items-center justify-center rounded-full bg-secondary font-semibold"
    >
      {recipient.username[0]?.toUpperCase()}
    </span>
  );
}
