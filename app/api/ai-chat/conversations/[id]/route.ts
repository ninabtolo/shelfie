import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isUuid, loadConversation } from "@/app/api/ai-chat/_lib";

export const dynamic = "force-dynamic";

async function getUser() {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  return { supabase, user, error };
}

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { supabase, user, error: authError } = await getUser();
  if (authError || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  if (!isUuid(id)) return NextResponse.json({ error: "Invalid conversation" }, { status: 400 });

  try {
    const conversation = await loadConversation(supabase, id);
    if (!conversation) return NextResponse.json({ error: "Conversation not found" }, { status: 404 });
    return NextResponse.json({ conversation: { ...conversation, messages_remaining: 20 - conversation.user_message_count } }, {
      headers: { "Cache-Control": "no-store" },
    });
  } catch {
    return NextResponse.json({ error: "Could not load conversation" }, { status: 500 });
  }
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { supabase, user, error: authError } = await getUser();
  if (authError || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  if (!isUuid(id)) return NextResponse.json({ error: "Invalid conversation" }, { status: 400 });

  const { error } = await supabase.rpc("delete_my_ai_conversation", { p_conversation_id: id });
  if (error) return NextResponse.json({ error: "Could not delete conversation" }, { status: 500 });
  return NextResponse.json({ ok: true });
}
