"use client";

import Link from "next/link";
import { Fragment, useCallback, useEffect, useRef, useState } from "react";
import { ArrowUp, EyeOff, Loader2, PanelLeftClose, PanelLeftOpen, SquarePen, Sparkles, Trash2 } from "lucide-react";
import { BookCover } from "@/components/books/book-cover";
import { AiPersonalizationNotice } from "@/components/ai-personalization-notice";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";
import { Button } from "@/components/ui/button";
import { ShelfieHero } from "@/components/shelfie-hero";

const MESSAGE_LIMIT = 20;
const SIDEBAR_STORAGE_KEY = "shelfie-chat-sidebar";

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
      {/* Assistant replies read as plain text, like an AI chat; only the user's messages are bubbles. */}
      <article className={isAssistant ? "max-w-3xl py-1" : "max-w-3xl rounded-2xl rounded-br-sm bg-primary px-4 py-3 text-primary-foreground"}>
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
      <div className="py-1">
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
  // The user's message is shown right away, before the server confirms it and the reply arrives.
  const [pendingMessage, setPendingMessage] = useState<ChatMessage | null>(null);
  const [hasStartedConversation, setHasStartedConversation] = useState(false);
  const [error, setError] = useState("");
  const [dismissingId, setDismissingId] = useState<string | null>(null);
  const [conversationToDelete, setConversationToDelete] = useState<ConversationSummary | null>(null);
  const started = useRef(false);
  const threadRef = useRef<HTMLDivElement>(null);
  const composerRef = useRef<HTMLTextAreaElement>(null);
  // Desktop only: the conversation list can be collapsed. Below lg it stacks above the chat.
  const [sidebarOpen, setSidebarOpen] = useState(true);

  useEffect(() => {
    try {
      if (localStorage.getItem(SIDEBAR_STORAGE_KEY) === "closed") setSidebarOpen(false);
    } catch {
      // Storage unavailable: keep the default.
    }
  }, []);

  function toggleSidebar() {
    const next = !sidebarOpen;
    setSidebarOpen(next);
    try {
      localStorage.setItem(SIDEBAR_STORAGE_KEY, next ? "open" : "closed");
    } catch {
      // Storage unavailable: the choice just won't be remembered.
    }
  }

  // The thread scrolls inside the chat panel: keep the newest message in view.
  const messageCount = active?.messages.length ?? 0;
  useEffect(() => {
    const thread = threadRef.current;
    if (thread) thread.scrollTop = thread.scrollHeight;
  }, [messageCount, sending, loading]);

  // Grow the composer with its content (capped by its max-height in CSS).
  useEffect(() => {
    const composer = composerRef.current;
    if (!composer) return;
    composer.style.height = "auto";
    composer.style.height = `${composer.scrollHeight}px`;
  }, [message]);

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
    setPendingMessage({
      id: `pending-${Date.now()}`,
      role: "user",
      content: trimmed,
      recommendations: [],
      created_at: new Date().toISOString(),
    });
    setMessage("");
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
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not get an answer");
      // Give the text back so the user can retry without retyping it.
      setMessage(trimmed);
      if (!active || active.messages.length === 0) setHasStartedConversation(false);
    } finally {
      setPendingMessage(null);
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

  function handleComposerKeyDown(event: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key !== "Enter" || event.shiftKey || event.nativeEvent.isComposing) return;
    // On touch keyboards Enter keeps inserting a new line; the send button submits.
    if (!window.matchMedia("(pointer: fine)").matches) return;
    event.preventDefault();
    event.currentTarget.form?.requestSubmit();
  }

  function startNewConversation() {
    setActive(null);
    setMessage("");
    setError("");
    setHasStartedConversation(false);
  }

  const remainingMessages = active ? Math.max(0, MESSAGE_LIMIT - active.user_message_count) : MESSAGE_LIMIT;
  const limitReached = active?.user_message_count === MESSAGE_LIMIT;

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

      {enabled === true && <AiPersonalizationNotice enabled={enabled} />}

      {enabled === true && (
        <section className={`shelfie-chat-shell grid min-h-[36rem] grid-cols-1 gap-4 lg:h-[min(46rem,calc(100svh-7rem))] lg:gap-0 ${sidebarOpen ? "lg:grid-cols-[17rem_minmax(0,1fr)]" : "lg:grid-cols-1"}`} aria-label="AI reading chat">
          <aside id="chat-conversations" className={`shelfie-surface shelfie-chat-sidebar flex min-h-0 flex-col p-3 ${sidebarOpen ? "" : "lg:hidden"}`} aria-label="Conversations">
            <Button type="button" variant="outline" className="w-full justify-start gap-2.5 rounded-xl" onClick={startNewConversation}>
              <SquarePen aria-hidden="true" /> New conversation
            </Button>
            <p className="mb-1.5 mt-5 flex items-center justify-between px-3 text-[0.66rem] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
              <span>Recent</span>
              {conversations.length > 0 && <span className="tabular-nums">{conversations.length}</span>}
            </p>
            <div className="min-h-0 flex-1 space-y-0.5 overflow-y-auto">
              {conversations.length === 0 && <p className="px-3 py-3 text-xs leading-5 text-muted-foreground">Your conversations will appear here.</p>}
              {conversations.map((conversation) => {
                const isActive = active?.id === conversation.id;
                return (
                  <div key={conversation.id} className={`group relative flex items-center rounded-lg transition-colors ${isActive ? "bg-primary/10" : "hover:bg-muted/70"}`}>
                    {isActive && <span className="absolute inset-y-2.5 left-0 w-[3px] rounded-full bg-primary" aria-hidden="true" />}
                    <button type="button" className="flex min-w-0 flex-1 rounded-lg py-2.5 pl-3 pr-1 text-left" aria-current={isActive ? "true" : undefined} onClick={() => void loadConversation(conversation.id)}>
                      <span className="min-w-0">
                        <span className={`block truncate text-sm ${isActive ? "font-semibold" : "font-medium"}`}>{conversation.title}</span>
                        <span className="mt-0.5 block text-[0.7rem] text-muted-foreground">{formatConversationDate(conversation.updated_at)} · {conversation.user_message_count}/{MESSAGE_LIMIT} messages</span>
                      </span>
                    </button>
                    <Button type="button" variant="ghost" size="icon" className="mr-1 size-7 shrink-0 text-muted-foreground opacity-70 hover:text-destructive lg:opacity-0 lg:group-focus-within:opacity-100 lg:group-hover:opacity-100" onClick={() => setConversationToDelete(conversation)} aria-label={`Delete ${conversation.title}`}>
                      <Trash2 aria-hidden="true" />
                    </Button>
                  </div>
                );
              })}
            </div>
          </aside>

          <section className="shelfie-surface flex min-h-[36rem] min-w-0 flex-col overflow-hidden lg:min-h-0">
            <header className="flex items-center gap-3 border-b px-4 py-3.5 sm:px-6">
              <div className="-ml-2 hidden shrink-0 items-center lg:flex">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="size-8 text-muted-foreground hover:text-foreground"
                  onClick={toggleSidebar}
                  aria-controls="chat-conversations"
                  aria-expanded={sidebarOpen}
                  aria-label={sidebarOpen ? "Hide conversations" : "Show conversations"}
                  title={sidebarOpen ? "Hide conversations" : "Show conversations"}
                >
                  {sidebarOpen ? <PanelLeftClose aria-hidden="true" /> : <PanelLeftOpen aria-hidden="true" />}
                </Button>
                {!sidebarOpen && (
                  <Button type="button" variant="ghost" size="icon" className="size-8 text-muted-foreground hover:text-foreground" onClick={startNewConversation} aria-label="New conversation" title="New conversation">
                    <SquarePen aria-hidden="true" />
                  </Button>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <h2 className="shelfie-chat-title truncate">{active?.title ?? "New conversation"}</h2>
                <p className="truncate text-xs text-muted-foreground">Shelfie AI · your reading assistant</p>
              </div>
              <div className="shrink-0 text-right" aria-label={`${remainingMessages} of ${MESSAGE_LIMIT} messages left`}>
                <p className="text-xs text-muted-foreground" aria-hidden="true">
                  <span className="font-semibold tabular-nums text-foreground">{remainingMessages}</span> of {MESSAGE_LIMIT} left
                </p>
                <span className="mt-1.5 block h-1 w-20 overflow-hidden rounded-full bg-muted sm:w-24" aria-hidden="true">
                  <span className="block h-full rounded-full bg-primary transition-[width] duration-500" style={{ width: `${(remainingMessages / MESSAGE_LIMIT) * 100}%` }} />
                </span>
              </div>
            </header>

            {error && <p role="alert" className="mx-4 mt-4 rounded-lg border border-destructive/25 bg-destructive/5 px-3 py-2 text-xs text-destructive sm:mx-6">{error}</p>}

            {/* Below lg the thread is height-capped; on desktop the panel has a fixed height. Either way it scrolls. */}
            <div ref={threadRef} className="shelfie-scroll-hidden max-h-[65svh] min-h-0 flex-1 overflow-y-auto px-4 py-5 sm:px-6 lg:max-h-none">
              {loading && <div className="flex items-center justify-center py-20 text-sm text-muted-foreground"><Loader2 className="mr-2 size-4 animate-spin" /> Loading conversation…</div>}
              {!loading && !active && !hasStartedConversation && !sending && (
                <div className="flex h-full min-h-[26rem] flex-col items-center justify-center text-center">
                  <Sparkles className="size-9 text-primary" aria-hidden="true" />
                  <h2 className="mt-4 text-2xl font-semibold">What do you feel like reading?</h2>
                  <p className="mt-2 max-w-md text-sm leading-6 text-muted-foreground">Ask for a mood, genre, trope or emotional experience. Shelfie will use your reading signals while avoiding books you rejected.</p>
                  <div className="mt-5 flex flex-wrap justify-center gap-2">
                    {["A fantasy book that makes me cry", "Something like my favorite read, but lighter", "A short, strange mystery"].map((prompt) => (
                      <button key={prompt} type="button" className="rounded-lg border border-border px-3 py-2 text-xs text-muted-foreground transition hover:border-primary/50 hover:bg-primary/5 hover:text-foreground" onClick={() => setMessage(prompt)}>{prompt}</button>
                    ))}
                  </div>
                </div>
              )}
              {!loading && active && active.messages.length === 0 && !sending && (
                <div className="flex h-full min-h-[26rem] items-center justify-center text-center text-sm text-muted-foreground">Start with a feeling, a genre, or a book you want to move away from.</div>
              )}
              {!loading && ((active?.messages.length ?? 0) > 0 || sending) && (
                <ul className="mx-auto max-w-4xl space-y-4" aria-live="polite">
                  {active?.messages.map((item) => (
                    <Fragment key={item.id}>
                      <MessageBubble message={item} />
                      <RecommendationMessage message={item} onDismiss={dismiss} dismissingId={dismissingId} />
                    </Fragment>
                  ))}
                  {pendingMessage && <MessageBubble message={pendingMessage} />}
                  {sending && <ThinkingIndicator />}
                </ul>
              )}
            </div>

            {/* Same centred column as the thread, so a wide panel never strands messages at the edges. */}
            <div className="px-3 pb-3 pt-1 sm:px-6 sm:pb-4">
              <div className="mx-auto max-w-4xl">
              {limitReached && <p className="mb-3 text-center text-xs text-muted-foreground">This conversation reached its limit. Start a new conversation to continue.</p>}
              <form
                className="shelfie-composer flex items-end gap-2 rounded-2xl border bg-background p-2 pl-4 shadow-sm transition focus-within:border-ring focus-within:ring-1 focus-within:ring-ring"
                onSubmit={(event) => void sendMessage(event)}
              >
                <textarea
                  ref={composerRef}
                  value={message}
                  onChange={(event) => setMessage(event.target.value)}
                  onKeyDown={handleComposerKeyDown}
                  placeholder="Ask for a mood, a genre, a feeling…"
                  maxLength={1200}
                  rows={1}
                  disabled={sending || limitReached}
                  aria-label="Message Shelfie"
                  className="max-h-40 min-h-9 flex-1 resize-none self-center bg-transparent py-2 text-sm leading-5 outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-60"
                />
                <Button type="submit" size="icon" className="size-9 shrink-0 rounded-xl" disabled={sending || !message.trim() || limitReached} aria-label="Send message">
                  {sending ? <Loader2 className="animate-spin" aria-hidden="true" /> : <ArrowUp aria-hidden="true" />}
                </Button>
              </form>
              <p className="mt-2 flex justify-between gap-3 px-1 text-[0.68rem] text-muted-foreground">
                <span className="hidden lg:inline"><kbd className="font-sans font-semibold">Enter</kbd> to send · <kbd className="font-sans font-semibold">Shift + Enter</kbd> for a new line</span>
                <span className="ml-auto tabular-nums">{message.length}/1200</span>
              </p>
              </div>
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
