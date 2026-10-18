import { getInventoryUseCases } from '$features/inventory/di';
import type { InventoryConfig, InventoryItem } from '../../domain/entities/inventory-item';

const useCases = getInventoryUseCases();
let items = $state<InventoryItem[]>([]);
let selectedId = $state('');
let loading = $state(true);
let saving = $state(false);
let error = $state('');
let notice = $state('');

export function getInventoryState() { return { get items() { return items; }, get selectedId() { return selectedId; }, get loading() { return loading; }, get saving() { return saving; }, get error() { return error; }, get notice() { return notice; }, get selected() { return items.find((item) => item.id === selectedId) ?? null; }, get lowStock() { return items.filter((item) => item.type === 'product' && item.fulfillmentModel === 'owned_stock' && item.stockQuantity <= item.minimumStock); } }; }
export function selectInventoryItem(id: string) { selectedId = id; }
export async function loadInventory() { loading = true; error = ''; try { items = await useCases.list.execute(); const products = items.filter((item) => item.type === 'product'); if (!products.some((item) => item.id === selectedId)) selectedId = products[0]?.id ?? ''; } catch (e) { error = e instanceof Error ? e.message : 'Error al cargar inventario'; } finally { loading = false; } }
export async function saveInventoryConfig(config: InventoryConfig) { if (saving) return; const selected = items.find((item) => item.id === selectedId); if (!selected || selected.type !== 'product') return; saving = true; error = ''; notice = ''; try { const updated = await useCases.updateConfig.execute(selected.id, config); items = items.map((item) => item.id === updated.id ? updated : item); notice = 'Configuración de abastecimiento guardada.'; } catch (e) { error = e instanceof Error ? e.message : 'No se pudo guardar configuración.'; } finally { saving = false; } }
export async function submitInventoryOperation(operation: 'purchase' | 'sale', quantity: number, unitCost: number, salePrice: number) { if (saving) return; const selected = items.find((item) => item.id === selectedId); if (!selected || selected.type !== 'product') return; saving = true; error = ''; notice = ''; try { if (operation === 'purchase') await useCases.receivePurchase.execute(selected.id, quantity, unitCost); else await useCases.recordSale.execute(selected.id, quantity, salePrice); await loadInventory(); notice = operation === 'purchase' ? 'Compra registrada y costo promedio actualizado.' : 'Venta registrada.'; } catch (e) { error = e instanceof Error ? e.message : 'No se pudo registrar operación.'; } finally { saving = false; } }
