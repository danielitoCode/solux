import { assertSupabaseConfigured, supabase } from '$infrastructure/data/supabase-client';
import { devLog, devError } from '$infrastructure/ui/dev-logger';
import type { CatalogItemDto } from '../../dto/catalog-item.dto';
import type { Database } from '$infrastructure/data/database.types';
type CatalogItemInsert = Database['public']['Tables']['catalog_items']['Insert'];
type CatalogItemUpdate = Database['public']['Tables']['catalog_items']['Update'];

export class CatalogRemoteDataSource {
  async listActive(): Promise<CatalogItemDto[]> {
    assertSupabaseConfigured();
    const { data, error } = await supabase
      .from('catalog_items')
      .select('*')
      .eq('is_active', true)
      .order('sort_order');
    if (error) {
      devError('catalog-remote', 'listActive failed', error);
      throw error;
    }
    return (data ?? []) as CatalogItemDto[];
  }

  async listAll(): Promise<CatalogItemDto[]> {
    assertSupabaseConfigured();
    devLog('catalog-remote', 'listAll');
    const { data, error } = await supabase
      .from('catalog_items')
      .select('*')
      .order('sort_order');
    if (error) {
      devError('catalog-remote', 'listAll failed', error);
      throw error;
    }
    return (data ?? []) as CatalogItemDto[];
  }

  async insert(row: CatalogItemInsert): Promise<CatalogItemDto> {
    assertSupabaseConfigured();
    const { data, error } = await supabase.from('catalog_items').insert(row).select().single();
    if (error) {
      devError('catalog-remote', 'insert failed', error);
      throw error;
    }
    return data as CatalogItemDto;
  }

  async update(id: string, row: CatalogItemUpdate): Promise<CatalogItemDto> {
    assertSupabaseConfigured();
    const { data, error } = await supabase
      .from('catalog_items')
      .update(row)
      .eq('id', id)
      .select()
      .single();
    if (error) {
      devError('catalog-remote', 'update failed', error);
      throw error;
    }
    return data as CatalogItemDto;
  }

  async remove(id: string): Promise<void> {
    assertSupabaseConfigured();
    const { error } = await supabase.from('catalog_items').delete().eq('id', id);
    if (error) {
      devError('catalog-remote', 'remove failed', error);
      throw error;
    }
  }
}
