import Link from "next/link";
import { MINIMUM_AGE } from "@/lib/legal";

const linkClass = "font-semibold text-primary underline underline-offset-4 transition-colors hover:text-primary/80";

/**
 * Required consent checkbox used at sign-up and when re-accepting updated terms.
 * Legal links open in a new tab so the form isn't lost.
 */
export function LegalConsentCheckbox({
  checked,
  onChange,
  disabled,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <div className="flex items-start gap-3 rounded-lg border border-border/70 bg-background/40 p-3">
      <input
        id="legal-consent"
        type="checkbox"
        required
        checked={checked}
        disabled={disabled}
        onChange={(event) => onChange(event.target.checked)}
        className="mt-0.5 size-4 shrink-0 cursor-pointer accent-[hsl(var(--primary))]"
      />
      <label htmlFor="legal-consent" className="cursor-pointer text-sm leading-6 text-muted-foreground">
        I confirm that I am <strong className="font-semibold text-foreground">{MINIMUM_AGE} years of age or older</strong>, and I have
        read and agree to the{" "}
        <Link href="/legal/terms" target="_blank" rel="noopener noreferrer" className={linkClass}>Terms of Use</Link>{" "}
        and the{" "}
        <Link href="/legal/privacy" target="_blank" rel="noopener noreferrer" className={linkClass}>Privacy Policy</Link>.
      </label>
    </div>
  );
}
