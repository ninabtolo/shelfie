import { BookOpen } from "lucide-react";
import { ProtectedNav } from "@/components/protected-nav";
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

  const { data: unreadData, error: unreadError } = await supabase.rpc("get_unread_notification_count");

  if (unreadError) {
    throw new Error("Could not load notification count.");
  }

  return (
    <div className="shelfie-app min-h-svh">
      <header className="shelfie-header">
        <nav className="shelfie-nav mx-auto flex min-h-20 max-w-7xl items-center gap-5 px-5 py-3 sm:px-8">
          <Link href="/protected" className="shelfie-brand shrink-0" aria-label="Shelfie dashboard">
            <BookOpen aria-hidden="true" />
            <span>Shelfie</span>
          </Link>
          <ProtectedNav unreadCount={typeof unreadData === "number" ? unreadData : 0} />
        </nav>
      </header>
      <main className="shelfie-main mx-auto flex w-full max-w-7xl flex-col px-5 py-8 sm:px-8 lg:py-10">
        {children}
      </main>
    </div>
  );
}
