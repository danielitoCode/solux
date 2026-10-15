<script lang="ts">
  import { onMount } from 'svelte';
  import { supabase } from '$infrastructure/data/supabase-client';
  import { getAuthUser } from '$features/auth/ui/stores/auth.store.svelte';

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
  let trackingCode = $state('');
  let companyName = $state('SOLUX');
  let logoUrl = $state('');
  let issuer = $state<{ fullName: string; email: string; phone: string } | null>(null);

  const total = $derived(materials.reduce((sum, m) => sum + lineTotal(m), 0));
  function lineTotal(m: Material) {
    const factor = m.adjustment_type === 'markup' ? 1 + Number(m.adjustment_percent) / 100 : m.adjustment_type === 'discount' ? 1 - Number(m.adjustment_percent) / 100 : 1;
    return Math.round(Number(m.quantity) * Number(m.unit_cost) * factor * 100) / 100;
  }
  function money(value: number) { return new Intl.NumberFormat('es-US', { style: 'currency', currency: 'USD' }).format(value); }

  async function load() {
    loading = true; error = '';
    const [p, m, r] = await Promise.all([
      supabase.from('consumable_products').select('id,name,sku,category,unit,default_cost,default_markup_percent,is_active').eq('is_active', true).order('name'),
      supabase.from('reservation_materials').select('*').eq('reservation_id', reservationId).order('created_at'),
      supabase.from('reservations').select('tracking_code').eq('id', reservationId).maybeSingle()
    ]);
    if (p.error || m.error) error = p.error?.message ?? m.error?.message ?? 'Error cargando materiales';
    products = (p.data ?? []) as Product[];
    materials = (m.data ?? []) as Material[];
    trackingCode = r.data?.tracking_code ?? '';
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
    const { error: saveError } = await supabase.rpc('add_reservation_material', {
      p_reservation_id: reservationId,
      p_product_id: p.id,
      p_quantity: Number(quantity),
      p_unit_cost: Number(cost),
      p_adjustment_type: adjustmentType,
      p_adjustment_percent: adjustmentType === 'none' ? 0 : Number(adjustmentPercent),
      p_notes: notes
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

  async function loadInvoiceBranding() {
    const { data } = await supabase.from('company_profile').select('name,logo_url').limit(1).maybeSingle();
    companyName = data?.name || 'SOLUX';
    logoUrl = data?.logo_url || '';
    const user = getAuthUser();
    issuer = user ? { fullName: user.fullName, email: user.email, phone: user.phone || '' } : null;
  }

  onMount(() => { load(); loadInvoiceBranding(); });
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
  <div class="invoice-print">
    <div class="invoice-top"><div class="invoice-branding">{#if logoUrl}<img class="company-logo" src={logoUrl} alt={`Logo de ${companyName}`} />{:else}<p class="invoice-brand">{companyName}</p>{/if}<p class="invoice-subtitle">SERVICIOS TÉCNICOS</p></div><div class="invoice-title"><h2>DETALLE DE MATERIALES</h2><p>Documento de consumo por trabajo</p></div></div>
    <div class="invoice-meta"><div><span>Referencia de trabajo</span><strong>{trackingCode || reservationId}</strong></div><div><span>Fecha de emisión</span><strong>{new Date().toLocaleDateString('es-US')}</strong></div><div><span>Estado</span><strong>En curso</strong></div></div>
    <table class="invoice-table"><thead><tr><th>Descripción</th><th>Cantidad</th><th>Costo unitario</th><th>Ajuste</th><th>Importe</th></tr></thead><tbody>
      {#each materials as m (m.id)}
        <tr><td>{m.product_name}{#if m.notes}<small>{m.notes}</small>{/if}</td><td>{m.quantity} {m.unit}</td><td>{money(Number(m.unit_cost))}</td><td>{m.adjustment_type === 'none' ? '—' : (m.adjustment_type === 'markup' ? '+' : '−') + m.adjustment_percent + '%'}</td><td>{money(lineTotal(m))}</td></tr>
      {/each}
    </tbody></table>
    <div class="invoice-total"><span>Total materiales</span><strong>{money(total)}</strong></div>
    <div class="issuer-contact"><strong>Emitido por</strong>{#if issuer}<b>{issuer.fullName}</b><span>{issuer.email}</span>{#if issuer.phone}<span>{issuer.phone}</span>{/if}{:else}<span>Datos del trabajador no disponibles</span>{/if}</div>\n    <p class="invoice-foot">Documento interno de materiales consumidos. No constituye factura final ni acredita pago.</p>
  </div>
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
  <div class="actions"><button type="button" class="secondary no-print" onclick={() => window.print()}>Imprimir documento</button><small>El importe se calcula con costo unitario, cantidad y ajuste.</small></div>
</section>

<style>
  .invoice-print{display:none}
@page{size:auto;margin:12mm}
@media print{
  :global(body *){visibility:hidden!important}
  :global(body){margin:0!important;background:#fff!important}
  .invoice-print,.invoice-print *{visibility:visible!important}
  .invoice-print{display:block!important;position:absolute;top:0;left:0;width:100%;padding:0;box-sizing:border-box;background:#fff!important;color:#172033!important;font:11px Arial,sans-serif}
  .invoice-print{display:none}
@page{size:auto;margin:12mm}
@media print{
  :global(body *){visibility:hidden!important}
  :global(body){margin:0!important;background:#fff!important}
  .invoice-print,.invoice-print *{visibility:visible!important}
  .invoice-print{display:block!important;position:absolute;top:0;left:0;width:100%;padding:0;box-sizing:border-box;background:#fff!important;color:#172033!important;font:11px Arial,sans-serif}
  .materials-panel{border:0!important;padding:0!important;margin:0!important;background:#fff!important;color:#172033!important}
  .materials-panel header,.add-grid,.primary,.table-wrap,.materials-panel footer,.actions,.error,.hint{display:none!important}
  .invoice-top{display:flex;justify-content:space-between;align-items:flex-start;border-bottom:2px solid #172033;padding-bottom:16px;margin-bottom:22px}
  .invoice-branding{display:flex;flex-direction:column;align-items:flex-start;gap:5px}.company-logo{display:block;max-width:170px;max-height:64px;object-fit:contain;object-position:left center}.invoice-brand{font-size:28px;letter-spacing:3px;font-weight:800;margin:0;color:#172033}.invoice-subtitle{font-size:9px;letter-spacing:2px;margin:4px 0;color:#475467}
  .invoice-title{text-align:right}.invoice-title h2{font-size:17px;margin:0 0 5px;color:#172033}.invoice-title p{margin:0;color:#667085}
  .invoice-meta{display:grid;grid-template-columns:2fr 1fr 1fr;gap:14px;margin-bottom:22px}.invoice-meta span{display:block;color:#667085;font-size:9px;text-transform:uppercase;margin-bottom:5px}.invoice-meta strong{font-size:11px;overflow-wrap:anywhere}
  .invoice-table{width:100%;border-collapse:collapse;table-layout:fixed;font-size:10px}
  .invoice-table th{background:#f2f4f7!important;color:#344054!important;text-transform:uppercase;font-size:9px;letter-spacing:.03em}
  .invoice-table th,.invoice-table td{padding:9px 7px;border-bottom:1px solid #eaecf0;text-align:left;white-space:normal;overflow-wrap:anywhere;vertical-align:top}
  .invoice-table th:nth-child(1){width:36%}.invoice-table th:nth-child(2){width:14%}.invoice-table th:nth-child(3){width:17%}.invoice-table th:nth-child(4){width:13%}.invoice-table th:nth-child(5){width:20%;text-align:right}
  .invoice-table td:last-child{text-align:right;font-weight:700}.invoice-table td small{display:block;color:#667085;margin-top:4px}
  .invoice-total{display:flex;justify-content:flex-end;align-items:center;gap:28px;padding:18px 7px;border-bottom:2px solid #172033;font-size:13px}.invoice-total strong{font-size:19px}
  .issuer-contact{margin-top:18px;padding:10px 12px;border:1px solid #eaecf0;border-radius:6px;display:flex;flex-direction:column;gap:4px;font-size:10px;break-inside:avoid}.issuer-contact span{color:#667085;overflow-wrap:anywhere}\n  .invoice-foot{margin-top:18px;padding-top:10px;border-top:1px solid #eaecf0;color:#667085;font-size:9px}
  tr{break-inside:avoid}
}
.materials-panel{border:0!important;padding:0!important;margin:0!important;background:#fff!important;color:#172033!important}
  .materials-panel header,.add-grid,.primary,.table-wrap,.materials-panel footer,.actions,.error,.hint{display:none!important}
  .invoice-top{display:flex;justify-content:space-between;align-items:flex-start;border-bottom:2px solid #172033;padding-bottom:16px;margin-bottom:22px}
  .invoice-brand{font-size:28px;letter-spacing:3px;font-weight:800;margin:0;color:#172033}.invoice-subtitle{font-size:9px;letter-spacing:2px;margin:4px 0;color:#475467}
  .invoice-title{text-align:right}.invoice-title h2{font-size:17px;margin:0 0 5px;color:#172033}.invoice-title p{margin:0;color:#667085}
  .invoice-meta{display:grid;grid-template-columns:2fr 1fr 1fr;gap:14px;margin-bottom:22px}.invoice-meta span{display:block;color:#667085;font-size:9px;text-transform:uppercase;margin-bottom:5px}.invoice-meta strong{font-size:11px;overflow-wrap:anywhere}
  .invoice-table{width:100%;border-collapse:collapse;table-layout:fixed;font-size:10px}
  .invoice-table th{background:#f2f4f7!important;color:#344054!important;text-transform:uppercase;font-size:9px;letter-spacing:.03em}
  .invoice-table th,.invoice-table td{padding:9px 7px;border-bottom:1px solid #eaecf0;text-align:left;white-space:normal;overflow-wrap:anywhere;vertical-align:top}
  .invoice-table th:nth-child(1){width:36%}.invoice-table th:nth-child(2){width:14%}.invoice-table th:nth-child(3){width:17%}.invoice-table th:nth-child(4){width:13%}.invoice-table th:nth-child(5){width:20%;text-align:right}
  .invoice-table td:last-child{text-align:right;font-weight:700}.invoice-table td small{display:block;color:#667085;margin-top:4px}
  .invoice-total{display:flex;justify-content:flex-end;align-items:center;gap:28px;padding:18px 7px;border-bottom:2px solid #172033;font-size:13px}.invoice-total strong{font-size:19px}
  .invoice-foot{margin-top:28px;padding-top:10px;border-top:1px solid #eaecf0;color:#667085;font-size:9px}
  tr{break-inside:avoid}
}
.materials-panel{border:1px solid var(--color-border);border-radius:14px;padding:18px;margin-top:20px;background:var(--color-surface);color:var(--color-text)}
  header{display:flex;justify-content:space-between;align-items:flex-start;gap:12px;margin-bottom:18px}h3{margin:4px 0;font-size:18px}.eyebrow{margin:0;color:var(--color-primary);font-size:10px;font-weight:800;letter-spacing:.12em;text-transform:uppercase}.hint,small{color:var(--color-muted);font-size:12px}.add-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px;margin-bottom:14px}label{display:grid;gap:6px;font-size:12px;font-weight:700}input,select{min-width:0;width:100%;padding:9px;border:1px solid var(--color-border);border-radius:8px;background:var(--color-background);color:inherit}.primary,.secondary,.remove{border:0;border-radius:8px;padding:10px 12px;font-weight:700;cursor:pointer}.primary{background:var(--color-primary);color:white}.secondary{background:var(--color-surface-2);color:inherit}.remove{background:transparent;color:var(--color-danger,#b42318);padding:5px}.error{color:#b42318;font-size:13px}.table-wrap{overflow-x:auto;margin-top:16px}table{width:100%;border-collapse:collapse;font-size:12px;text-align:left}th,td{padding:10px 8px;border-bottom:1px solid var(--color-border);white-space:nowrap}td:first-child{white-space:normal}td small{display:block;margin-top:3px}.empty{font-size:13px;color:var(--color-muted);padding:12px 0}footer{display:flex;justify-content:space-between;align-items:center;padding:14px 0;font-size:14px}.actions{display:flex;align-items:center;gap:12px;flex-wrap:wrap}@media(max-width:800px){.add-grid{grid-template-columns:repeat(2,minmax(0,1fr))}}@media(max-width:520px){.add-grid{grid-template-columns:1fr}}
</style>