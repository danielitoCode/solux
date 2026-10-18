import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { Database } from './database.types';
import { devLog, devError } from '$infrastructure/ui/dev-logger';

const url = (import.meta.env.VITE_SUPABASE_URL as string | undefined)?.trim() ?? '';
const anonKey = (import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined)?.trim() ?? '';

export const supabaseConfigured = Boolean(url && anonKey);

if (!supabaseConfigured) {
  devLog(
    'supabase',
    'VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY no configurados — cliente placeholder'
  );
} else {
  devLog('supabase', 'cliente configurado', { url });
}

// createClient con strings vacíos puede romper; usar placeholder válido solo para tipado
const safeUrl = url || 'https://placeholder.supabase.co';
const safeKey = anonKey || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.placeholder';

export const supabase: SupabaseClient<Database> = createClient<Database>(safeUrl, safeKey);

export function assertSupabaseConfigured() {
  if (!supabaseConfigured) {
    const err = new Error(
      'Supabase no configurado. Define VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY en .env'
    );
    devError('supabase', 'assertSupabaseConfigured', err, {
      file: 'src/infrastructure/data/supabase-client.ts'
    });
    throw err;
  }
}
