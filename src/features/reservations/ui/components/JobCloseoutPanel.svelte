<script lang="ts">
  import { onMount } from 'svelte';
  import { reservationWorkUseCases } from '$features/reservations/di';
  import { publicContactUseCases } from '$features/contact/di/public-contact';
  import { getAuthUser } from '$features/auth/ui/stores/auth.store.svelte';

  type Material = { product_name: string; unit: string; quantity: number; unit_cost: number; adjustment_type: 'markup' | 'discount' | 'none'; adjustment_percent: number; notes: string };
  type Labor = { role_description: string; hours: number; agreed_amount: number; status: string };
  type Closeout = { id: string; material_cost: number; materials_charge: number; labor_cost: number; labor_charge: number; other_charge: number; total_charge: number; estimated_margin: number; notes: string; closed_at: string };
  let { reservationId, status, customerName, customerEmail, customerPhone, serviceCategory, address, onClosed } = $props<{ reservationId: string; status: string; customerName: string; customerEmail: string; customerPhone: string; serviceCategory: string; address: string; onClosed?: () => void }>();
  let materials = $state<Material[]>([]);
  let labor = $state<Labor[]>([]);
  let closeout = $state<Closeout | null>(null);
  let laborCharge = $state('0');
  let otherCharge = $state('0');
  let notes = $state('');
  let loading = $state(true);
  let saving = $state(false);
  let error = $state('');
  let notice = $state('');
  let companyName = $state('SOLUX');
  let logoUrl = $state('');
  let issuer = $state<{ fullName: string; email: string; phone: string } | null>(null);

  const materialCost = $derived(materials.reduce((sum,m) => sum + Math.round(Number(m.quantity) * Number(m.unit_cost) * 100) / 100, 0));
  const materialsCharge = $derived(materials.reduce((sum,m) => {
    const factor = m.adjustment_type === 'markup' ? 1 + Number(m.adjustment_percent)/100 : m.adjustment_type === 'discount' ? 1 - Number(m.adjustment_percent)/100 : 1;
    return sum + Math.round(Number(m.quantity) * Number(m.unit_cost) * factor * 100)/100;
  }, 0));
  const laborCost = $derived(labor.filter((x) => x.status !== 'cancelled').reduce((sum,x) => sum + Number(x.agreed_amount), 0));
  const totalCharge = $derived(materialsCharge + Math.max(0, Number(laborCharge)||0) + Math.max(0, Number(otherCharge)||0));
  const margin = $derived(totalCharge - materialCost - laborCost);
  const money = (value: number) => new Intl.NumberFormat('es-US',{style:'currency',currency:'USD'}).format(value);

  async function load() {
    loading = true; error = '';
    try {
      const data = await reservationWorkUseCases.getCloseoutData.execute(reservationId);
      materials = data.materials as Material[];
      labor = data.labor as Labor[];
      closeout = data.closeout as Closeout | null;
      if (closeout) {
        laborCharge = String(closeout.labor_charge);
        otherCharge = String(closeout.other_charge);
        notes = closeout.notes;
      }
    } catch (e) {
      error = e instanceof Error ? e.message : 'No se pudo cargar cierre';
    } finally {
      loading = false;
    }
  }

  async function closeJob() {
    if (Number(laborCharge) < 0 || Number(otherCharge) < 0 || !Number.isFinite(Number(laborCharge)) || !Number.isFinite(Number(otherCharge))) {
      error = 'Importes de mano de obra facturada y cargos adicionales deben ser cero o positivos.';
      return;
    }
    saving = true; error = ''; notice = '';
    try {
      await reservationWorkUseCases.closeJob.execute({
        operationKey: crypto.randomUUID(),
        reservationId,
        laborCharge: Number(laborCharge),
        otherCharge: Number(otherCharge),
        notes: notes.trim()
      });
      notice = 'Trabajo cerrado. Cargo de cliente registrado; no implica que haya sido cobrado.';
      await load();
      onClosed?.();
    } catch (e) {
      error = e instanceof Error ? e.message : 'No se pudo cerrar el trabajo';
    } finally {
      saving = false;
    }
  }

  async function loadInvoiceBranding() {
    const data = await publicContactUseCases.getCompanyProfile.execute();
    companyName = data?.name || 'SOLUX';
    logoUrl = data?.logo_url || '';
    const user = getAuthUser();
    issuer = user ? { fullName: user.fullName, email: user.email, phone: user.phone || '' } : null;
  }

  onMount(() => { load(); loadInvoiceBranding(); });
