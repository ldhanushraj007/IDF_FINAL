/**
 * supabase.ts — DEPRECATED
 * ============================================================================
 * Supabase Auth has been replaced by Google Identity Services (googleAuth.ts).
 * The Supabase JS client (@supabase/supabase-js) is no longer installed.
 *
 * The Supabase project itself is still used for admin Edge Functions
 * (admin-auth, admin-api) — these are called via plain fetch in adminApi.ts
 * using VITE_SUPABASE_URL, no client library needed.
 *
 * This file is kept as an empty stub so any stray imports don't break the
 * build during migration. It exports nothing meaningful.
 */

export const supabase = null;
export const isSupabaseConfigured = false;
export const adminAuthFunctionUrl = '';
export const adminApiFunctionUrl = '';
