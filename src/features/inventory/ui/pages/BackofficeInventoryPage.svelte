<script lang="ts">
  import { onMount } from 'svelte';
  import {
    getInventoryState,
    loadInventory,
    selectInventoryItem,
    saveInventoryConfig,
    submitInventoryOperation
  } from '../stores/inventory.store.svelte';
  import type { InventoryItem } from '../../domain/entities/inventory-item';

  let viewState = getInventoryState();

  type Filter = 'all' | 'owned_stock' | 'managed_sale';
  let filter = $state<Filter>('all');
  let search = $state('');

  let operation = $state<'purchase' | 'sale'>('purchase');
  let quantity = $state('1');
  let unitCost = $state('0');
  let salePrice = $state('0');
  let minimumStock = $state('0');
  let fulfillment = $state<'owned_stock' | 'managed_sale'>('owned_stock');
  let commission = $state('0');
  let supplier = $state('');
  let availability = $state<'available' | 'unavailable' | 'unknown'>('unknown');

  const filtered = $derived.by(() => {
    let list = viewState.items.filter((i) => i.type === 'product');
    if (filter !== 'all') list = list.filter((i) => i.fulfillmentModel === filter);
    const q = search.trim().toLowerCase();
    if (q) {
      list = list.filter(
        (i) =>
          i.name.toLowerCase().includes(q) ||
          (i.supplierName ?? '').toLowerCase().includes(q)
      );
    }
    return list;
  });

  const stats = $derived.by(() => {
    const products = viewState.items.filter((i) => i.type === 'product');
    const managed = products.filter((i) => i.fulfillmentModel === 'managed_sale');
    const owned = products.filter((i) => i.fulfillmentModel === 'owned_stock');
    return {
      total: products.length,
      managed: managed.length,
      owned: owned.length,
      lowStock: viewState.lowStock.length
    };
  });

  function syncForm() {
    const s = viewState.selected;
    if (!s) return;
    fulfillment = s.fulfillmentModel;
    commission = String(s.commissionPercent);
    supplier = s.supplierName ?? '';
    availability = s.externalAvailability;
    minimumStock = String(s.minimumStock);
    unitCost = String(s.acquisitionCost);
    salePrice = String(s.price ?? 0);
  }

  async function changeSelection(id: string) {
    selectInventoryItem(id);
    queueMicrotask(syncForm);
  }

  async function saveSupply() {
    const min = Number(minimumStock);
    const commissionValue = Number(commission);
    if (!viewState.selected || viewState.selected.type !== 'product') return;
    if (
      !Number.isFinite(min) ||
      min < 0 ||
      !Number.isFinite(commissionValue) ||
      commissionValue < 0 ||
      commissionValue > 100
    ) {
      return;
    }
    await saveInventoryConfig({
      fulfillmentModel: fulfillment,
      minimumStock: min,
      commissionPercent: commissionValue,
      supplierName: supplier.trim() || null,
      externalAvailability: availability
    });
    syncForm();
  }

  async function submitOp() {
    const qty = Number(quantity);
    const cost = Number(unitCost);
    const price = Number(salePrice);
    if (!viewState.selected || viewState.selected.type !== 'product' || !Number.isFinite(qty) || qty <= 0)
      return;
    if (operation === 'purchase' && (!Number.isFinite(cost) || cost < 0)) return;
    if (operation === 'sale' && (!Number.isFinite(price) || price < 0)) return;
    await submitInventoryOperation(operation, qty, cost, price);
    syncForm();
  }

  function modelLabel(m: InventoryItem['fulfillmentModel']) {
    return m === 'managed_sale' ? 'Venta gestionada' : 'Stock propio';
  }

  onMount(async () => {
    await loadInventory();
    syncForm();
  });

  $effect(() => {
    if (viewState.selected) syncForm();
  });
</script>

<svelte:head>
  <title>Proveedores e inventario | SOLUX</title>
</svelte:head>

