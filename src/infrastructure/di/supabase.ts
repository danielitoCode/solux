/**
 * Supabase client — infrastructure singleton.
 * Configure via env: PUBLIC_SUPABASE_URL + PUBLIC_SUPABASE_ANON_KEY
 * (or VITE_ for current Vite setup until SvelteKit migration).
 */
// Placeholder until @supabase/supabase-js is added and env is set.
// export const supabase = createClient(url, key);
export const supabaseConfig = {
  url: import.meta.env.VITE_SUPABASE_URL as string | undefined,
  anonKey: import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined,
};
