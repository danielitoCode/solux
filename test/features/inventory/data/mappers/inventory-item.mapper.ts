import { describe, it, expect } from 'vitest';
import { mapInventoryItemDto } from '$features/inventory/data/mappers/inventory-item.mapper';
import type { InventoryItemDto } from '$features/inventory/data/dto/inventory-item.dto';

describe('inventory-item.mapper', () => {
  it('coerce numeric fields', () => {
    const item = mapInventoryItemDto({
      id: 'i1', name: 'Panel', type: 'product', price: 120, currency: 'USD', is_active: true,
      fulfillment_model: 'managed_sale', stock_quantity: '5', minimum_stock: '1',
      acquisition_cost: '80', average_cost: '85', commission_percent: '12.5',
      supplier_name: 'Jinko', external_availability: true
    } as unknown as InventoryItemDto);
    expect(item.stockQuantity).toBe(5);
    expect(item.commissionPercent).toBe(12.5);
    expect(item.supplierName).toBe('Jinko');
  });
});
