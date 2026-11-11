import Link from "next/link";
import { ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";

export function AiPersonalizationNotice({ enabled }: { enabled: boolean }) {
  return (
    <section className="shelfie-surface shelfie-ai-message flex flex-col gap-5 p-5 sm:flex-row sm:items-center sm:justify-between" aria-labelledby="reading-data-title">
      <div className="flex min-w-0 gap-3">
        <span className="reading-stat-icon mt-0.5 shrink-0" aria-hidden="true"><ShieldCheck /></span>
        <div className="min-w-0 space-y-1">
          <h3 id="reading-data-title" className="text-base font-semibold">Your reading data stays opt-in</h3>
          <p className="max-w-3xl text-sm leading-6 text-muted-foreground">
            {enabled
              ? "AI personalization is on: your library, wishlist, ratings, favorites, review text and chat messages are sent to Google's Gemini API to personalize suggestions. Your email and profile details are never sent."
              : "Shelfie only sends your library, wishlist, ratings, favorites, review text and chat messages to Google's Gemini API when you turn on AI personalization in Account."}{" "}
            One setting controls both recommendations and the AI chat. AI suggestions can be inaccurate.{" "}
            <Link href="/legal/privacy#ai-personalization" className="font-medium text-primary underline underline-offset-2">Privacy details</Link>
          </p>
        </div>
      </div>
      <Button type="button" variant="outline" className="shrink-0 self-start sm:self-auto" asChild>
        <Link href="/protected/account#ai-personalization">{enabled ? "Manage in Account" : "Enable in Account"}</Link>
      </Button>
    </section>
  );
}
