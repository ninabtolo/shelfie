import { NotificationsList, type Notification } from "@/components/notifications/notifications-list";
import { createClient } from "@/lib/supabase/server";

type NotificationRow = {
  notification_id: string;
  notification_type: "follow" | "book_share";
  actor_username: string | null;
  actor_avatar_url: string | null;
  google_books_id: string | null;
  book_title: string | null;
  book_cover_url: string | null;
  share_message: string | null;
  created_at: string;
  read_at: string | null;
};

export default async function NotificationsPage() {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("get_my_notifications");

  if (error) {
    throw new Error("Could not load your notifications.");
  }

  const notifications = ((data ?? []) as NotificationRow[]).map(
    (notification): Notification => ({
      id: notification.notification_id,
      type: notification.notification_type,
      actorUsername: notification.actor_username ?? "Someone",
      bookId: notification.google_books_id,
      bookTitle: notification.book_title,
      bookCoverUrl: notification.book_cover_url,
      shareMessage: notification.share_message,
      createdAt: notification.created_at,
      readAt: notification.read_at,
    }),
  );

  return (
    <div className="space-y-8 py-8">
      <section className="space-y-2">
        <h1 className="text-3xl font-bold">Notifications</h1>
        <p className="text-muted-foreground">Keep up with your new followers and shared books.</p>
      </section>
      <NotificationsList initialNotifications={notifications} />
    </div>
  );
}
