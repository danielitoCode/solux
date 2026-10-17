export type InventoryItemDto = {
  id: string; name: string; type: 'product' | 'service'; price: number | null; currency: string; is_active: boolean;
  fulfillment_model: 'owned_stock' | 'managed_sale'; stock_quantity: number; minimum_stock: number; acquisition_cost: number;
  average_cost: number; commission_percent: number; supplier_name: string | null; external_availability: 'available' | 'unavailable' | 'unknown';
};