<div class="page">
  <header class="page-header">
    <div>
      <p class="eyebrow">Backoffice</p>
      <h1>Proveedores e inventario</h1>
      <p class="muted">
        Stock propio, venta gestionada con comisión y operaciones de compra/venta.
      </p>
    </div>
    <button type="button" class="btn secondary" onclick={() => loadInventory()} disabled={viewState.loading}>
      {viewState.loading ? 'Cargando…' : 'Actualizar'}
    </button>
  </header>

  {#if viewState.error}
    <div class="alert" role="alert">{viewState.error}</div>
  {/if}
  {#if viewState.notice}
    <div class="notice" role="status">{viewState.notice}</div>
  {/if}

  <div class="stats">
    <article>
      <span>Productos</span>
      <strong>{stats.total}</strong>
    </article>
    <article>
      <span>Stock propio</span>
      <strong>{stats.owned}</strong>
    </article>
    <article>
      <span>Venta gestionada</span>
      <strong>{stats.managed}</strong>
    </article>
    <article>
      <span>Bajo mínimo</span>
      <strong class:warn={stats.lowStock > 0}>{stats.lowStock}</strong>
    </article>
  </div>

  <div class="layout">
    <section class="panel list-panel">
      <div class="toolbar">
        <input type="search" placeholder="Buscar producto o proveedor…" bind:value={search} />
        <div class="chips" role="tablist">
          <button type="button" class="chip" class:active={filter === 'all'} onclick={() => (filter = 'all')}>
            Todos
          </button>
          <button
            type="button"
            class="chip"
            class:active={filter === 'owned_stock'}
            onclick={() => (filter = 'owned_stock')}
          >
            Stock propio
          </button>
          <button
            type="button"
            class="chip"
            class:active={filter === 'managed_sale'}
            onclick={() => (filter = 'managed_sale')}
          >
            Gestionados
          </button>
        </div>
      </div>

      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Producto</th>
              <th>Modelo</th>
              <th>Proveedor</th>
              <th>Comisión</th>
              <th>Stock</th>
            </tr>
          </thead>
          <tbody>
            {#each filtered as item (item.id)}
              <tr
                class:selected={viewState.selected?.id === item.id}
                onclick={() => changeSelection(item.id)}
              >
                <td>
                  <strong>{item.name}</strong>
                  {#if !item.isActive}<span class="badge off">Inactivo</span>{/if}
                </td>
                <td>
                  <span class="badge" class:managed={item.fulfillmentModel === 'managed_sale'}>
                    {modelLabel(item.fulfillmentModel)}
                  </span>
                </td>
                <td>{item.supplierName || '—'}</td>
                <td>
                  {#if item.fulfillmentModel === 'managed_sale'}
                    {item.commissionPercent}%
                  {:else}
                    —
                  {/if}
                </td>
                <td>
                  {#if item.fulfillmentModel === 'owned_stock'}
                    {item.stockQuantity}
                    {#if item.stockQuantity <= item.minimumStock}
                      <span class="badge warn">Bajo</span>
                    {/if}
                  {:else}
                    <span class="muted-sm">{item.externalAvailability}</span>
                  {/if}
                </td>
              </tr>
            {:else}
              <tr>
                <td colspan="5" class="empty">Sin productos en este filtro</td>
              </tr>
            {/each}
          </tbody>
        </table>
      </div>
    </section>

    <div class="side">
      {#if viewState.selected && viewState.selected.type === 'product'}
        <section class="panel">
          <h2>Proveedor y comisión</h2>
          <p class="muted sm">
            {viewState.selected.name}
          </p>
          <div class="form-grid">
            <label>
              Modelo de abastecimiento
              <select bind:value={fulfillment}>
                <option value="owned_stock">Stock propio</option>
                <option value="managed_sale">Venta gestionada (comisión)</option>
              </select>
            </label>
            <label>
              Nombre del proveedor
              <input bind:value={supplier} placeholder="Ej. Distribuidora X" />
            </label>
            {#if fulfillment === 'managed_sale'}
              <label>
                Comisión SOLUX (%)
                <input type="number" min="0" max="100" step="0.1" bind:value={commission} />
              </label>
              <label>
                Disponibilidad externa
                <select bind:value={availability}>
                  <option value="available">Disponible</option>
                  <option value="unavailable">No disponible</option>
                  <option value="unknown">Desconocida</option>
                </select>
              </label>
            {:else}
              <label>
                Stock mínimo
                <input type="number" min="0" step="0.001" bind:value={minimumStock} />
              </label>
              <label>
                Costo adquisición (ref.)
                <input type="number" min="0" step="0.01" bind:value={unitCost} />
              </label>
            {/if}
          </div>
          <div class="metrics">
            <div>
              <span>Stock actual</span>
              <strong>{viewState.selected.stockQuantity}</strong>
            </div>
            <div>
              <span>Costo promedio</span>
              <strong>{Number(viewState.selected.averageCost).toFixed(2)}</strong>
            </div>
            <div>
              <span>Precio lista</span>
              <strong
                >{viewState.selected.price != null
                  ? Number(viewState.selected.price).toFixed(2)
                  : '—'}</strong
              >
            </div>
          </div>
          <button type="button" disabled={viewState.saving} onclick={saveSupply}>
            {viewState.saving ? 'Guardando…' : 'Guardar configuración'}
          </button>
        </section>

        <section class="panel">
          <h2>Operación</h2>
          <div class="form-grid">
            <label>
              Tipo
              <select bind:value={operation}>
                <option value="purchase">Compra (entra stock)</option>
                <option value="sale">Venta</option>
              </select>
            </label>
            <label>
              Cantidad
              <input type="number" min="0.001" step="0.001" bind:value={quantity} />
            </label>
            {#if operation === 'purchase'}
              <label>
                Costo unitario
                <input type="number" min="0" step="0.01" bind:value={unitCost} />
              </label>
            {:else}
              <label>
                Precio unitario de venta
                <input type="number" min="0" step="0.01" bind:value={salePrice} />
              </label>
            {/if}
          </div>
          <p class="hint">
            {#if operation === 'sale' && fulfillment === 'managed_sale'}
              En venta gestionada se registra la comisión ({commission}%) y el importe del proveedor.
            {:else if operation === 'purchase'}
              La compra actualiza stock y costo promedio ponderado.
            {:else}
              La venta descuenta stock propio y registra el cargo.
            {/if}
          </p>
          <button type="button" class="secondary" disabled={viewState.saving} onclick={submitOp}>
            {viewState.saving ? 'Procesando…' : 'Registrar operación'}
          </button>
        </section>
      {:else}
        <section class="panel empty-detail">
          <p class="muted">Selecciona un producto para configurar proveedor, comisión u operar stock.</p>
        </section>
      {/if}

      {#if viewState.lowStock.length}
        <section class="panel">
          <h2>Bajo mínimo</h2>
          <div class="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Producto</th>
                  <th>Stock</th>
                  <th>Mín.</th>
                </tr>
              </thead>
              <tbody>
                {#each viewState.lowStock as item}
                  <tr>
                    <td>{item.name}</td>
                    <td>{item.stockQuantity}</td>
                    <td>{item.minimumStock}</td>
                  </tr>
                {/each}
              </tbody>
            </table>
          </div>
        </section>
      {/if}
    </div>
  </div>
</div>

<style>
  .page {
    padding: clamp(20px, 4vw, 40px);
    max-width: 1280px;
    margin: 0 auto;
    color: var(--color-text);
  }
  .page-header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 20px;
    margin-bottom: 22px;
  }
  h1 {
    font-size: clamp(26px, 3vw, 34px);
    margin: 4px 0 8px;
    letter-spacing: -0.03em;
  }
  h2 {
    font-size: 16px;
    margin: 0 0 12px;
  }
  .eyebrow {
    font-size: 11px;
    text-transform: uppercase;
    letter-spacing: 0.12em;
    color: var(--color-primary);
    font-weight: 800;
    margin: 0;
  }
  .muted {
    color: var(--color-muted);
    font-size: 13px;
    line-height: 1.5;
    margin: 0;
  }
  .muted.sm {
    margin-bottom: 14px;
  }
  .muted-sm {
    font-size: 12px;
    color: var(--color-muted);
  }
  .stats {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 12px;
    margin-bottom: 18px;
  }
  .stats article {
    padding: 14px 16px;
    border: 1px solid var(--color-border);
    border-radius: 12px;
    background: var(--color-surface);
    display: flex;
    flex-direction: column;
    gap: 6px;
  }
  .stats span {
    font-size: 12px;
    color: var(--color-muted);
  }
  .stats strong {
    font-size: 22px;
  }
  .stats strong.warn {
    color: #b45309;
  }
  .layout {
    display: grid;
    grid-template-columns: 1.2fr 0.9fr;
    gap: 16px;
    align-items: start;
  }
  .panel {
    background: var(--color-surface);
    border: 1px solid var(--color-border);
    border-radius: 14px;
    padding: 18px;
    margin-bottom: 16px;
  }
  .list-panel {
    margin-bottom: 0;
  }
  .toolbar {
    display: flex;
    flex-direction: column;
    gap: 10px;
    margin-bottom: 14px;
  }
  .toolbar input[type='search'] {
    width: 100%;
    box-sizing: border-box;
    padding: 10px 12px;
    border: 1px solid var(--color-border);
    border-radius: 10px;
    background: var(--color-bg, var(--color-background));
    color: var(--color-text);
    font: inherit;
  }
  .chips {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
  }
  .chip {
    border: 1px solid var(--color-border);
    background: var(--color-bg, transparent);
    color: var(--color-muted);
    border-radius: 999px;
    padding: 6px 12px;
    font-size: 12px;
    font-weight: 700;
    cursor: pointer;
  }
  .chip.active {
    background: var(--color-primary);
    border-color: var(--color-primary);
    color: white;
  }
  .table-wrap {
    overflow: auto;
  }
  table {
    width: 100%;
    border-collapse: collapse;
    text-align: left;
  }
  th,
  td {
    padding: 10px 8px;
    border-bottom: 1px solid var(--color-border);
    font-size: 13px;
  }
  tbody tr {
    cursor: pointer;
  }
  tbody tr:hover {
    background: color-mix(in srgb, var(--color-primary) 6%, transparent);
  }
  tbody tr.selected {
    background: color-mix(in srgb, var(--color-primary) 12%, transparent);
  }
  .badge {
    display: inline-block;
    font-size: 10px;
    font-weight: 800;
    text-transform: uppercase;
    letter-spacing: 0.04em;
    padding: 2px 8px;
    border-radius: 999px;
    background: var(--color-surface-2, var(--color-border));
    color: var(--color-muted);
  }
  .badge.managed {
    background: color-mix(in srgb, var(--color-primary) 14%, transparent);
    color: var(--color-primary);
  }
  .badge.warn {
    background: #fef3c7;
    color: #b45309;
  }
  .badge.off {
    background: #e5e7eb;
    color: #6b7280;
  }
  .empty {
    text-align: center;
    color: var(--color-muted);
    padding: 24px !important;
  }
  .empty-detail {
    min-height: 120px;
    display: grid;
    place-items: center;
  }
  .form-grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 12px;
    margin: 12px 0;
  }
  label {
    display: flex;
    flex-direction: column;
    gap: 6px;
    font-size: 12px;
    font-weight: 700;
  }
  input,
  select {
    width: 100%;
    min-width: 0;
    box-sizing: border-box;
    padding: 10px 12px;
    border: 1px solid var(--color-border);
    border-radius: 8px;
    background: var(--color-bg, var(--color-background));
    color: var(--color-text);
    font: inherit;
    font-weight: 400;
  }
  .metrics {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 10px;
    margin: 14px 0;
  }
  .metrics > div {
    padding: 12px;
    border: 1px solid var(--color-border);
    border-radius: 10px;
    display: flex;
    flex-direction: column;
    gap: 4px;
  }
  .metrics span {
    font-size: 11px;
    color: var(--color-muted);
  }
  .metrics strong {
    font-size: 16px;
  }
  .hint {
    margin: 0 0 12px;
    font-size: 12px;
    color: var(--color-muted);
    line-height: 1.45;
  }
  button,
  .btn {
    border: 0;
    border-radius: 8px;
    padding: 11px 16px;
    background: var(--color-primary);
    color: white;
    font-weight: 750;
    cursor: pointer;
    font: inherit;
  }
  button:disabled {
    opacity: 0.55;
    cursor: not-allowed;
  }
  button.secondary,
  .btn.secondary {
    background: var(--color-surface-2, var(--color-surface));
    color: var(--color-text);
    border: 1px solid var(--color-border);
  }
  .alert,
  .notice {
    padding: 12px 14px;
    border-radius: 8px;
    margin: 0 0 16px;
    font-size: 13px;
  }
  .alert {
    background: #fee2e2;
    color: #991b1b;
  }
  .notice {
    background: #dcfce7;
    color: #166534;
  }
  @media (max-width: 960px) {
    .layout {
      grid-template-columns: 1fr;
    }
    .stats {
      grid-template-columns: repeat(2, 1fr);
    }
  }
  @media (max-width: 600px) {
    .stats,
    .form-grid,
    .metrics {
      grid-template-columns: 1fr;
    }
    .page-header {
      flex-direction: column;
    }
  }
</style>
