import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/*
 * Two clients, two jobs.
 *
 * publicClient  — anon key, used by the public site. RLS limits it to
 *                 published rows, so a leaked key exposes nothing private.
 * adminClient   — service-role key, used ONLY inside the portal's server
 *                 actions. It bypasses RLS, so it must never be imported into
 *                 a "use client" file; the key would ship to the browser.
 *
 * Both return null when the environment isn't configured yet, so the app still
 * builds and runs off the seed content before the client's project exists.
 */

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export const isConfigured = Boolean(url && anonKey);

export function publicClient(): SupabaseClient | null {
  if (!url || !anonKey) return null;
  return createClient(url, anonKey, { auth: { persistSession: false } });
}

export function adminClient(): SupabaseClient | null {
  if (!url || !serviceKey) return null;
  return createClient(url, serviceKey, { auth: { persistSession: false } });
}
