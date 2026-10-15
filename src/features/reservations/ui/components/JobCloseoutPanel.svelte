<script lang="ts">
  import { onMount } from 'svelte';
  import { supabase } from '$infrastructure/data/supabase-client';

  type Material = { quantity: number; unit_cost: number; adjustment_type: 'markup' | 'discount' | 'none'; adjustment_percent: number };
  type Labor = { agreed_amount: number; status: string };
  type Closeout = { id: string; material_cost: number; materials_charge: number; labor_cost: number; labor_charge: number; other_charge: number; total_charge: number; estimated_margin: number; notes: string; closed_at: string };
  let { reservationId, status, onClosed } = $props<{ reservationId: string; status: string; onClosed?: () => void }>();
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
    const [m,l,c] = await Promise.all([
      supabase.from('reservation_materials').select('quantity,unit_cost,adjustment_type,adjustment_percent').eq('reservation_id',reservationId),
      supabase.from('job_labor').select('agreed_amount,status').eq('reservation_id',reservationId),
      supabase.from('job_closeouts').select('id,material_cost,materials_charge,labor_cost,labor_charge,other_charge,total_charge,estimated_margin,notes,closed_at').eq('reservation_id',reservationId).maybeSingle()
    ]);
    if (m.error || l.error || c.error) error = m.error?.message || l.error?.message || c.error?.message || 'No se pudo cargar cierre';
    materials = (m.data ?? []) as Material[];
    labor = (l.data ?? []) as Labor[];
    closeout = c.data as Closeout | null;
    if (closeout) {
      laborCharge = String(closeout.labor_charge);
      otherCharge = String(closeout.other_charge);
      notes = closeout.notes;
    }
    loading = false;
  }

  async function closeJob() {
    if (Number(laborCharge) < 0 || Number(otherCharge) < 0 || !Number.isFinite(Number(laborCharge)) || !Number.isFinite(Number(otherCharge))) {
      error = 'Importes de mano de obra facturada y cargos adicionales deben ser cero o positivos.';
      return;
    }
    saving = true; error = ''; notice = '';
    try {
      const result = await supabase.rpc('close_reservation_job', {
        p_operation_key: crypto.randomUUID(),
        p_reservation_id: reservationId,
        p_labor_charge: Number(laborCharge),
        p_other_charge: Number(otherCharge),
        p_notes: notes.trim()
      });
      if (result.error) throw new Error(result.error.message);
      notice = 'Trabajo cerrado. Cargo de cliente registrado; no implica que haya sido cobrado.';
      await load();
      onClosed?.();
    } catch (e) {
      error = e instanceof Error ? e.message : 'No se pudo cerrar el trabajo';
    } finally {
      saving = false;
    }
  }

  onMount(load);
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
.closeout{border:1px solid var(--color-border);border-radius:14px;padding:18px;margin:0 28px 24px;background:var(--color-surface);color:var(--color-text)}
header{display:flex;justify-content:space-between;align-items:flex-start;gap:12px;margin-bottom:14px}h3{font-size:18px;margin:4px 0}.eyebrow{margin:0;color:var(--color-primary);font-size:10px;font-weight:800;letter-spacing:.12em;text-transform:uppercase}
.muted{color:var(--color-muted);font-size:12px;line-height:1.5}.error,.notice{padding:10px;border-radius:8px;font-size:12px}.error{background:#fee2e2;color:#991b1b}.notice{background:#dcfce7;color:#166534}
.totals{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px;margin:16px 0}.totals article{border:1px solid var(--color-border);border-radius:10px;padding:12px;display:flex;flex-direction:column;gap:7px}.totals span{font-size:11px;color:var(--color-muted)}.totals strong{font-size:16px}
.form-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px;margin:16px 0}label{display:grid;gap:6px;font-size:12px;font-weight:700}input{width:100%;box-sizing:border-box;padding:10px;border:1px solid var(--color-border);border-radius:8px;background:var(--color-background);color:var(--color-text)}.wide{grid-column:1/-1}
button{border:0;border-radius:8px;padding:10px 14px;background:var(--color-primary);color:white;font-weight:700;cursor:pointer}.secondary{background:var(--color-surface-2);color:var(--color-text);border:1px solid var(--color-border)}button:disabled{opacity:.55}
@media(max-width:620px){.totals,.form-grid{grid-template-columns:1fr}.wide{grid-column:auto}}
</style>
