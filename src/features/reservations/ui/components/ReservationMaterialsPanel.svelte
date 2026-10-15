<script lang="ts">
  import { onMount } from 'svelte';
  import { supabase } from '$infrastructure/data/supabase-client';

  type Product = { id: string; name: string; sku: string | null; category: string; unit: string; default_cost: number; default_markup_percent: number; is_active: boolean };
  type Material = { id: string; product_id: string | null; product_name: string; unit: string; quantity: number; unit_cost: number; adjustment_type: 'markup' | 'discount' | 'none'; adjustment_percent: number; notes: string };
  let { reservationId } = $props<{ reservationId: string }>();
  let products = $state<Product[]>([]);
  let materials = $state<Material[]>([]);
  let loading = $state(false);
  let saving = $state(false);
  let error = $state('');
  let selectedProduct = $state('');
  let quantity = $state('1');
  let cost = $state('0');
  let adjustmentType = $state<'markup' | 'discount' | 'none'>('markup');
  let adjustmentPercent = $state('0');
  let notes = $state('');

  const total = $derived(materials.reduce((sum, m) => sum + lineTotal(m), 0));
  function lineTotal(m: Material) {
    const factor = m.adjustment_type === 'markup' ? 1 + Number(m.adjustment_percent) / 100 : m.adjustment_type === 'discount' ? 1 - Number(m.adjustment_percent) / 100 : 1;
    return Math.round(Number(m.quantity) * Number(m.unit_cost) * factor * 100) / 100;
  }
  function money(value: number) { return new Intl.NumberFormat('es-US', { style: 'currency', currency: 'USD' }).format(value); }

  async function load() {
    loading = true; error = '';
    const [p, m] = await Promise.all([
      supabase.from('consumable_products').select('id,name,sku,category,unit,default_cost,default_markup_percent,is_active').eq('is_active', true).order('name'),
      supabase.from('reservation_materials').select('*').eq('reservation_id', reservationId).order('created_at')
    ]);
    if (p.error || m.error) error = p.error?.message ?? m.error?.message ?? 'Error cargando materiales';
    products = (p.data ?? []) as Product[];
    materials = (m.data ?? []) as Material[];
    loading = false;
  }

  function chooseProduct(id: string) {
    selectedProduct = id;
    const p = products.find((item) => item.id === id);
    if (p) { cost = String(p.default_cost); adjustmentPercent = String(p.default_markup_percent); adjustmentType = p.default_markup_percent > 0 ? 'markup' : 'none'; }
  }

  async function addMaterial() {
    const p = products.find((item) => item.id === selectedProduct);
    if (!p) { error = 'Selecciona un consumible del catálogo'; return; }
    if (!(Number(quantity) > 0) || !(Number(cost) >= 0) || !(Number(adjustmentPercent) >= 0)) { error = 'Revisa cantidad, costo y porcentaje'; return; }
    saving = true; error = '';
    const { error: saveError } = await supabase.from('reservation_materials').insert({
      reservation_id: reservationId, product_id: p.id, product_name: p.name, unit: p.unit,
      quantity: Number(quantity), unit_cost: Number(cost), adjustment_type: adjustmentType,
      adjustment_percent: adjustmentType === 'none' ? 0 : Number(adjustmentPercent), notes
    });
    if (saveError) error = saveError.message;
    else { quantity = '1'; notes = ''; await load(); }
    saving = false;
  }

  async function removeMaterial(id: string) {
    const { error: removeError } = await supabase.from('reservation_materials').delete().eq('id', id);
    if (removeError) error = removeError.message;
    else await load();
  }

  onMount(load);
</script>

