import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { Database } from './database.types';

const url = import.meta.env.VITE_SUPABASE_URL as string;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

if (!url || !anonKey) {
  console.warn('[solux] VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY no configurados');
}

export const supabase: SupabaseClient<Database> = createClient(
  url ?? '',
  anonKey ?? ''
);
