"use client";

import { Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useId, useState } from "react";
import { Button } from "@/components/ui/button";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";
import { Input } from "@/components/ui/input";
import { createClient } from "@/lib/supabase/client";

export function DeleteAccountSection({ username }: { username: string }) {
  const router = useRouter();
  const inputId = useId();
  const [open, setOpen] = useState(false);
  const [confirmation, setConfirmation] = useState("");
  const [error, setError] = useState("");

  const matches = confirmation.trim().toLowerCase() === username.toLowerCase();

  function close() {
    setOpen(false);
    setConfirmation("");
  }

  async function deleteAccount() {
    setError("");
    try {
      const response = await fetch("/api/account", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ confirmation }),
      });
      const data = await response.json().catch(() => ({})) as { error?: string };
      if (!response.ok) throw new Error(data.error ?? "Could not delete your account.");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not delete your account.");
      return;
    }
    // Make sure no session survives in the browser, then leave the app.
    await createClient().auth.signOut({ scope: "local" }).catch(() => undefined);
    router.replace("/auth/login?account_deleted=1");
    router.refresh();
  }

  return (
    <section
      className="shelfie-surface space-y-3 p-5 sm:p-6"
      style={{ borderColor: "hsl(var(--destructive) / 0.4)" }}
      aria-labelledby="delete-account-title"
    >
      <h2 id="delete-account-title" className="flex items-center gap-2 text-base font-semibold text-destructive">
        <Trash2 aria-hidden="true" className="size-4" /> Delete account
      </h2>
      <p className="max-w-2xl text-sm leading-6 text-muted-foreground">
        Permanently delete your account and everything in it: your profile, library, reviews, wishlist, follows, shared books,
        notifications and AI conversations. This can&apos;t be undone.
      </p>
      <Button type="button" variant="destructive" onClick={() => { setError(""); setOpen(true); }}>
        Delete my account
      </Button>
      {error && <p role="alert" className="text-sm text-destructive">{error}</p>}

      <ConfirmationDialog
        open={open}
        title="Delete your account?"
        icon={<Trash2 />}
        description={
          <div className="space-y-3">
            <p>
              This permanently deletes your account and all of your Shelfie data. Your reviews and shared books will disappear for other
              readers too. <strong className="font-semibold text-foreground">This can&apos;t be undone.</strong>
            </p>
            <div className="space-y-1.5">
              <label htmlFor={inputId} className="text-sm text-foreground">
                Type <strong className="font-semibold">{username}</strong> to confirm
              </label>
              <Input
                id={inputId}
                autoComplete="off"
                autoCapitalize="none"
                spellCheck={false}
                value={confirmation}
                onChange={(event) => setConfirmation(event.target.value)}
              />
            </div>
          </div>
        }
        confirmLabel="Delete account permanently"
        confirmVariant="destructive"
        confirmDisabled={!matches}
        pendingLabel="Deleting…"
        onCancel={close}
        onConfirm={deleteAccount}
      />
    </section>
  );
}
