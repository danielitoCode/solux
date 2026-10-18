import { assertSupabaseConfigured, supabase } from '$infrastructure/data/supabase-client';
import type { Database } from '$infrastructure/data/database.types';

type Row = Database['public']['Tables']['consumable_products']['Row'];
type Insert = Database['public']['Tables']['consumable_products']['Insert'];

export class ConsumableRemoteDataSource {
  async list(): Promise<Row[]> {
    assertSupabaseConfigured();
    const { data, error } = await supabase.from('consumable_products').select('*').order('name');
    if (error) throw error;
    return (data ?? []) as Row[];
  }

  async create(input: Insert): Promise<Row> {
    assertSupabaseConfigured();
    const { data, error } = await supabase.from('consumable_products').insert(input).select().single();
    if (error) throw error;
    return data as Row;
  }

  async update(id: string, input: Insert): Promise<Row> {
    assertSupabaseConfigured();
    const { data, error } = await supabase.from('consumable_products').update(input).eq('id', id).select().single();
    if (error) throw error;
    return data as Row;
  }

  async toggle(id: string, isActive: boolean): Promise<Row> {
    assertSupabaseConfigured();
    const { data, error } = await supabase.from('consumable_products').update({ is_active: isActive }).eq('id', id).select().maybeSingle();
    if (error) throw error;
    if (!data) throw new Error('No se actualizó ningún consumible. Verifica permisos y vuelve a cargar.');
    return data as Row;
  }
}
