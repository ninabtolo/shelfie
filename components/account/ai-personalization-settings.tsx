"use client";

import { Check, EyeOff, ShieldCheck, Sparkles, X } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";

const SHARED_WHEN_ON = [
  "Books in your library and wishlist (title, author, genre, description)",
  "Reading status, favorites and ratings",
  "The text of your reviews",
  "Books you marked as Not Interested",
  "Messages you write in the AI chat",
];

const NEVER_SHARED = [
  "Your email address or password",
  "Your username, bio or profile picture",
  "Who you follow or what others share with you",
];

export function AiPersonalizationSettings({ initialEnabled }: { initialEnabled: boolean }) {
  const [enabled, setEnabled] = useState(initialEnabled);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [confirmingEnable, setConfirmingEnable] = useState(false);

  async function changeEnabled(next: boolean) {
    setSaving(true);
    setError("");
    try {
      const response = await fetch("/api/ai-recommendations/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enabled: next }),
      });
      const data = await response.json() as { enabled?: boolean; error?: string };
      if (!response.ok) throw new Error(data.error ?? "Could not update setting");
      setEnabled(Boolean(data.enabled));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not update setting");
    } finally {
      setSaving(false);
    }
  }

  function handleToggle(next: boolean) {
    // Turning on requires explicit, informed consent. Turning off is immediate.
    if (next) setConfirmingEnable(true);
    else void changeEnabled(false);
  }

  return (
    <section id="ai-personalization" className="shelfie-surface space-y-5 p-5 sm:p-6" aria-labelledby="ai-personalization-title">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex gap-3">
          <span className="reading-stat-icon mt-0.5" aria-hidden="true"><Sparkles /></span>
          <div className="space-y-1">
            <h2 id="ai-personalization-title" className="text-base font-semibold">AI personalization</h2>
            <p className="max-w-2xl text-sm leading-6 text-muted-foreground">
              Optional and off by default. When it&apos;s on, Shelfie sends your reading data to Google&apos;s Gemini API to generate
              recommendations and power the AI reading chat. You can turn it off at any time.
            </p>
          </div>
        </div>
        <label className="flex shrink-0 cursor-pointer items-center gap-3 rounded-lg border border-border/70 px-3 py-2 text-sm font-medium transition hover:border-primary/50 hover:bg-primary/5">
          <input
            type="checkbox"
            className="peer sr-only"
            checked={enabled}
            disabled={saving}
            onChange={(event) => handleToggle(event.target.checked)}
            aria-label="Enable AI personalization"
          />
          <span className="shelfie-recommendation-switch relative h-6 w-11 rounded-full bg-muted transition-colors peer-checked:bg-primary peer-focus-visible:ring-2 peer-focus-visible:ring-ring peer-focus-visible:ring-offset-2" data-enabled={enabled}>
            <span className="absolute left-1 top-1 size-4 rounded-full bg-white shadow-sm transition-transform" />
          </span>
          <span>{enabled ? "On" : "Off"}</span>
        </label>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <DataList title="Shared with Gemini when on" items={SHARED_WHEN_ON} kind="shared" />
        <DataList title="Never shared" items={NEVER_SHARED} kind="never" />
      </div>

      <div className="flex items-start gap-2 rounded-lg bg-muted/70 px-3 py-2.5 text-xs leading-5 text-muted-foreground">
        <EyeOff className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden="true" />
        <p>
          {enabled
            ? "AI personalization is on. Your reading data is sent to Gemini only when you open recommendations or chat with the assistant."
            : "AI personalization is off. Nothing is sent to Gemini."}{" "}
          Google may retain this data and use it to improve its services, so avoid putting sensitive personal information in reviews or chat.
          Turning this off stops future sharing but can&apos;t recall data already sent; saved conversations stay until you delete them.{" "}
          <Link href="/legal/privacy#ai-personalization" className="font-medium text-primary underline underline-offset-2">
            Learn more
          </Link>
        </p>
      </div>
      {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
      {saving && <p className="text-xs text-muted-foreground">Saving setting…</p>}

      <ConfirmationDialog
        open={confirmingEnable}
        title="Turn on AI personalization?"
        icon={<ShieldCheck />}
        description={
          <div className="space-y-3">
            <p>
              Shelfie will send your library, wishlist, ratings, favorites, review text and AI chat messages to Google&apos;s Gemini API to
              personalize recommendations. Your email, password and profile details are never sent.
            </p>
            <p>
              Google processes this data under its own terms and may retain it to improve its services. You can turn this off at any time
              in Account. See the{" "}
              <Link href="/legal/privacy#ai-personalization" target="_blank" rel="noopener noreferrer" className="font-medium text-primary underline underline-offset-2">
                Privacy Policy
              </Link>{" "}
              for details.
            </p>
          </div>
        }
        confirmLabel="I agree, turn it on"
        pendingLabel="Turning on…"
        onCancel={() => setConfirmingEnable(false)}
        onConfirm={() => changeEnabled(true)}
      />
    </section>
  );
}

function DataList({ title, items, kind }: { title: string; items: string[]; kind: "shared" | "never" }) {
  const Icon = kind === "shared" ? Check : X;
  return (
    <div className="rounded-lg border border-border/70 p-3">
      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">{title}</p>
      <ul className="mt-2 space-y-1.5 text-sm leading-5">
        {items.map((item) => (
          <li key={item} className="flex gap-2">
            <Icon className={`mt-0.5 size-4 shrink-0 ${kind === "shared" ? "text-primary" : "text-muted-foreground"}`} aria-hidden="true" />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
