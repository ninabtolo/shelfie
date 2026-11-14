import { NextResponse } from "next/server";
import { generateRecommendations, RECOMMENDATION_COUNT, type Recommendation } from "@/lib/ai/recommendations";
import type { Book, ReadingProfile } from "@/lib/ai/reading-context";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const GENERATION_COOLDOWN_SECONDS = 20;

type RecommendationCache = { books?: Recommendation[]; generated_at?: string | null };

/**
 * Stream events, one JSON object per line:
 *   {"type":"book","book":{...}}       a verified recommendation, as soon as it is ready
 *   {"type":"done","books":[...],...}  the final saved set
 *   {"type":"error","error":"..."}
 */
type StreamEvent =
  | { type: "book"; book: Recommendation }
  | { type: "done"; books: Recommendation[]; partial: boolean; cooldown_seconds: number }
  | { type: "error"; error: string };

/**
 * Books shown in the last few refreshes, so the next set is fresh. Falls back
 * to the current saved set if the history RPC is unavailable (for example,
 * before its migration is applied). Never fatal.
 */
async function loadRecentRecommendations(supabase: Awaited<ReturnType<typeof createClient>>): Promise<Book[]> {
  const { data, error } = await supabase.rpc("get_my_recent_ai_recommendations");
  if (!error && Array.isArray(data)) return data as Book[];
  console.warn("Could not load recent AI recommendations, using the current set:", error?.message);

  const { data: cache, error: cacheError } = await supabase.rpc("get_my_ai_recommendation_cache");
  if (cacheError) console.warn("Could not load AI recommendation cache:", cacheError.message);
  const books = (cache as RecommendationCache | null)?.books;
  return Array.isArray(books) ? books : [];
}

export async function GET() {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data, error } = await supabase.rpc("get_my_ai_recommendation_cache");
  if (error) {
    console.error("Could not load AI recommendation cache:", error.message);
    return NextResponse.json({ error: "Could not load recommendations" }, { status: 500 });
  }
  return NextResponse.json(data as RecommendationCache ?? { books: [], generated_at: null }, {
    headers: { "Cache-Control": "no-store" },
  });
}

export async function POST() {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: pref, error: prefError } = await supabase.from("ai_recommendation_preferences")
    .select("personalization_enabled").eq("user_id", user.id).maybeSingle();
  if (prefError) return NextResponse.json({ error: "Could not check preferences" }, { status: 500 });
  if (!pref?.personalization_enabled) return NextResponse.json({ error: "Personalization disabled" }, { status: 403 });

  const { data: claimed, error: claimError } = await supabase.rpc("claim_my_ai_recommendation_generation");
  if (claimError) return NextResponse.json({ error: "Could not start generation" }, { status: 500 });
  if (!claimed) {
    return NextResponse.json(
      { error: `Please wait ${GENERATION_COOLDOWN_SECONDS} seconds before generating again`, retry_after: GENERATION_COOLDOWN_SECONDS },
      { status: 429, headers: { "Cache-Control": "no-store", "Retry-After": String(GENERATION_COOLDOWN_SECONDS) } },
    );
  }

  const { data: profile, error: profileError } = await supabase.rpc("get_my_ai_reading_profile");
  if (profileError || !profile) return NextResponse.json({ error: "Could not load reading profile" }, { status: 500 });

  const recent = await loadRecentRecommendations(supabase);

  const encoder = new TextEncoder();
  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      let open = true;
      const send = (event: StreamEvent) => {
        if (!open) return;
        try {
          controller.enqueue(encoder.encode(`${JSON.stringify(event)}\n`));
        } catch {
          // The client went away; keep generating so the result is still saved.
          open = false;
        }
      };

      void (async () => {
        try {
          const results = await generateRecommendations(profile as ReadingProfile, {
            userId: user.id,
            recent,
            onBook: (book) => send({ type: "book", book }),
          });
          if (results.length === 0) {
            // Keep the previously saved set rather than replacing it with nothing.
            send({ type: "error", error: "Could not verify any recommendations right now. Try again in a moment." });
            return;
          }
          const { error: cacheError } = await supabase.rpc("save_my_ai_recommendations", { p_books: results });
          if (cacheError) {
            console.error("Could not save AI recommendation cache:", cacheError.message);
            send({ type: "error", error: "Could not save recommendations. Try again later." });
          } else {
            send({
              type: "done",
              books: results,
              partial: results.length < RECOMMENDATION_COUNT,
              cooldown_seconds: GENERATION_COOLDOWN_SECONDS,
            });
          }
        } catch (error) {
          console.error("AI recommendations failed:", error instanceof Error ? error.message : "Unknown error");
          send({ type: "error", error: "Could not generate recommendations. Try again later." });
        } finally {
          if (open) controller.close();
        }
      })();
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "application/x-ndjson; charset=utf-8",
      "Cache-Control": "no-store",
      "X-Accel-Buffering": "no",
    },
  });
}
