import { createClient, SupabaseClient } from "@supabase/supabase-js";

let client: SupabaseClient | null = null;

// Server-only client. Uses the secret key; never import this in client components.
export function db(): SupabaseClient {
  if (client) return client;
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SECRET_KEY;
  if (!url || !key) throw new Error("SUPABASE_URL / SUPABASE_SECRET_KEY missing");
  client = createClient(url, key, { auth: { persistSession: false } });
  return client;
}
