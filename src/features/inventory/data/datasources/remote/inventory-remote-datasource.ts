import { supabase } from '$infrastructure/data/supabase-client';
import type { InventoryItemDto } from '../dto/inventory-item.dto';

export class InventoryRemoteDataSource {
  async listItems(): Promise<InventoryItemDto[]> {
    const { data, error } = await supabase.from('catalog_items').select('id,name,type,price,currency,is_active,fulfillment_model,stock_quantity,minimum_stock,acquisition_cost,average_cost,commission_percent,supplier_name,external_availability').order('name');
    if (error) throw error;
    return (data ?? []) as InventoryItemDto[];
  }
  async updateConfig(id: string, config: { fulfillment_model: 'owned_stock' | 'managed_sale'; minimum_stock: number; commission_percent: number; supplier_name: string | null; external_availability: 'available' | 'unavailable' | 'unknown' }): Promise<InventoryItemDto> {
    const { data, error } = await supabase.from('catalog_items').update(config).eq('id', id).select('id,name,type,price,currency,is_active,fulfillment_model,stock_quantity,minimum_stock,acquisition_cost,average_cost,commission_percent,supplier_name,external_availability').single();
    if (error) throw error;
    return data as InventoryItemDto;
  }
  async receivePurchase(id: string, quantity: number, unitCost: number): Promise<void> {
    const { error } = await supabase.rpc('receive_catalog_purchase', { p_operation_key: crypto.randomUUID(), p_catalog_item_id: id, p_quantity: quantity, p_unit_cost: unitCost, p_description: 'Entrada de inventario desde backoffice' });
    if (error) throw error;
  }
  async recordSale(id: string, quantity: number, saleUnitPrice: number): Promise<void> {
    const { error } = await supabase.rpc('record_catalog_sale', { p_operation_key: crypto.randomUUID(), p_catalog_item_id: id, p_quantity: quantity, p_sale_unit_price: saleUnitPrice, p_description: 'Venta registrada desde backoffice' });
    if (error) throw error;
  }
}
