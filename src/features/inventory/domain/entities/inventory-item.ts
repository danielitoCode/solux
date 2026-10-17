export type InventoryItem = {
  id: string;
  name: string;
  type: 'product' | 'service';
  price: number | null;
  currency: string;
  isActive: boolean;
  fulfillmentModel: 'owned_stock' | 'managed_sale';
  stockQuantity: number;
  minimumStock: number;
  acquisitionCost: number;
  averageCost: number;
  commissionPercent: number;
  supplierName: string | null;
  externalAvailability: 'available' | 'unavailable' | 'unknown';
};

export type InventoryConfig = Pick<InventoryItem, 'fulfillmentModel' | 'minimumStock' | 'commissionPercent' | 'supplierName' | 'externalAvailability'>;
