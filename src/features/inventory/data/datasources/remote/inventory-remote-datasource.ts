import { supabase } from '$infrastructure/data/supabase-client';
import type { InventoryItemDto } from '../../dto/inventory-item.dto';

export class InventoryRemoteDataSource {
  async listItems(): Promise<InventoryItemDto[]> {
    const { data, error } = await supabase
      .from('catalog_items')
      .select(
        'id,type,category,name,short_description,description,price,currency,is_active,is_featured,features,image_urls,sort_order,fulfillment_model,stock_quantity,average_cost,acquisition_cost,minimum_stock,commission_percent,supplier_name,external_availability'
      )
      .order('sort_order', { ascending: true })
      .order('name', { ascending: true });
    if (error) throw error;
    return (data ?? []) as InventoryItemDto[];
  }

  async updateConfig(
    id: string,
    config: {
      fulfillment_model: 'owned_stock' | 'managed_sale';
      minimum_stock: number;
      commission_percent: number;
      supplier_name: string | null;
      external_availability: 'available' | 'unavailable' | 'unknown';
    }
  ): Promise<InventoryItemDto> {
    const { data, error } = await supabase
      .from('catalog_items')
      .update(config)
      .eq('id', id)
      .eq('type', 'product')
      .select(
        'id,type,category,name,short_description,description,price,currency,is_active,is_featured,features,image_urls,sort_order,fulfillment_model,stock_quantity,average_cost,acquisition_cost,minimum_stock,commission_percent,supplier_name,external_availability'
      )
      .single();
    if (error) throw error;
    return data as InventoryItemDto;
  }

  async receivePurchase(id: string, quantity: number, unitCost: number): Promise<void> {
    const { error } = await supabase.rpc('receive_catalog_purchase', {
      payload: { catalog_item_id: id, quantity, unit_cost: unitCost }
    });
    if (error) throw error;
  }

  async recordSale(id: string, quantity: number, saleUnitPrice: number): Promise<void> {
    const { error } = await supabase.rpc('record_catalog_sale', {
      payload: { catalog_item_id: id, quantity, unit_price: saleUnitPrice }
    });
    if (error) throw error;
  }
}
