"use client";

import Link from "next/link";
import { Bell, CheckCheck, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { BookCover } from "@/components/books/book-cover";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";

export type Notification = {
  id: string;
  type: "follow" | "book_share";
  actorUsername: string;
  bookId: string | null;
  bookTitle: string | null;
  bookCoverUrl: string | null;
  shareMessage: string | null;
  createdAt: string;
  readAt: string | null;
};

export function NotificationsList({
  initialNotifications,
}: {
  initialNotifications: Notification[];
}) {
  const router = useRouter();
  const [notifications, setNotifications] = useState(initialNotifications);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  async function markRead(id: string) {
    setPendingId(id);
    setActionError(null);
    const { error } = await createClient().rpc("mark_notification_read", {
      p_notification_id: id,
    });

    if (error) {
      setActionError("Could not mark this notification as read. Please try again.");
    } else {
      setNotifications((current) =>
        current.map((notification) =>
          notification.id === id
            ? { ...notification, readAt: notification.readAt ?? new Date().toISOString() }
            : notification,
        ),
      );
      router.refresh();
    }
    setPendingId(null);
  }

  async function deleteNotification(id: string) {
    setPendingId(id);
    setActionError(null);
    const { error } = await createClient().rpc("delete_notification", {
      p_notification_id: id,
    });

    if (error) {
      setActionError("Could not delete this notification. Please try again.");
    } else {
      setNotifications((current) => current.filter((notification) => notification.id !== id));
      router.refresh();
    }
    setPendingId(null);
  }

  async function markAllRead() {
    setPendingId("all");
    setActionError(null);
    const { error } = await createClient().rpc("mark_all_notifications_read");

    if (error) {
      setActionError("Could not mark notifications as read. Please try again.");
    } else {
      setNotifications((current) =>
        current.map((notification) => ({
          ...notification,
          readAt: notification.readAt ?? new Date().toISOString(),
        })),
      );
      router.refresh();
    }
    setPendingId(null);
  }

  if (!notifications.length) {
    return (
      <div className="rounded-xl border border-dashed p-10 text-center">
        <Bell className="mx-auto mb-3 size-8 text-muted-foreground" aria-hidden="true" />
        <p className="font-medium">You&apos;re all caught up.</p>
        <p className="mt-1 text-sm text-muted-foreground">New follows and shared books will appear here.</p>
      </div>
    );
  }

  const hasUnread = notifications.some((notification) => !notification.readAt);

  return (
    <section className="space-y-4" aria-label="Your notifications">
      {actionError && (
        <p role="alert" className="rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
          {actionError}
        </p>
      )}
      {hasUnread && (
        <div className="flex justify-end">
          <Button type="button" variant="outline" size="sm" onClick={markAllRead} disabled={pendingId !== null}>
            <CheckCheck aria-hidden="true" />
            Mark all as read
          </Button>
        </div>
      )}
      <ul className="space-y-3">
        {notifications.map((notification) => (
          <li
            key={notification.id}
            className={`rounded-xl border bg-card p-4 ${notification.readAt ? "" : "border-primary/50 bg-primary/5"}`}
          >
            <div className="flex items-start gap-3">
              <Bell className="mt-0.5 size-5 shrink-0 text-primary" aria-hidden="true" />
              {notification.type === "book_share" && (
                <div className="w-16 shrink-0">
                  <BookCover
                    src={notification.bookCoverUrl}
                    title={notification.bookTitle ?? "Shared book"}
                    className="w-full"
                  />
                </div>
              )}
              <div className="min-w-0 flex-1 space-y-2">
                <p>
                  {notification.type === "follow" ? (
                    <>
                      <Link href={`/protected/profiles/${encodeURIComponent(notification.actorUsername)}`} className="font-semibold hover:underline">
                        @{notification.actorUsername}
                      </Link>{" "}
                      started following you.
                    </>
                  ) : (
                    <>
                      <span className="font-semibold">@{notification.actorUsername}</span>{" "}
                      shared <span className="font-semibold">{notification.bookTitle ?? "a book"}</span> with you.
                    </>
                  )}
                </p>
                {notification.shareMessage && (
                  <p className="rounded-md bg-muted p-3 text-sm">{notification.shareMessage}</p>
                )}
                <p className="text-xs text-muted-foreground">
                  {new Intl.DateTimeFormat("en", { dateStyle: "medium", timeStyle: "short" }).format(
                    new Date(notification.createdAt),
                  )}
                </p>
                <div className="flex flex-wrap gap-2">
                  {notification.type === "book_share" && notification.bookId && (
                    <Button asChild variant="link" size="sm" className="h-auto px-0">
                      <Link href={`/protected/books/${encodeURIComponent(notification.bookId)}?from=notifications`}>
                        View book
                      </Link>
                    </Button>
                  )}
                  {!notification.readAt && (
                    <Button type="button" variant="outline" size="sm" onClick={() => markRead(notification.id)} disabled={pendingId !== null}>
                      Mark as read
                    </Button>
                  )}
                </div>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                aria-label="Delete notification"
                onClick={() => deleteNotification(notification.id)}
                disabled={pendingId !== null}
              >
                <Trash2 aria-hidden="true" />
              </Button>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
