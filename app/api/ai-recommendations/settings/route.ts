import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { data, error } = await supabase.from('ai_recommendation_preferences')
    .select('personalization_enabled').eq('user_id', user.id).maybeSingle();
  if (error) return NextResponse.json({ error: 'Failed to read preferences' }, { status: 500 });
  return NextResponse.json({ enabled: data?.personalization_enabled ?? false }, { headers: { 'Cache-Control': 'no-store' } });
}
export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const body = await request.json().catch(() => null);
  if (typeof body?.enabled !== 'boolean') return NextResponse.json({ error: 'Invalid setting' }, { status: 400 });
  const { error } = await supabase.rpc('set_my_ai_personalization', { p_enabled: body.enabled });
  if (error) return NextResponse.json({ error: 'Failed to save preference' }, { status: 500 });
  return NextResponse.json({ enabled: body.enabled });
}
