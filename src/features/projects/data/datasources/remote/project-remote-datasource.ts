import { assertSupabaseConfigured, supabase } from '$infrastructure/data/supabase-client';
import type { Database } from '$infrastructure/data/database.types';
type Row = Database['public']['Tables']['site_projects']['Row'];
type Insert = Database['public']['Tables']['site_projects']['Insert'];
export class ProjectRemoteDataSource {
  async list(): Promise<Row[]> { assertSupabaseConfigured(); const { data, error } = await supabase.from('site_projects').select('*').order('sort_order').order('created_at', { ascending: false }); if (error) throw error; return (data ?? []) as Row[]; }
  async create(input: Insert): Promise<Row> { assertSupabaseConfigured(); const { data, error } = await supabase.from('site_projects').insert(input).select().single(); if (error) throw error; return data as Row; }
  async update(id: string, input: Insert): Promise<Row> { assertSupabaseConfigured(); const { data, error } = await supabase.from('site_projects').update(input).eq('id', id).select().single(); if (error) throw error; return data as Row; }
  async remove(id: string): Promise<void> { assertSupabaseConfigured(); const { error } = await supabase.from('site_projects').delete().eq('id', id); if (error) throw error; }
}
