import { createClient } from "@supabase/supabase-js";

/**
 * Privileged Supabase client. It bypasses Row Level Security, so it must only
 * ever be imported from server code (route handlers / server actions).
 *
 * Requires SUPABASE_SECRET_KEY (a "Secret key" from Supabase → Project Settings
 * → API Keys, or the legacy service_role key). Never prefix it with NEXT_PUBLIC_.
 */
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const secretKey = process.env.SUPABASE_SECRET_KEY;
  if (!url || !secretKey) return null;

  return createClient(url, secretKey, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
}
