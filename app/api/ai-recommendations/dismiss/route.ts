import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const body = await request.json().catch(() => null);
  if (typeof body?.google_books_id !== 'string' || !body.google_books_id.trim() || body.google_books_id.length > 256
    || (body.title != null && typeof body.title !== 'string')
    || (body.authors != null && (!Array.isArray(body.authors) || !body.authors.every((a: unknown) => typeof a === 'string')))) {
    return NextResponse.json({ error: 'Invalid book' }, { status: 400 });
  }
  const { error } = await supabase.rpc('dismiss_my_ai_recommendation', {
    p_google_books_id: body.google_books_id, p_title: (body.title ?? '').slice(0, 500),
    p_authors: (body.authors ?? []).slice(0, 10).map((a: string) => a.slice(0, 150)),
  });
  if (error) return NextResponse.json({ error: 'Could not dismiss book' }, { status: 500 });
  return NextResponse.json({ ok: true });
}
