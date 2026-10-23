"use client";

import { EyeOff, Sparkles } from "lucide-react";
import { useState } from "react";

export function AiPersonalizationSettings({ initialEnabled }: { initialEnabled: boolean }) {
  const [enabled, setEnabled] = useState(initialEnabled);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

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

  return (
    <section id="ai-personalization" className="shelfie-surface space-y-4 p-5 sm:p-6" aria-labelledby="ai-personalization-title">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex gap-3">
          <span className="reading-stat-icon mt-0.5" aria-hidden="true"><Sparkles /></span>
          <div className="space-y-1">
            <h2 id="ai-personalization-title" className="text-base font-semibold">AI personalization</h2>
            <p className="max-w-2xl text-sm leading-6 text-muted-foreground">
              When enabled, Shelfie can send your library, wishlist, ratings, favorites and review text to Gemini for automatic recommendations and the AI reading chat. It is off by default and you can turn it off at any time.
            </p>
          </div>
        </div>
        <label className="flex shrink-0 cursor-pointer items-center gap-3 rounded-lg border border-border/70 px-3 py-2 text-sm font-medium transition hover:border-primary/50 hover:bg-primary/5">
          <input
            type="checkbox"
            className="peer sr-only"
            checked={enabled}
            disabled={saving}
            onChange={(event) => void changeEnabled(event.target.checked)}
            aria-label="Enable AI personalization"
          />
          <span className="shelfie-recommendation-switch relative h-6 w-11 rounded-full bg-muted transition-colors peer-checked:bg-primary peer-focus-visible:ring-2 peer-focus-visible:ring-ring peer-focus-visible:ring-offset-2" data-enabled={enabled}>
            <span className="absolute left-1 top-1 size-4 rounded-full bg-white shadow-sm transition-transform" />
          </span>
          <span>{enabled ? "On" : "Off"}</span>
        </label>
      </div>
      <div className="flex items-start gap-2 rounded-lg bg-muted/70 px-3 py-2.5 text-xs leading-5 text-muted-foreground">
        <EyeOff className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden="true" />
        <p>{enabled ? "AI features can use your reading signals when you ask for recommendations." : "AI features are off. Your reading information is not sent to Gemini."}</p>
      </div>
      {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
      {saving && <p className="text-xs text-muted-foreground">Saving setting…</p>}
    </section>
  );
}
