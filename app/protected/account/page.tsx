import { createClient } from "@/lib/supabase/server";

export const instant = false

export default async function AccountPage() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const email = typeof data?.claims?.email === "string" ? data.claims.email : "Not informed";

  return (
    <section className="flex flex-col gap-6 py-8">
      <div>
        <p className="text-sm text-muted-foreground">Authenticated area</p>
        <h1 className="text-3xl font-bold">My account</h1>
      </div>
      <div className="rounded-xl border p-6">
        <p className="text-sm text-muted-foreground">E-mail</p>
        <p className="mt-1 font-medium">{email}</p>
      </div>
    </section>
  );
}
