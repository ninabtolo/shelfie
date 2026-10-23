"use client";

import Link from "next/link";
import { Fragment, useCallback, useEffect, useRef, useState } from "react";
import { EyeOff, Loader2, Plus, Send, Sparkles, Trash2 } from "lucide-react";
import { BookCover } from "@/components/books/book-cover";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";
import { Button } from "@/components/ui/button";
import { ShelfieHero } from "@/components/shelfie-hero";

const MESSAGE_LIMIT = 20;

type Recommendation = {
  google_books_id: string;
  title: string;
  authors: string[];
  description: string;
  cover_url: string | null;
  published_date: string | null;
  reason: string;
  from_wishlist: boolean;
};

type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  recommendations: Recommendation[];
  created_at: string;
};

type ConversationSummary = {
  id: string;
  title: string;
  user_message_count: number;
  created_at: string;
  updated_at: string;
};

type Conversation = ConversationSummary & {
  messages: ChatMessage[];
};

type ApiError = { error?: string };

function formatConversationDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric" }).format(date);
}

function MessageBubble({ message }: {
  message: ChatMessage;
}) {
  const isAssistant = message.role === "assistant";
  return (
    <li className={`flex ${isAssistant ? "justify-start" : "justify-end"}`}>
      <article className={`max-w-3xl rounded-2xl px-4 py-3 ${isAssistant ? "shelfie-surface rounded-bl-sm" : "bg-primary text-primary-foreground rounded-br-sm"}`}>
        <p className="whitespace-pre-wrap text-sm leading-6">{message.content}</p>
      </article>
    </li>
  );
}

function RecommendationMessage({ message, onDismiss, dismissingId }: {
  message: ChatMessage;
  onDismiss: (book: Recommendation) => void;
  dismissingId: string | null;
}) {
  if (message.role !== "assistant" || message.recommendations.length === 0) return null;

  return (
    <li className="flex justify-start">
      <ul className="grid w-full max-w-4xl gap-3 sm:grid-cols-2" aria-label="Book recommendations">
        {message.recommendations.map((book) => (
          <li key={book.google_books_id}>
            <article className="book-card h-full rounded-xl border bg-card p-3">
              <div className="flex gap-3">
                <BookCover src={book.cover_url} title={book.title} sizes="56px" className="w-14 shrink-0" />
                <div className="min-w-0 flex-1">
                  {book.from_wishlist && <span className="text-[0.64rem] font-semibold uppercase tracking-[0.12em] text-primary">From your wishlist</span>}
                  <h3 className="mt-1 line-clamp-3 text-sm font-semibold">{book.title}</h3>
                  <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">{book.authors.join(", ") || "Unknown author"}</p>
                </div>
              </div>
              <p className="mt-3 border-l-2 border-primary/40 pl-2 text-xs leading-5 text-muted-foreground">{book.reason}</p>
              <div className="mt-2 flex items-center justify-between gap-2">
                <Button variant="link" size="sm" className="h-auto px-0 text-xs" asChild>
                  <Link href={`/protected/books/${encodeURIComponent(book.google_books_id)}?from=chat`} prefetch={false}>See details</Link>
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-auto px-1 text-[0.7rem] text-destructive hover:bg-destructive/10 hover:text-destructive"
                  onClick={() => onDismiss(book)}
                  disabled={dismissingId !== null}
                >
                  {dismissingId === book.google_books_id ? "Saving…" : "Not Interested"}
                </Button>
              </div>
            </article>
          </li>
        ))}
      </ul>
    </li>
  );
}

function ThinkingIndicator() {
  return (
    <li className="flex justify-start" role="status" aria-label="Shelfie is thinking">
      <div className="shelfie-surface rounded-2xl rounded-bl-sm px-4 py-3">
        <div className="space-y-2">
          <div className="shelfie-skeleton h-3 w-36 rounded" />
          <div className="shelfie-skeleton h-3 w-24 rounded" />
        </div>
      </div>
    </li>
  );
}

