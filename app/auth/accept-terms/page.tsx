import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AuthShell } from "@/components/auth-shell";
import { AcceptTermsForm } from "@/components/legal/accept-terms-form";
import { createClient } from "@/lib/supabase/server";
import { LEGAL_VERSION } from "@/lib/legal";

export const metadata: Metadata = {
  title: "Review our terms · Shelfie",
};

export default async function AcceptTermsPage() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const userId = typeof data?.claims?.sub === "string" ? data.claims.sub : null;
  if (!userId) redirect("/auth/login");

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("terms_version")
    .eq("id", userId)
    .maybeSingle();
  if (error) throw new Error("Could not load your account.");
  if (profile?.terms_version === LEGAL_VERSION) redirect("/protected");

  return (
    <AuthShell>
      <AcceptTermsForm isUpdate={Boolean(profile?.terms_version)} />
    </AuthShell>
  );
}
