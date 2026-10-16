<script lang="ts">
  import { onMount } from 'svelte';
  import { supabase } from '$infrastructure/data/supabase-client';

  type Item = {
    id: string;
    name: string;
    type: 'product' | 'service';
    price: number | null;
    currency: string;
    is_active: boolean;
    fulfillment_model: 'owned_stock' | 'managed_sale';
    stock_quantity: number;
    minimum_stock: number;
    acquisition_cost: number;
    average_cost: number;
    commission_percent: number;
    supplier_name: string | null;
    external_availability: 'available' | 'unavailable' | 'unknown';
  };

  let items = $state<Item[]>([]);
  let selectedId = $state('');
  let loading = $state(true);
  let saving = $state(false);
  let error = $state('');
  let notice = $state('');
  let operation = $state<'purchase' | 'sale'>('purchase');
  let quantity = $state('1');
  let unitCost = $state('0');
  let salePrice = $state('0');
  let minimumStock = $state('0');
  let fulfillment = $state<'owned_stock' | 'managed_sale'>('owned_stock');
  let commission = $state('0');
  let supplier = $state('');
  let availability = $state<'available' | 'unavailable' | 'unknown'>('unknown');

  const selected = $derived(items.find((item) => item.id === selectedId) ?? null);
  const lowStock = $derived(items.filter((item) => item.type === 'product' && item.fulfillment_model === 'owned_stock' && item.stock_quantity <= item.minimum_stock));

  async function load() {
    loading = true;
    error = '';
    const { data, error: queryError } = await supabase
      .from('catalog_items')
      .select('id,name,type,price,currency,is_active,fulfillment_model,stock_quantity,minimum_stock,acquisition_cost,average_cost,commission_percent,supplier_name,external_availability')
      .order('name');
    if (queryError) {
      error = queryError.message;
    } else {
      items = (data ?? []) as Item[];
      const products = items.filter((item) => item.type === 'product');
      if (!products.some((item) => item.id === selectedId)) selectedId = products[0]?.id ?? '';
      syncForm();
    }
    loading = false;
  }

  function syncForm() {
    if (!selected) return;
    fulfillment = selected.fulfillment_model;
    commission = String(selected.commission_percent);
    supplier = selected.supplier_name ?? '';
    availability = selected.external_availability;
    minimumStock = String(selected.minimum_stock);
    unitCost = String(selected.acquisition_cost);
    salePrice = String(selected.price ?? 0);
  }

  async function saveSupply() {
    if (saving || !selected || selected.type !== 'product') return;
    const min = Number(minimumStock);
    const commissionValue = Number(commission);
    if (!Number.isFinite(min) || min < 0 || !Number.isFinite(commissionValue) || commissionValue < 0 || commissionValue > 100) {
      error = 'Stock mínimo debe ser no negativo y comisión debe estar entre 0 y 100.';
      return;
    }
    saving = true;
    error = '';
    notice = '';
    try {
      const { error: updateError } = await supabase.from('catalog_items').update({
        fulfillment_model: fulfillment,
        minimum_stock: min,
        commission_percent: commissionValue,
        supplier_name: supplier.trim() || null,
        external_availability: availability
      }).eq('id', selected.id);
      if (updateError) throw updateError;
      await load();
      notice = 'Configuración de abastecimiento guardada.';
    } catch (e) {
      error = e instanceof Error ? e.message : 'No se pudo guardar configuración.';
    } finally {
      saving = false;
    }
  }

  async function submitOperation() {
    if (saving || !selected || selected.type !== 'product') return;
    const qty = Number(quantity);
    const cost = Number(unitCost);
    const price = Number(salePrice);
    if (!Number.isFinite(qty) || qty <= 0) {
      error = 'Cantidad debe ser mayor que cero.';
      return;
    }
    if (operation === 'purchase' && (!Number.isFinite(cost) || cost < 0)) {
      error = 'Costo unitario debe ser un número no negativo.';
      return;
    }
    if (operation === 'sale' && (!Number.isFinite(price) || price < 0)) {
      error = 'Precio unitario debe ser un número no negativo.';
      return;
    }
    saving = true;
    error = '';
    notice = '';
    try {
      const key = crypto.randomUUID();
      const result = operation === 'purchase'
        ? await supabase.rpc('receive_catalog_purchase', {
            p_operation_key: key,
            p_catalog_item_id: selected.id,
            p_quantity: qty,
            p_unit_cost: cost,
            p_description: 'Entrada de inventario desde backoffice'
          })
        : await supabase.rpc('record_catalog_sale', {
            p_operation_key: key,
            p_catalog_item_id: selected.id,
            p_quantity: qty,
            p_sale_unit_price: price,
            p_description: 'Venta registrada desde backoffice'
          });
      if (result.error) throw result.error;
      await load();
      notice = operation === 'purchase' ? 'Compra registrada y costo promedio actualizado.' : 'Venta registrada.';
    } catch (e) {
      error = e instanceof Error ? e.message : 'No se pudo registrar operación.';
    } finally {
      saving = false;
    }
  }

  onMount(load);
