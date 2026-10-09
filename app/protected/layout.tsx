import { LogoutButton } from "@/components/logout-button";
import { ThemeSwitcher } from "@/components/theme-switcher";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { redirect } from "next/navigation";

export default async function ProtectedLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();

  if (!data?.claims) {
    redirect("/auth/login");
  }

  return (
    <div className="min-h-svh">
      <header className="border-b">
        <nav className="mx-auto flex h-16 max-w-5xl items-center justify-between px-5">
          <Link href="/protected" className="font-semibold">
            Shelfie
          </Link>
          <div className="flex items-center gap-5 text-sm">
            <Link href="/protected" className="hover:underline">
              Dashboard
            </Link>
            <Link href="/protected/library" className="hover:underline">
              My Library
            </Link>
            <Link href="/protected/wishlist" className="hover:underline">
              Wishlist
            </Link>
            <Link href="/protected/shared-books" className="hover:underline">
              Shared books
            </Link>
            <NotificationsLink />
            <Link href="/protected/account" className="hover:underline">
              Account
            </Link>
            <Link href="/protected/profiles" className="hover:underline">
              Profiles
            </Link>
            <ThemeSwitcher />
            <LogoutButton />
          </div>
        </nav>
      </header>
      <main className="mx-auto flex w-full max-w-5xl flex-col gap-8 p-5">
        {children}
      </main>
    </div>
  );
}

async function NotificationsLink() {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("get_unread_notification_count");

  if (error) {
    throw new Error("Could not load notification count.");
  }

  const unreadCount = typeof data === "number" ? data : 0;

  return (
    <Link href="/protected/notifications" className="relative hover:underline">
      Notifications
      {unreadCount > 0 && (
        <span
          aria-label={`${unreadCount} unread notifications`}
          className="ml-1 inline-flex min-w-5 items-center justify-center rounded-full bg-primary px-1.5 py-0.5 text-[10px] font-bold leading-none text-primary-foreground"
        >
          {unreadCount > 99 ? "99+" : unreadCount}
        </span>
      )}
    </Link>
  );
}
