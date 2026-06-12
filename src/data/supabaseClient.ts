import { createClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const publishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string | undefined;
const legacyAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;
const clientKey = publishableKey ?? legacyAnonKey;

export const isSupabaseConfigured = Boolean(url && clientKey);

export const supabase = isSupabaseConfigured
  ? createClient(url!, clientKey!, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true
      }
    })
  : null;
