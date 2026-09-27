import { LogoutButton } from "@/components/logout-button";
import { ThemeSwitcher } from "@/components/theme-switcher";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { redirect } from "next/navigation";
import { connection } from "next/server";

export const instant = false

export default async function ProtectedLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  await connection();
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
            <Link href="/protected/account" className="hover:underline">
              Account
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
