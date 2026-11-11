import { BookOpen } from "lucide-react";
import Link from "next/link";
import { ThemeSwitcher } from "@/components/theme-switcher";
import { LegalLinks } from "@/components/legal/legal-links";

export default function LegalLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="shelfie-app flex min-h-svh flex-col">
      <header className="shelfie-header">
        <nav className="mx-auto flex min-h-20 w-full max-w-4xl items-center justify-between gap-5 px-5 py-3 sm:px-8">
          <Link href="/" className="shelfie-brand shrink-0" aria-label="Shelfie home">
            <BookOpen aria-hidden="true" />
            <span>Shelfie</span>
          </Link>
          <ThemeSwitcher />
        </nav>
      </header>
      <main className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-8 px-5 py-8 sm:px-8 lg:py-10">
        {children}
      </main>
      <footer className="px-5 pb-8">
        <LegalLinks />
      </footer>
    </div>
  );
}
