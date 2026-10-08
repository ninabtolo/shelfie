import { createClient } from "@/lib/supabase/server";
import { ProfileEditor } from "@/components/profile/profile-editor";

export default async function AccountPage() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const email = typeof data?.claims?.email === "string" ? data.claims.email : "Not informed";
  const userId = typeof data?.claims?.sub === "string" ? data.claims.sub : null;
  if (!userId) throw new Error("Could not load your account.");
  const { data: profile, error } = await supabase
    .from("profiles")
    .select("username, bio, avatar_url")
    .eq("id", userId)
    .single();
  if (error || !profile) throw new Error("Could not load your profile.");

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
      <ProfileEditor
        userId={userId}
        username={profile.username}
        initialBio={profile.bio ?? ""}
        initialAvatarUrl={profile.avatar_url}
      />
    </section>
  );
}
