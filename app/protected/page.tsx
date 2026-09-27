import { createClient } from "@/lib/supabase/server";

export const instant = false

export default async function ProtectedPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  let username = "user";

  if (user) {
    const { data: profile, error } = await supabase
      .from("profiles")
      .select("username")
      .eq("id", user.id)
      .single();

    if (error) {
      console.log("Error loading profile:", error);
    }

    if (profile?.username) {
      username = profile.username;
    }
  }

  return (
    <section className="flex flex-col gap-3 py-8">
      <p className="text-sm text-muted-foreground">Authenticated area</p>
      <h1 className="text-3xl font-bold">Welcome, @{username}</h1>
      <p className="text-muted-foreground">
        Your personalized library awaits for you
      </p>
    </section>
  );
}
