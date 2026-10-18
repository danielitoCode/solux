import type { InventoryConfig, InventoryItem } from '../entities/inventory-item';

export interface InventoryRepository {
  listItems(): Promise<InventoryItem[]>;
  updateConfig(id: string, config: InventoryConfig): Promise<InventoryItem>;
  receivePurchase(id: string, quantity: number, unitCost: number): Promise<void>;
  recordSale(id: string, quantity: number, saleUnitPrice: number): Promise<void>;
}
