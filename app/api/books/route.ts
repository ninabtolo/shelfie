import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getBook, GoogleBooksError } from "@/lib/books/google-books";
import { toCatalogRow } from "@/lib/books/catalog";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const GOOGLE_BOOKS_ID = /^[A-Za-z0-9_-]{1,64}$/;

/**
 * Makes sure a Google Books volume exists in the shared public.books catalog.
 *
 * The metadata always comes from Google Books, fetched here on the server, never
 * from the browser, so nobody can decide a book's title or cover for everyone
 * else. Only this route writes to public.books (with the service role); the
 * library, wishlist, review and share RPCs take just the Google Books ID.
 */
export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json().catch(() => null) as { google_books_id?: unknown } | null;
  const googleBooksId = typeof body?.google_books_id === "string" ? body.google_books_id.trim() : "";
  if (!GOOGLE_BOOKS_ID.test(googleBooksId)) {
    return NextResponse.json({ error: "Invalid book" }, { status: 400 });
  }

  // Already in the catalog: nothing to fetch.
  const { data: existing, error: lookupError } = await supabase
    .from("books")
    .select("id")
    .eq("google_books_id", googleBooksId)
    .maybeSingle();
  if (lookupError) return NextResponse.json({ error: "Could not save this book. Please try again." }, { status: 500 });
  if (existing) return NextResponse.json({ saved: true });

  const admin = createAdminClient();
  if (!admin) {
    console.error("Saving a book failed: SUPABASE_SECRET_KEY is not configured.");
    return NextResponse.json({ error: "Saving books is temporarily unavailable. Please try again later." }, { status: 503 });
  }

  let book;
  try {
    book = await getBook(googleBooksId, { userId: user.id });
  } catch (error) {
    if (error instanceof GoogleBooksError) {
      return NextResponse.json({ error: "Google Books is unavailable right now. Please try again in a moment." }, { status: 502 });
    }
    throw error;
  }
  if (!book) return NextResponse.json({ error: "This book could not be found on Google Books." }, { status: 404 });

  // Stored under the requested ID, which is the one the RPCs look up next.
  const { error: insertError } = await admin
    .from("books")
    .upsert(toCatalogRow({ ...book, google_books_id: googleBooksId }), {
      onConflict: "google_books_id",
      ignoreDuplicates: true,
    });
  if (insertError) {
    console.error("Saving a book failed:", insertError.message);
    return NextResponse.json({ error: "Could not save this book. Please try again." }, { status: 500 });
  }

  return NextResponse.json({ saved: true });
}
