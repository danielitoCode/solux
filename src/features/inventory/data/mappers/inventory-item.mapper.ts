import type { InventoryItem } from '../../domain/entities/inventory-item';
import type { InventoryItemDto } from '../dto/inventory-item.dto';

export function mapInventoryItemDto(dto: InventoryItemDto): InventoryItem {
  return { id: dto.id, name: dto.name, type: dto.type, price: dto.price, currency: dto.currency, isActive: dto.is_active, fulfillmentModel: dto.fulfillment_model, stockQuantity: Number(dto.stock_quantity), minimumStock: Number(dto.minimum_stock), acquisitionCost: Number(dto.acquisition_cost), averageCost: Number(dto.average_cost), commissionPercent: Number(dto.commission_percent), supplierName: dto.supplier_name, externalAvailability: dto.external_availability };
}
