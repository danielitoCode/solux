import type { InventoryConfig, InventoryItem } from '../entities/inventory-item';
import type { InventoryRepository } from '../repository/inventory-repository';

export class ListInventoryItems { constructor(private readonly repository: InventoryRepository) {} execute(): Promise<InventoryItem[]> { return this.repository.listItems(); } }
export class UpdateInventoryConfig { constructor(private readonly repository: InventoryRepository) {} execute(id: string, config: InventoryConfig): Promise<InventoryItem> { return this.repository.updateConfig(id, config); } }
export class ReceiveInventoryPurchase { constructor(private readonly repository: InventoryRepository) {} execute(id: string, quantity: number, unitCost: number): Promise<void> { return this.repository.receivePurchase(id, quantity, unitCost); } }
export class RecordInventorySale { constructor(private readonly repository: InventoryRepository) {} execute(id: string, quantity: number, saleUnitPrice: number): Promise<void> { return this.repository.recordSale(id, quantity, saleUnitPrice); } }