</script>

<section class="closeout">
  <header><div><p class="eyebrow">Cierre financiero</p><h3>{closeout ? 'Resumen del trabajo cerrado' : 'Cerrar trabajo'}</h3></div><button class="secondary" onclick={load} disabled={loading}>Actualizar</button></header>
  {#if error}<p class="error" role="alert">{error}</p>{/if}
  {#if notice}<p class="notice" role="status">{notice}</p>{/if}
  {#if loading}<p class="muted">Calculando costos…</p>
  {:else if closeout}
    <div class="totals">
      <article><span>Costo materiales</span><strong>{money(Number(closeout.material_cost))}</strong></article>
      <article><span>Venta materiales</span><strong>{money(Number(closeout.materials_charge))}</strong></article>
      <article><span>Costo mano de obra</span><strong>{money(Number(closeout.labor_cost))}</strong></article>
      <article><span>Cargo final</span><strong>{money(Number(closeout.total_charge))}</strong></article>
      <article><span>Margen estimado</span><strong>{money(Number(closeout.estimated_margin))}</strong></article>
    </div>
    <p class="muted">Cerrado {new Date(closeout.closed_at).toLocaleString()}. Cargo de cliente pendiente de cobro desde Finanzas.</p>
    <button class="print-button" type="button" onclick={() => window.print()}>Imprimir factura final</button>
    <div class="final-invoice">
      <div class="invoice-top"><div class="invoice-branding">{#if logoUrl}<img class="company-logo" src={logoUrl} alt={`Logo de ${companyName}`} />{:else}<p class="brand">{companyName}</p>{/if}<p class="subtitle">SERVICIOS TÉCNICOS</p></div><div class="invoice-title"><h2>FACTURA FINAL</h2><p>Trabajo completado</p></div></div>
      <div class="invoice-meta">
        <div><span>Cliente</span><strong>{customerName || '—'}</strong><small>{customerEmail}</small><small>{customerPhone}</small></div>
        <div><span>Factura / trabajo</span><strong>{closeout.id.slice(0,8).toUpperCase()}</strong><small>{serviceCategory}</small><small>{address}</small></div>
        <div><span>Fecha de emisión</span><strong>{new Date(closeout.closed_at).toLocaleDateString('es-US')}</strong><small>Referencia: {reservationId}</small></div>
      </div>
      <h4>Detalle de mano de obra registrada</h4>
      <table class="invoice-lines"><thead><tr><th>Concepto / función</th><th>Horas</th><th>Estado</th></tr></thead><tbody>
        {#each labor.filter((x) => x.status !== 'cancelled') as item (item.role_description)}
          <tr><td>{item.role_description}</td><td>{Number(item.hours).toLocaleString('es-US')}</td><td>{item.status === 'paid' ? 'Pagada' : item.status === 'partially_paid' ? 'Pago parcial' : 'Devengada'}</td></tr>
        {/each}
        {#if labor.filter((x) => x.status !== 'cancelled').length === 0}<tr><td colspan="3">Sin mano de obra desglosada</td></tr>{/if}
      </tbody></table>
      <h4>Detalle facturado</h4>
      <table class="invoice-lines"><thead><tr><th>Concepto</th><th>Cantidad</th><th>Precio unitario</th><th>Importe</th></tr></thead><tbody>
        {#each materials as m (m.product_name + m.unit)}
          <tr><td>Material: {m.product_name}{#if m.notes}<small>{m.notes}</small>{/if}</td><td>{m.quantity} {m.unit}</td><td>{money(Number(m.unit_cost))}</td><td>{money(Number(m.quantity) * Number(m.unit_cost) * (m.adjustment_type === 'markup' ? 1 + Number(m.adjustment_percent)/100 : m.adjustment_type === 'discount' ? 1 - Number(m.adjustment_percent)/100 : 1))}</td></tr>
        {/each}
        {#if Number(closeout.labor_charge) > 0}<tr><td>Mano de obra</td><td>1</td><td>{money(Number(closeout.labor_charge))}</td><td>{money(Number(closeout.labor_charge))}</td></tr>{/if}
        {#if Number(closeout.other_charge) > 0}<tr><td colspan="3">Cargos adicionales{#if closeout.notes}<small>{closeout.notes}</small>{/if}</td><td>{money(Number(closeout.other_charge))}</td></tr>{/if}
      </tbody></table>
      <div class="invoice-total"><span>TOTAL FACTURADO</span><strong>{money(Number(closeout.total_charge))}</strong></div>
      <div class="invoice-footer"><p>Estado de pago: <strong>Consultar Finanzas</strong></p><p>Esta factura acredita el cargo registrado, no el pago. Los pagos se registran en Finanzas.</p></div>
    </div>
  {:else if status === 'in_progress'}
    <p class="muted">Cierre atómico: registra cargo pendiente, guarda costos y cambia reserva a Completada. El margen es estimado y no descuenta gastos generales.</p>
    <div class="totals">
      <article><span>Costo materiales</span><strong>{money(materialCost)}</strong></article>
      <article><span>Cargo materiales</span><strong>{money(materialsCharge)}</strong></article>
      <article><span>Costo mano de obra acordada</span><strong>{money(laborCost)}</strong></article>
      <article><span>Cargo total previsto</span><strong>{money(totalCharge)}</strong></article>
      <article><span>Margen previsto</span><strong>{money(margin)}</strong></article>
    </div>
    <div class="form-grid">
      <label>Mano de obra facturada (USD)<input type="number" min="0" step="0.01" bind:value={laborCharge} /></label>
      <label>Cargos adicionales (USD)<input type="number" min="0" step="0.01" bind:value={otherCharge} /></label>
      <label class="wide">Descripción del cargo / notas<input bind:value={notes} placeholder="Servicio, ajustes o referencia" /></label>
    </div>
    <button onclick={closeJob} disabled={saving}>{saving ? 'Cerrando…' : 'Cerrar trabajo y registrar cargo'}</button>
  {:else}
    <p class="muted">Este trabajo no está en curso. No se puede cerrar desde este estado.</p>
  {/if}
</section>

<style>
.final-invoice{display:none}
@page{size:auto;margin:12mm}
@media print{
  :global(body *){visibility:hidden!important}
  :global(body){margin:0!important;background:#fff!important}
  .final-invoice,.final-invoice *{visibility:visible!important}
  .final-invoice{display:block!important;position:absolute;top:0;left:0;width:100%;padding:0;box-sizing:border-box;background:#fff!important;color:#172033!important;font:11px Arial,sans-serif}
  .closeout{border:0!important;padding:0!important;margin:0!important;background:#fff!important;color:#172033!important}
  .closeout header,.closeout .totals,.closeout>.muted,.closeout>.error,.closeout>.notice,.print-button,.form-grid,.closeout>button{display:none!important}
  .invoice-top{display:flex;justify-content:space-between;align-items:flex-start;border-bottom:2px solid #172033;padding-bottom:16px;margin-bottom:22px}
  .invoice-branding{display:flex;flex-direction:column;align-items:flex-start;gap:5px}.company-logo{display:block;max-width:170px;max-height:64px;object-fit:contain;object-position:left center}.brand{font-size:28px;letter-spacing:3px;font-weight:800;margin:0;color:#172033}.subtitle{font-size:9px;letter-spacing:2px;margin:4px 0;color:#475467}
  .invoice-title{text-align:right}.invoice-title h2{font-size:19px;margin:0 0 5px;color:#172033}.invoice-title p{margin:0;color:#667085}
  .invoice-meta{display:grid;grid-template-columns:1.2fr 1fr 1fr;gap:14px;margin-bottom:24px}.invoice-meta span{display:block;color:#667085;font-size:9px;text-transform:uppercase;margin-bottom:5px}.invoice-meta strong,.invoice-meta small{display:block;margin-bottom:4px;overflow-wrap:anywhere}.invoice-meta small{color:#667085;font-size:10px}
  .final-invoice h4{font-size:10px;text-transform:uppercase;letter-spacing:.08em;margin:18px 0 8px;color:#344054}
  .invoice-lines{width:100%;border-collapse:collapse;table-layout:fixed;font-size:10px}
  .invoice-lines th{background:#f2f4f7!important;color:#344054!important;text-transform:uppercase;font-size:9px;letter-spacing:.03em}
  .invoice-lines th,.invoice-lines td{padding:9px 7px;border-bottom:1px solid #eaecf0;text-align:left;white-space:normal;overflow-wrap:anywhere;vertical-align:top}
  .invoice-lines th:nth-child(1){width:43%}.invoice-lines th:nth-child(2){width:15%}.invoice-lines th:nth-child(3){width:20%}.invoice-lines th:nth-child(4){width:22%;text-align:right}
  .invoice-lines td:last-child{text-align:right;font-weight:700}.invoice-lines small{display:block;color:#667085;margin-top:4px}
  .invoice-total{display:flex;justify-content:flex-end;align-items:center;gap:28px;padding:18px 7px;border-bottom:2px solid #172033;font-size:13px}.invoice-total strong{font-size:20px}
  .invoice-footer{margin-top:18px;padding-top:10px;border-top:1px solid #eaecf0;color:#667085;font-size:9px}
  tr{break-inside:avoid}
}
.closeout{border:1px solid var(--color-border);border-radius:14px;padding:18px;margin:0 28px 24px;background:var(--color-surface);color:var(--color-text)}
header{display:flex;justify-content:space-between;align-items:flex-start;gap:12px;margin-bottom:14px}h3{font-size:18px;margin:4px 0}.eyebrow{margin:0;color:var(--color-primary);font-size:10px;font-weight:800;letter-spacing:.12em;text-transform:uppercase}
.muted{color:var(--color-muted);font-size:12px;line-height:1.5}.error,.notice{padding:10px;border-radius:8px;font-size:12px}.error{background:#fee2e2;color:#991b1b}.notice{background:#dcfce7;color:#166534}
.totals{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px;margin:16px 0}.totals article{border:1px solid var(--color-border);border-radius:10px;padding:12px;display:flex;flex-direction:column;gap:7px}.totals span{font-size:11px;color:var(--color-muted)}.totals strong{font-size:16px}
.form-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px;margin:16px 0}label{display:grid;gap:6px;font-size:12px;font-weight:700}input{width:100%;box-sizing:border-box;padding:10px;border:1px solid var(--color-border);border-radius:8px;background:var(--color-background);color:var(--color-text)}.wide{grid-column:1/-1}
button{border:0;border-radius:8px;padding:10px 14px;background:var(--color-primary);color:white;font-weight:700;cursor:pointer}.secondary{background:var(--color-surface-2);color:var(--color-text);border:1px solid var(--color-border)}button:disabled{opacity:.55}
@media(max-width:620px){.totals,.form-grid{grid-template-columns:1fr}.wide{grid-column:auto}}
</style>
