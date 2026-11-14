import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Permanently deletes the signed-in user's account.
 *
 * Deleting the auth user cascades to profiles and from there to every table
 * that belongs to the user (library, reviews, wishlist, follows, shares,
 * notifications, AI preferences and conversations). Avatar files live in
 * Storage, outside the database, so they are removed explicitly first.
 */
export async function DELETE(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json().catch(() => null) as { confirmation?: unknown } | null;
  const confirmation = typeof body?.confirmation === "string" ? body.confirmation.trim() : "";

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("username")
    .eq("id", user.id)
    .single();
  if (profileError || !profile) {
    return NextResponse.json({ error: "Could not load your account." }, { status: 500 });
  }
  if (confirmation.toLowerCase() !== profile.username.toLowerCase()) {
    return NextResponse.json({ error: "Type your username exactly to confirm." }, { status: 400 });
  }

  const admin = createAdminClient();
  if (!admin) {
    console.error("Account deletion failed: SUPABASE_SECRET_KEY is not configured.");
    return NextResponse.json({ error: "Account deletion is temporarily unavailable. Please try again later." }, { status: 503 });
  }

  // Remove avatar files (avatars/<user id>/...). A failure here must not block deletion.
  const { data: avatarFiles, error: listError } = await admin.storage.from("avatars").list(user.id, { limit: 100 });
  if (listError) {
    console.error("Account deletion: could not list avatar files", listError.message);
  } else if (avatarFiles.length > 0) {
    const { error: removeError } = await admin.storage
      .from("avatars")
      .remove(avatarFiles.map((file) => `${user.id}/${file.name}`));
    if (removeError) console.error("Account deletion: could not remove avatar files", removeError.message);
  }

  const { error: deleteError } = await admin.auth.admin.deleteUser(user.id);
  if (deleteError) {
    console.error("Account deletion failed", deleteError.message);
    return NextResponse.json({ error: "Could not delete your account. Please try again." }, { status: 500 });
  }

  // Clear the session cookies. The user no longer exists, so a server-side error here is expected and harmless.
  await supabase.auth.signOut({ scope: "local" }).catch(() => undefined);

  return NextResponse.json({ deleted: true }, { headers: { "Cache-Control": "no-store" } });
}