<section class="materials-panel">
  <header><div><p class="eyebrow">Costos de ejecución</p><h3>Materiales consumibles</h3><p class="hint">Discos, electrodos, tornillos, canaletas, brocas y otros insumos.</p></div><button type="button" class="secondary" onclick={load} disabled={loading}>Actualizar</button></header>
  {#if error}<p class="error" role="alert">{error}</p>{/if}
  <div class="add-grid">
    <label>Consumible del catálogo
      <select value={selectedProduct} onchange={(e) => chooseProduct(e.currentTarget.value)}>
        <option value="">Seleccionar producto…</option>
        {#each products as p}<option value={p.id}>{p.name} · {p.unit}</option>{/each}
      </select>
    </label>
    <label>Cantidad<input type="number" min="0.001" step="0.001" bind:value={quantity} /></label>
    <label>Costo unitario<input type="number" min="0" step="0.01" bind:value={cost} /></label>
    <label>Ajuste<select bind:value={adjustmentType}><option value="none">Sin ajuste</option><option value="markup">Sobrecargo</option><option value="discount">Descuento</option></select></label>
    <label>Porcentaje<input type="number" min="0" max="1000" step="0.1" bind:value={adjustmentPercent} disabled={adjustmentType === 'none'} /></label>
    <label>Nota (opcional)<input bind:value={notes} placeholder="Uso o detalle del material" /></label>
  </div>
  <button type="button" class="primary" onclick={addMaterial} disabled={saving || !selectedProduct}>{saving ? 'Guardando…' : 'Agregar material al trabajo'}</button>
  {#if products.length === 0}<p class="hint">Catálogo vacío. Crea consumibles desde Backoffice → Consumibles.</p>{/if}
  <div class="table-wrap">
    {#if materials.length === 0}<p class="empty">{loading ? 'Cargando…' : 'Todavía no hay materiales registrados en este trabajo.'}</p>
    {:else}
      <table><thead><tr><th>Material</th><th>Cant.</th><th>Costo unit.</th><th>Ajuste</th><th>Total</th><th></th></tr></thead><tbody>
        {#each materials as m (m.id)}
          <tr><td><strong>{m.product_name}</strong>{#if m.notes}<small>{m.notes}</small>{/if}</td><td>{m.quantity} {m.unit}</td><td>{money(Number(m.unit_cost))}</td><td>{m.adjustment_type === 'none' ? '—' : (m.adjustment_type === 'markup' ? '+' : '−') + m.adjustment_percent + '%'}</td><td>{money(lineTotal(m))}</td><td><button class="remove" type="button" onclick={() => removeMaterial(m.id)} aria-label="Eliminar material">Eliminar</button></td></tr>
        {/each}
      </tbody></table>
    {/if}
  </div>
  <footer><span>Total materiales</span><strong>{money(total)}</strong></footer>
  <div class="actions"><button type="button" class="secondary" onclick={() => window.print()}>Imprimir resumen</button><small>El importe se calcula con costo unitario, cantidad y ajuste.</small></div>
</section>

<style>
  .materials-panel{border:1px solid var(--color-border);border-radius:14px;padding:18px;margin-top:20px;background:var(--color-surface);color:var(--color-text)}
  header{display:flex;justify-content:space-between;align-items:flex-start;gap:12px;margin-bottom:18px}h3{margin:4px 0;font-size:18px}.eyebrow{margin:0;color:var(--color-primary);font-size:10px;font-weight:800;letter-spacing:.12em;text-transform:uppercase}.hint,small{color:var(--color-muted);font-size:12px}.add-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px;margin-bottom:14px}label{display:grid;gap:6px;font-size:12px;font-weight:700}input,select{min-width:0;width:100%;padding:9px;border:1px solid var(--color-border);border-radius:8px;background:var(--color-background);color:inherit}.primary,.secondary,.remove{border:0;border-radius:8px;padding:10px 12px;font-weight:700;cursor:pointer}.primary{background:var(--color-primary);color:white}.secondary{background:var(--color-surface-2);color:inherit}.remove{background:transparent;color:var(--color-danger,#b42318);padding:5px}.error{color:#b42318;font-size:13px}.table-wrap{overflow-x:auto;margin-top:16px}table{width:100%;border-collapse:collapse;font-size:12px;text-align:left}th,td{padding:10px 8px;border-bottom:1px solid var(--color-border);white-space:nowrap}td:first-child{white-space:normal}td small{display:block;margin-top:3px}.empty{font-size:13px;color:var(--color-muted);padding:12px 0}footer{display:flex;justify-content:space-between;align-items:center;padding:14px 0;font-size:14px}.actions{display:flex;align-items:center;gap:12px;flex-wrap:wrap}@media(max-width:800px){.add-grid{grid-template-columns:repeat(2,minmax(0,1fr))}}@media(max-width:520px){.add-grid{grid-template-columns:1fr}}
</style>