"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { LegalConsentCheckbox } from "@/components/legal/legal-consent-checkbox";
import { createClient } from "@/lib/supabase/client";
import { LEGAL_VERSION, MINIMUM_AGE } from "@/lib/legal";

export function AcceptTermsForm({ isUpdate }: { isUpdate: boolean }) {
  const router = useRouter();
  const [accepted, setAccepted] = useState(false);
  const [pending, setPending] = useState<"accept" | "logout" | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function accept(event: React.FormEvent) {
    event.preventDefault();
    if (!accepted) {
      setError(`Please confirm you are at least ${MINIMUM_AGE} and accept the terms to continue.`);
      return;
    }
    setPending("accept");
    setError(null);
    const { error } = await createClient().rpc("accept_my_legal_terms", { p_version: LEGAL_VERSION });
    if (error) {
      setError("Could not save your acceptance. Please try again.");
      setPending(null);
      return;
    }
    router.replace("/protected");
    router.refresh();
  }

  async function logout() {
    setPending("logout");
    await createClient().auth.signOut();
    router.replace("/auth/login");
    router.refresh();
  }

  return (
    <Card className="auth-form-card">
      <CardHeader>
        <CardTitle className="text-2xl">{isUpdate ? "We updated our terms" : "Before you continue"}</CardTitle>
        <CardDescription>
          {isUpdate
            ? "Please review and accept the updated Terms of Use and Privacy Policy to keep using Shelfie."
            : "Shelfie now has a Terms of Use and Privacy Policy. Please review and accept them to keep using your account."}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={accept} className="flex flex-col gap-5">
          <LegalConsentCheckbox checked={accepted} onChange={setAccepted} disabled={pending !== null} />
          {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
          <Button type="submit" className="w-full" disabled={pending !== null}>
            {pending === "accept" ? "Saving…" : "Accept and continue"}
          </Button>
          <button
            type="button"
            onClick={() => void logout()}
            disabled={pending !== null}
            className="text-center text-sm text-muted-foreground underline-offset-4 transition-colors hover:text-foreground hover:underline"
          >
            {pending === "logout" ? "Logging out…" : "Not now, log out"}
          </button>
        </form>
      </CardContent>
    </Card>
  );
}