</script>

<svelte:head><title>Inventario y ventas | SOLUX</title></svelte:head>

<div class="page">
  <header>
    <div><p class="eyebrow">Backoffice / Finanzas</p><h1>Inventario y ventas</h1><p class="muted">Stock propio, productos gestionados y operaciones registradas.</p></div>
    <button class="secondary" onclick={load} disabled={loading}>Actualizar</button>
  </header>

  {#if error}<p class="alert" role="alert">{error}</p>{/if}
  {#if notice}<p class="notice" role="status">{notice}</p>{/if}

  <div class="stats">
    <article><span>Productos</span><strong>{items.filter((i) => i.type === 'product').length}</strong></article>
    <article><span>Stock bajo</span><strong>{lowStock.length}</strong></article>
    <article><span>Venta gestionada</span><strong>{items.filter((i) => i.type === 'product' && i.fulfillment_model === 'managed_sale').length}</strong></article>
  </div>

  <section class="panel">
    <h2>Producto</h2>
    {#if loading}<p>Cargando catálogo…</p>{:else}
      <label>Seleccionar producto
        <select bind:value={selectedId} onchange={syncForm}>
          {#each items.filter((i) => i.type === 'product') as item}
            <option value={item.id}>{item.name}{item.is_active ? '' : ' (inactivo)'}</option>
          {/each}
        </select>
      </label>
      {#if selected}
        <div class="metrics">
          <div><span>Stock</span><strong>{selected.stock_quantity}</strong></div>
          <div><span>Costo promedio</span><strong>{selected.average_cost.toFixed(2)} {selected.currency}</strong></div>
          <div><span>Precio de venta</span><strong>{selected.price ?? 'A consultar'} {selected.price != null ? selected.currency : ''}</strong></div>
        </div>
        <div class="form-grid">
          <label>Modelo de suministro
            <select bind:value={fulfillment}>
              <option value="owned_stock">Stock propio</option>
              <option value="managed_sale">Venta gestionada</option>
            </select>
          </label>
          <label>Stock mínimo
            <input type="number" min="0" step="0.001" bind:value={minimumStock} />
          </label>
          {#if fulfillment === 'managed_sale'}
            <label>Proveedor interno
              <input bind:value={supplier} placeholder="Nombre del proveedor" />
            </label>
            <label>Comisión Solux (%)
              <input type="number" min="0" max="100" step="0.001" bind:value={commission} />
            </label>
            <label>Disponibilidad externa
              <select bind:value={availability}>
                <option value="available">Disponible</option>
                <option value="unavailable">No disponible</option>
                <option value="unknown">Desconocida</option>
              </select>
            </label>
          {/if}
        </div>
        <button onclick={saveSupply} disabled={saving}>{saving ? 'Guardando…' : 'Guardar configuración'}</button>
        <p class="muted">Proveedor, comisión y modelo de suministro son datos internos; no aparecen en catálogo público.</p>
      {:else}
        <p>{items.some((item) => item.type === 'product') ? 'Selecciona un producto.' : 'No hay productos en catálogo.'}</p>
      {/if}
    {/if}
  </section>

  {#if selected}
    <section class="panel">
      <h2>Registrar operación</h2>
      <div class="form-grid">
        <label>Operación
          <select bind:value={operation}>
            <option value="purchase" disabled={selected.fulfillment_model === 'managed_sale'}>Entrada por compra</option>
            <option value="sale">Venta</option>
          </select>
        </label>
        <label>Cantidad
          <input type="number" min="0.001" step="0.001" bind:value={quantity} />
        </label>
        {#if operation === 'purchase'}
          <label>Costo unitario
            <input type="number" min="0" step="0.01" bind:value={unitCost} />
          </label>
        {:else}
          <label>Precio unitario de venta
            <input type="number" min="0" step="0.01" bind:value={salePrice} />
          </label>
        {/if}
      </div>
      <button onclick={submitOperation} disabled={saving || (operation === 'purchase' && selected.fulfillment_model === 'managed_sale')}>{saving ? 'Procesando…' : operation === 'purchase' ? 'Registrar compra y entrada' : 'Registrar venta'}</button>
      {#if operation === 'sale' && selected.fulfillment_model === 'managed_sale'}
        <p class="muted">La venta crea comisión y saldo de proveedor. No descuenta stock propio.</p>
      {/if}
    </section>
  {/if}

  <section class="panel">
    <h2>Alertas de stock</h2>
    {#if lowStock.length === 0}<p class="muted">Sin productos bajo mínimo.</p>{:else}
      <div class="table-wrap"><table><thead><tr><th>Producto</th><th>Stock</th><th>Mínimo</th></tr></thead><tbody>
        {#each lowStock as item}
          <tr><td>{item.name}</td><td>{item.stock_quantity}</td><td>{item.minimum_stock}</td></tr>
        {/each}
      </tbody></table></div>
    {/if}
  </section>
</div>

<style>
  .page{padding:clamp(20px,4vw,40px);max-width:1200px;margin:0 auto;color:var(--color-text)}
  header{display:flex;align-items:center;justify-content:space-between;gap:20px;margin-bottom:24px}
  h1{font-size:clamp(26px,3vw,36px);margin:4px 0 8px}h2{font-size:18px;margin:0 0 18px}
  .eyebrow{font-size:11px;text-transform:uppercase;letter-spacing:.12em;color:var(--color-primary);font-weight:800;margin:0}
  .muted{color:var(--color-muted);font-size:13px;line-height:1.5}
  .stats{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px;margin-bottom:16px}
  .stats article,.metrics>div{padding:16px;border:1px solid var(--color-border);border-radius:12px;display:flex;flex-direction:column;gap:8px}
  .stats span,.metrics span{font-size:12px;color:var(--color-muted)}.stats strong,.metrics strong{font-size:22px}
  .panel{background:var(--color-surface);border:1px solid var(--color-border);border-radius:14px;padding:22px;margin-bottom:16px}
  label{display:flex;flex-direction:column;gap:7px;font-size:13px;font-weight:650}
  input,select{width:100%;min-width:0;padding:10px 12px;border:1px solid var(--color-border);border-radius:8px;background:var(--color-background);color:var(--color-text)}
  .form-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:16px;margin:18px 0}
  .metrics{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px;margin:18px 0}
  button{border:0;border-radius:8px;padding:11px 16px;background:var(--color-primary);color:white;font-weight:750;cursor:pointer}
  button:disabled{opacity:.55;cursor:not-allowed}.secondary{background:var(--color-surface-2);color:var(--color-text);border:1px solid var(--color-border)}
  .alert,.notice{padding:12px 14px;border-radius:8px;margin:0 0 16px;font-size:13px}.alert{background:#fee2e2;color:#991b1b}.notice{background:#dcfce7;color:#166534}
  .table-wrap{overflow:auto}table{width:100%;border-collapse:collapse;text-align:left}th,td{padding:11px;border-bottom:1px solid var(--color-border);font-size:13px}
  @media(max-width:680px){header{align-items:flex-start;flex-direction:column}.stats,.metrics{grid-template-columns:1fr}.form-grid{grid-template-columns:1fr}}
</style>
