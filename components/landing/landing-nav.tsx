"use client";

import { BookOpen } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { ThemeSwitcher } from "@/components/theme-switcher";

export function LandingNav() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header className="landing-nav" data-scrolled={scrolled}>
      <nav aria-label="Main" className="mx-auto flex min-h-[4.25rem] max-w-6xl items-center justify-between gap-2 px-4 sm:px-8">
        <Link href="/" className="shelfie-brand shrink-0" aria-label="Shelfie home">
          <BookOpen aria-hidden="true" />
          <span>Shelfie</span>
        </Link>
        <div className="flex items-center gap-1 sm:gap-2">
          <ThemeSwitcher />
          <Link href="/auth/login" className="landing-nav-login">Log in</Link>
          <Link href="/auth/sign-up" className="landing-nav-signup">Sign up</Link>
        </div>
      </nav>
    </header>
  );
}
