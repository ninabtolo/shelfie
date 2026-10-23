import Link from "next/link";
import { ArrowLeft, FileQuestion } from "lucide-react";
import { AuthShell } from "@/components/auth-shell";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <AuthShell>
      <section className="login-card rounded-xl border border-border/70 bg-card/85 p-8 text-center shadow-[0_24px_80px_hsl(270_30%_30%/0.12)] backdrop-blur-xl sm:p-10">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/12 text-primary shadow-[0_8px_30px_hsl(270_20%_30%/0.12)]">
          <FileQuestion className="h-8 w-8" strokeWidth={1.6} aria-hidden="true" />
        </div>
        <p className="mt-6 text-sm font-semibold uppercase tracking-[0.28em] text-primary">404</p>
        <h2 className="mt-3 font-display text-4xl font-semibold tracking-tight text-foreground sm:text-5xl">
          Page not found
        </h2>
        <p className="mx-auto mt-4 max-w-sm text-sm leading-6 text-muted-foreground sm:text-base">
          This page seems to have wandered off the shelf. Let&apos;s get you back to your reading space.
        </p>
        <Button className="mt-8" size="lg" asChild>
          <Link href="/">
            <ArrowLeft aria-hidden="true" />
            Back to Shelfie
          </Link>
        </Button>
      </section>
    </AuthShell>
  );
}
