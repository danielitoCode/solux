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

  async updateProductConfig(
    id: string,
    payload: {
      fulfillment_model: string;
      minimum_stock: number;
      commission_percent: number;
      supplier_name: string | null;
      external_availability: string;
    }
  ): Promise<void> {
    const { error } = await supabase.from('catalog_items').update(payload).eq('id', id).eq('type', 'product');
    if (error) throw error;
  }

  async recordPurchase(payload: {
    catalog_item_id: string;
    quantity: number;
    unit_cost: number;
    description?: string;
  }): Promise<void> {
    const { error } = await supabase.rpc('receive_catalog_purchase', { payload });
    if (error) throw error;
  }

  async recordSale(payload: {
    catalog_item_id: string;
    quantity: number;
    unit_price: number;
    description?: string;
  }): Promise<void> {
    const { error } = await supabase.rpc('record_catalog_sale', { payload });
    if (error) throw error;
  }
}
