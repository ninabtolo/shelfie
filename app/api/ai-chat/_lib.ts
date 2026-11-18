import type { SupabaseClient } from "@supabase/supabase-js";

export const CHAT_MESSAGE_LIMIT = 20;

export type StoredChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  recommendations: unknown[];
  created_at: string;
};

export type StoredConversation = {
  id: string;
  title: string;
  user_message_count: number;
  created_at: string;
  updated_at: string;
  messages: StoredChatMessage[];
};

/**
 * Maps the quota errors raised by the AI RPCs (see the security_hardening
 * migration) to a user-facing message and a 429. Returns null for other errors.
 */
export function aiLimitError(error: { message: string } | null): { error: string; status: 429 } | null {
  const text = error?.message.toLowerCase() ?? "";
  if (text.includes("message limit")) {
    return { error: `This conversation reached its ${CHAT_MESSAGE_LIMIT}-message limit. Start a new conversation to keep going.`, status: 429 };
  }
  if (text.includes("daily ai limit")) {
    return { error: "You reached today's AI limit. Try again tomorrow.", status: 429 };
  }
  if (text.includes("sending too fast")) {
    return { error: "You're sending messages too fast. Wait a few seconds and try again.", status: 429 };
  }
  return null;
}

export function isUuid(value: unknown): value is string {
  return typeof value === "string"
    && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

export async function loadConversation(supabase: SupabaseClient, id: string): Promise<StoredConversation | null> {
  const { data: conversation, error: conversationError } = await supabase
    .from("ai_conversations")
    .select("id, title, user_message_count, created_at, updated_at")
    .eq("id", id)
    .maybeSingle();
  if (conversationError) throw new Error(conversationError.message);
  if (!conversation) return null;

  const { data: messages, error: messagesError } = await supabase
    .from("ai_chat_messages")
    .select("id, role, content, recommendations, created_at")
    .eq("conversation_id", id)
    .order("created_at", { ascending: true });
  if (messagesError) throw new Error(messagesError.message);

  return {
    ...conversation,
    messages: (messages ?? []) as StoredChatMessage[],
  } as StoredConversation;
}
