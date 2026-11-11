import Link from "next/link";
import { cn } from "@/lib/utils";
import { CONTACT_EMAIL } from "@/lib/legal";

const linkClass = "underline-offset-4 transition-colors hover:text-foreground hover:underline";

/** Small footer row with links to the legal pages. */
export function LegalLinks({ className }: { className?: string }) {
  return (
    <nav aria-label="Legal" className={cn("flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-xs text-muted-foreground", className)}>
      <Link href="/legal/privacy" className={linkClass}>Privacy Policy</Link>
      <span aria-hidden="true">·</span>
      <Link href="/legal/terms" className={linkClass}>Terms of Use</Link>
      <span aria-hidden="true">·</span>
      <Link href="/legal/privacy#cookies" className={linkClass}>Cookies</Link>
    </nav>
  );
}

/** Inline contact reference used inside the legal pages. */
export function LegalContact() {
  if (CONTACT_EMAIL) {
    return <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>;
  }
  return <>the contact information listed on the creator&apos;s portfolio</>;
}
