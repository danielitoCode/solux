import { getConsumableUseCases } from '$features/consumables/di';
import type { ConsumableProduct, ConsumableProductInput } from '../../domain/entities/consumable-product';

const useCases = getConsumableUseCases();
let products = $state<ConsumableProduct[]>([]);
let loading = $state(false);
let saving = $state(false);
let error = $state('');
let notice = $state('');

export function getConsumablesState() { return { get products() { return products; }, get loading() { return loading; }, get saving() { return saving; }, get error() { return error; }, get notice() { return notice; } }; }
export async function loadConsumables() { loading = true; error = ''; try { products = await useCases.list.execute(); } catch (e) { error = e instanceof Error ? e.message : 'Error al cargar consumibles.'; } finally { loading = false; } }
export async function saveConsumable(id: string | null, input: ConsumableProductInput) { if (saving) return; saving = true; error = ''; notice = ''; try { const saved = id ? await useCases.update.execute(id, input) : await useCases.create.execute(input); products = id ? products.map((item) => item.id === saved.id ? saved : item) : [...products, saved].sort((a, b) => a.name.localeCompare(b.name)); notice = id ? 'Consumible actualizado.' : 'Consumible creado.'; } catch (e) { error = e instanceof Error ? e.message : 'No se pudo guardar el consumible.'; } finally { saving = false; } }
export async function toggleConsumable(product: ConsumableProduct) { if (saving) return; saving = true; error = ''; notice = ''; try { const updated = await useCases.toggle.execute(product); products = products.map((item) => item.id === updated.id ? updated : item); notice = updated.isActive ? 'Consumible activado.' : 'Consumible desactivado.'; } catch (e) { error = e instanceof Error ? e.message : 'No se pudo cambiar estado del consumible.'; } finally { saving = false; } }
