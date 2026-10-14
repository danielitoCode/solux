import { supabase } from '$infrastructure/di/supabase';

export class CatalogRemoteDataSource {
  async listActive() {
    const { data, error } = await supabase
      .from('catalog_items')
      .select('*')
      .eq('is_active', true)
      .order('sort_order');
    if (error) throw error;
    return data ?? [];
  }

  async listAll() {
    const { data, error } = await supabase
      .from('catalog_items')
      .select('*')
      .order('sort_order');
    if (error) throw error;
    return data ?? [];
  }

  async insert(row: Record<string, unknown>) {
    const { data, error } = await supabase.from('catalog_items').insert(row).select().single();
    if (error) throw error;
    return data;
  }

  async update(id: string, row: Record<string, unknown>) {
    const { data, error } = await supabase
      .from('catalog_items')
      .update(row)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  }

  async remove(id: string) {
    const { error } = await supabase.from('catalog_items').delete().eq('id', id);
    if (error) throw error;
  }
}
