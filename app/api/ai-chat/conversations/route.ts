import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

async function getUser() {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  return { supabase, user, error };
}

export async function GET() {
  const { supabase, user, error: authError } = await getUser();
  if (authError || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data, error } = await supabase
    .from("ai_conversations")
    .select("id, title, user_message_count, created_at, updated_at")
    .eq("user_id", user.id)
    .order("updated_at", { ascending: false })
    .limit(50);
  if (error) return NextResponse.json({ error: "Could not load conversations" }, { status: 500 });

  return NextResponse.json({ conversations: data ?? [] }, { headers: { "Cache-Control": "no-store" } });
}

export async function POST(request: Request) {
  const { supabase, user, error: authError } = await getUser();
  if (authError || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: preference, error: preferenceError } = await supabase
    .from("ai_recommendation_preferences")
    .select("personalization_enabled")
    .eq("user_id", user.id)
    .maybeSingle();
  if (preferenceError) return NextResponse.json({ error: "Could not check AI settings" }, { status: 500 });
  if (!preference?.personalization_enabled) return NextResponse.json({ error: "Personalization disabled" }, { status: 403 });

  const body = await request.json().catch(() => null) as { title?: unknown } | null;
  if (body?.title !== undefined && (typeof body.title !== "string" || body.title.length > 120)) {
    return NextResponse.json({ error: "Invalid conversation title" }, { status: 400 });
  }

  const { data: id, error } = await supabase.rpc("create_my_ai_conversation", {
    p_title: typeof body?.title === "string" ? body.title : null,
  });
  if (error || typeof id !== "string") return NextResponse.json({ error: "Could not create conversation" }, { status: 500 });

  return NextResponse.json({
    conversation: {
      id,
      title: typeof body?.title === "string" && body.title.trim() ? body.title.trim().slice(0, 120) : "New conversation",
      user_message_count: 0,
      messages_remaining: 20,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
  });
}