export default function AiChat() {
  const [enabled, setEnabled] = useState<boolean | null>(null);
  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [active, setActive] = useState<Conversation | null>(null);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [hasStartedConversation, setHasStartedConversation] = useState(false);
  const [error, setError] = useState("");
  const [dismissingId, setDismissingId] = useState<string | null>(null);
  const [conversationToDelete, setConversationToDelete] = useState<ConversationSummary | null>(null);
  const started = useRef(false);

  const loadConversation = useCallback(async (id: string) => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch(`/api/ai-chat/conversations/${encodeURIComponent(id)}`, { cache: "no-store" });
      const data = await response.json() as ApiError & { conversation?: Conversation };
      if (!response.ok || !data.conversation) throw new Error(data.error ?? "Could not load conversation");
      setActive(data.conversation);
      setHasStartedConversation(data.conversation.messages.length > 0);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not load conversation");
    } finally {
      setLoading(false);
    }
  }, []);

  const loadConversations = useCallback(async () => {
    const response = await fetch("/api/ai-chat/conversations", { cache: "no-store" });
    const data = await response.json() as ApiError & { conversations?: ConversationSummary[] };
    if (!response.ok) throw new Error(data.error ?? "Could not load conversations");
    const next = data.conversations ?? [];
    setConversations(next);
    if (next.length > 0) await loadConversation(next[0].id);
  }, [loadConversation]);

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    void (async () => {
      try {
        const response = await fetch("/api/ai-recommendations/settings", { cache: "no-store" });
        const data = await response.json() as ApiError & { enabled?: boolean };
        if (!response.ok) throw new Error(data.error ?? "Could not load AI settings");
        setEnabled(Boolean(data.enabled));
        if (data.enabled) await loadConversations();
      } catch (cause) {
        setError(cause instanceof Error ? cause.message : "Could not load AI settings");
      }
    })();
  }, [loadConversations]);

  async function sendMessage(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmed = message.trim();
    if (!trimmed || sending || active?.user_message_count === MESSAGE_LIMIT) return;

    setSending(true);
    setHasStartedConversation(true);
    setError("");
    try {
      const response = await fetch("/api/ai-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ conversation_id: active?.id, message: trimmed }),
      });
      const data = await response.json() as ApiError & {
        conversation_id?: string;
        title?: string;
        user_message?: ChatMessage;
        assistant_message?: ChatMessage;
        user_message_count?: number;
      };
      if (!response.ok || !data.conversation_id || !data.user_message || !data.assistant_message) {
        throw new Error(data.error ?? "Could not get an answer");
      }

      const nextSummary: ConversationSummary = {
        id: data.conversation_id,
        title: data.title ?? active?.title ?? trimmed.slice(0, 120),
        user_message_count: data.user_message_count ?? (active?.user_message_count ?? 0) + 1,
        created_at: active?.created_at ?? new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      setConversations((previous) => [nextSummary, ...previous.filter((item) => item.id !== nextSummary.id)]);
      setActive((previous) => ({
        ...(previous ?? nextSummary),
        ...nextSummary,
        messages: [...(previous?.messages ?? []), data.user_message!, data.assistant_message!],
      }));
      setMessage("");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not get an answer");
    } finally {
      setSending(false);
    }
  }

  async function deleteConversation() {
    if (!conversationToDelete) return;
    const id = conversationToDelete.id;
    const response = await fetch(`/api/ai-chat/conversations/${encodeURIComponent(id)}`, { method: "DELETE" });
    const data = await response.json() as ApiError;
    if (!response.ok) throw new Error(data.error ?? "Could not delete conversation");
    const remaining = conversations.filter((item) => item.id !== id);
    setConversations(remaining);
    setConversationToDelete(null);
    if (active?.id === id) {
      setActive(null);
      if (remaining[0]) await loadConversation(remaining[0].id);
    }
  }

  async function dismiss(book: Recommendation) {
    if (dismissingId) return;
    setDismissingId(book.google_books_id);
    setError("");
    try {
      const response = await fetch("/api/ai-recommendations/dismiss", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ google_books_id: book.google_books_id, title: book.title, authors: book.authors }),
      });
      const data = await response.json() as ApiError;
      if (!response.ok) throw new Error(data.error ?? "Could not save Not Interested");
      setActive((previous) => previous ? {
        ...previous,
        messages: previous.messages.map((item) => ({
          ...item,
          recommendations: item.recommendations.filter((itemBook) => itemBook.google_books_id !== book.google_books_id),
        })),
      } : previous);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not save Not Interested");
    } finally {
      setDismissingId(null);
    }
  }

  function startNewConversation() {
    setActive(null);
    setMessage("");
    setError("");
    setHasStartedConversation(false);
  }

  const remainingMessages = active ? Math.max(0, MESSAGE_LIMIT - active.user_message_count) : MESSAGE_LIMIT;

  return (
    <div className="space-y-8">
      <ShelfieHero title="Reading chat" description="Tell Shelfie what you are in the mood for and get a recommendation shaped by your reading life." />

      {enabled === false && (
        <section className="shelfie-surface flex flex-col items-center gap-3 p-10 text-center" aria-label="AI personalization disabled">
          <EyeOff className="size-8 text-primary" aria-hidden="true" />
          <h2 className="text-2xl font-semibold">AI personalization is off</h2>
          <p className="max-w-xl text-sm leading-6 text-muted-foreground">
            Go to Account to enable AI personalization. The same setting controls this chat and automatic recommendations; while it is off, your reading information is not sent to Gemini.
          </p>
          <Button asChild><Link href="/protected/account#ai-personalization">Go to Account</Link></Button>
        </section>
      )}

      {enabled === null && (
        <div className="shelfie-surface h-40 animate-pulse" aria-busy="true" />
      )}

      {enabled === true && (
        <section className="grid min-h-[36rem] gap-4 lg:grid-cols-[16rem_minmax(0,1fr)]" aria-label="AI reading chat">
          <aside className="shelfie-surface flex flex-col p-3">
            <Button type="button" variant="outline" className="mb-3 w-full justify-start" onClick={startNewConversation}>
              <Plus aria-hidden="true" /> New conversation
            </Button>
            <div className="min-h-0 flex-1 space-y-1 overflow-y-auto" aria-label="Conversations">
              {conversations.length === 0 && <p className="px-2 py-4 text-xs leading-5 text-muted-foreground">Your conversations will appear here.</p>}
              {conversations.map((conversation) => (
                <div key={conversation.id} className={`group flex items-start gap-1 rounded-lg px-2 py-2 transition ${active?.id === conversation.id ? "bg-primary/10" : "hover:bg-muted"}`}>
                  <button type="button" className="min-w-0 flex-1 text-left" onClick={() => void loadConversation(conversation.id)}>
                    <span className="block truncate text-sm font-medium">{conversation.title}</span>
                    <span className="mt-0.5 block text-[0.68rem] text-muted-foreground">{formatConversationDate(conversation.updated_at)} · {conversation.user_message_count}/{MESSAGE_LIMIT}</span>
                  </button>
                  <Button type="button" variant="ghost" size="icon" className="size-7 shrink-0 text-muted-foreground opacity-60 hover:text-destructive group-hover:opacity-100" onClick={() => setConversationToDelete(conversation)} aria-label={`Delete ${conversation.title}`}>
                    <Trash2 aria-hidden="true" />
                  </Button>
                </div>
              ))}
            </div>
          </aside>

          <section className="shelfie-surface flex min-h-[36rem] min-w-0 flex-col overflow-hidden">
            <header className="flex items-center justify-between gap-3 border-b border-border/80 px-4 py-3 sm:px-6">
              <h2 className="min-w-0 truncate text-base font-semibold">{active?.title ?? "New conversation"}</h2>
              <p className="shrink-0 text-xs text-muted-foreground">{remainingMessages} message{remainingMessages === 1 ? "" : "s"} left</p>
            </header>

            {error && <p role="alert" className="mx-4 mt-4 rounded-lg border border-destructive/25 bg-destructive/5 px-3 py-2 text-xs text-destructive sm:mx-6">{error}</p>}

            <div className="flex-1 overflow-y-auto px-4 py-5 sm:px-6">
              {loading && <div className="flex items-center justify-center py-20 text-sm text-muted-foreground"><Loader2 className="mr-2 size-4 animate-spin" /> Loading conversation…</div>}
              {!loading && !active && !hasStartedConversation && !sending && (
                <div className="flex h-full min-h-[26rem] flex-col items-center justify-center text-center">
                  <Sparkles className="size-9 text-primary" aria-hidden="true" />
                  <h2 className="mt-4 text-2xl font-semibold">What do you feel like reading?</h2>
                  <p className="mt-2 max-w-md text-sm leading-6 text-muted-foreground">Ask for a mood, genre, trope or emotional experience. Shelfie will use your reading signals while avoiding books you rejected.</p>
                  <div className="mt-5 flex flex-wrap justify-center gap-2">
                    {["A fantasy book that makes me cry", "Something like my favorite read, but lighter", "A short, strange mystery"].map((prompt) => (
                      <button key={prompt} type="button" className="rounded-full border border-border px-3 py-2 text-xs text-muted-foreground transition hover:border-primary/50 hover:bg-primary/5 hover:text-foreground" onClick={() => setMessage(prompt)}>{prompt}</button>
                    ))}
                  </div>
                </div>
              )}
              {!loading && active && active.messages.length === 0 && !sending && (
                <div className="flex h-full min-h-[26rem] items-center justify-center text-center text-sm text-muted-foreground">Start with a feeling, a genre, or a book you want to move away from.</div>
              )}
              {!loading && active && active.messages.length > 0 && (
                <ul className="space-y-4" aria-live="polite">
                  {active.messages.map((item) => (
                    <Fragment key={item.id}>
                      <MessageBubble message={item} />
                      <RecommendationMessage message={item} onDismiss={dismiss} dismissingId={dismissingId} />
                    </Fragment>
                  ))}
                  {sending && <ThinkingIndicator />}
                </ul>
              )}
              {!loading && sending && (!active || active.messages.length === 0) && (
                <ul className="space-y-4" aria-live="polite"><ThinkingIndicator /></ul>
              )}
            </div>

            <div className="border-t border-border/80 p-3 sm:p-4">
              {active?.user_message_count === MESSAGE_LIMIT && <p className="mb-3 text-center text-xs text-muted-foreground">This conversation reached its limit. Start a new conversation to continue.</p>}
              <form className="flex items-end gap-2" onSubmit={(event) => void sendMessage(event)}>
                <textarea
                  value={message}
                  onChange={(event) => setMessage(event.target.value)}
                  placeholder="e.g. I want a fantasy book that makes me cry…"
                  maxLength={1200}
                  rows={2}
                  disabled={sending || active?.user_message_count === MESSAGE_LIMIT}
                  aria-label="Message Shelfie"
                  className="min-h-12 flex-1 resize-none rounded-xl border border-input bg-background px-3 py-2.5 text-sm shadow-sm outline-none transition placeholder:text-muted-foreground focus:border-ring focus:ring-1 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-60"
                />
                <Button type="submit" size="icon" className="size-11 shrink-0 rounded-xl" disabled={sending || !message.trim() || active?.user_message_count === MESSAGE_LIMIT} aria-label="Send message">
                  {sending ? <Loader2 className="animate-spin" aria-hidden="true" /> : <Send aria-hidden="true" />}
                </Button>
              </form>
              <p className="mt-2 text-[0.68rem] text-muted-foreground">{message.length}/1200 · {remainingMessages} messages left in this conversation</p>
            </div>
          </section>
        </section>
      )}

      <ConfirmationDialog
        open={conversationToDelete !== null}
        title="Delete conversation?"
        description="This permanently deletes the conversation and its messages from Shelfie."
        confirmLabel="Delete conversation"
        pendingLabel="Deleting…"
        onCancel={() => setConversationToDelete(null)}
        onConfirm={deleteConversation}
      />
    </div>
  );
}
