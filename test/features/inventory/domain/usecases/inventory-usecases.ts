import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { InventoryItem, InventoryConfig } from '$features/inventory/domain/entities/inventory-item';
import type { InventoryRepository } from '$features/inventory/domain/repository/inventory-repository';
import {
  ListInventoryItems,
  UpdateInventoryConfig,
  ReceiveInventoryPurchase,
  RecordInventorySale
} from '$features/inventory/domain/usecases/inventory-usecases';

const item = (overrides: Partial<InventoryItem> = {}): InventoryItem =>
  ({
    id: 'inv-1',
    name: 'Panel',
    type: 'product',
    price: 100,
    currency: 'USD',
    isActive: true,
    fulfillmentModel: 'owned_stock',
    stockQuantity: 10,
    minimumStock: 1,
    acquisitionCost: 80,
    averageCost: 85,
    commissionPercent: 0,
    supplierName: 'Jinko',
    externalAvailability: 'available',
    ...overrides
  }) as InventoryItem;

describe('inventory-usecases', () => {
  let repo: InventoryRepository;
  beforeEach(() => {
    repo = {
      listItems: vi.fn(),
      updateConfig: vi.fn(),
      receivePurchase: vi.fn(),
      recordSale: vi.fn()
    };
  });

  it('ListInventoryItems', async () => {
    vi.mocked(repo.listItems).mockResolvedValue([item()]);
    expect(await new ListInventoryItems(repo).execute()).toHaveLength(1);
  });

  it('UpdateInventoryConfig', async () => {
    const config: InventoryConfig = {
      fulfillmentModel: 'managed_sale',
      minimumStock: 2,
      commissionPercent: 10,
      supplierName: 'Jinko',
      externalAvailability: 'available'
    };
    vi.mocked(repo.updateConfig).mockResolvedValue(item());
    await new UpdateInventoryConfig(repo).execute('inv-1', config);
    expect(repo.updateConfig).toHaveBeenCalledWith('inv-1', config);
  });

  it('ReceiveInventoryPurchase', async () => {
    vi.mocked(repo.receivePurchase).mockResolvedValue(undefined);
    await new ReceiveInventoryPurchase(repo).execute('inv-1', 5, 100);
    expect(repo.receivePurchase).toHaveBeenCalledWith('inv-1', 5, 100);
  });

  it('RecordInventorySale', async () => {
    vi.mocked(repo.recordSale).mockResolvedValue(undefined);
    await new RecordInventorySale(repo).execute('inv-1', 2, 150);
    expect(repo.recordSale).toHaveBeenCalledWith('inv-1', 2, 150);
  });
});
