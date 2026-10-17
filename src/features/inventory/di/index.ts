import { InventoryRepositoryImpl } from '../data/repository/inventory-repository-impl';
import { ListInventoryItems, ReceiveInventoryPurchase, RecordInventorySale, UpdateInventoryConfig } from '../domain/usecases/inventory-usecases';

const repository = new InventoryRepositoryImpl();
export function getInventoryUseCases() { return { list: new ListInventoryItems(repository), updateConfig: new UpdateInventoryConfig(repository), receivePurchase: new ReceiveInventoryPurchase(repository), recordSale: new RecordInventorySale(repository) }; }
