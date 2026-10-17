import type { InventoryConfig, InventoryItem } from '../../domain/entities/inventory-item';
import type { InventoryRepository } from '../../domain/repository/inventory-repository';
import { InventoryRemoteDataSource } from '../datasources/remote/inventory-remote-datasource';
import { mapInventoryItemDto } from '../mappers/inventory-item.mapper';

export class InventoryRepositoryImpl implements InventoryRepository {
  constructor(private readonly remote = new InventoryRemoteDataSource()) {}
  async listItems(): Promise<InventoryItem[]> { return (await this.remote.listItems()).map(mapInventoryItemDto); }
  async updateConfig(id: string, config: InventoryConfig): Promise<InventoryItem> { return mapInventoryItemDto(await this.remote.updateConfig(id, { fulfillment_model: config.fulfillmentModel, minimum_stock: config.minimumStock, commission_percent: config.commissionPercent, supplier_name: config.supplierName, external_availability: config.externalAvailability })); }
  receivePurchase(id: string, quantity: number, unitCost: number) { return this.remote.receivePurchase(id, quantity, unitCost); }
  recordSale(id: string, quantity: number, saleUnitPrice: number) { return this.remote.recordSale(id, quantity, saleUnitPrice); }
}
