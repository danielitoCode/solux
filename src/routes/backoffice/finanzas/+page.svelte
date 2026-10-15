<script lang="ts">
  import { onMount } from 'svelte';
  import { supabase } from '$infrastructure/data/supabase-client';

  type Employee = { id: string; full_name: string; role_title: string; email: string | null; phone: string | null; is_active: boolean; notes: string };
  type Reservation = { id: string; tracking_code: string; customer_name: string; service_category: string; preferred_date: string; status: string };
  type Operation = { id: string; operation_type: string; amount: number; currency: string; occurred_at: string; category: string; description: string; status: string; employee_id: string | null; reservation_id: string | null };
  type Charge = { id: string; amount: number; currency: string; occurred_at: string; description: string; reservation_id: string | null };
  type Summary = { sales_gross: number; managed_sales_commission: number; customer_cash_in: number; customer_refunds: number; operating_expenses: number; inventory_purchases: number; labor_accrued: number; employee_cash_out: number; estimated_cash_flow: number; unpaid_customer_charges: number };

  let employees = $state<Employee[]>([]);
  let reservations = $state<Reservation[]>([]);
  let operations = $state<Operation[]>([]);
  let charges = $state<Charge[]>([]);
  let customerPayments = $state<{ related_operation_id: string | null; amount: number }[]>([]);
  let selectedChargeId = $state('');
  let customerPaymentAmount = $state('');
  let customerPaymentDescription = $state('Cobro de cliente');
  let customerPaymentReference = $state('');
  let reportFrom = $state(new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().slice(0, 10));
  let reportTo = $state(new Date().toISOString().slice(0, 10));
  let summary = $state<Summary | null>(null);
  let reportLoading = $state(false);

  let loading = $state(true);
  let saving = $state(false);
  let error = $state('');
  let notice = $state('');
  let tab = $state<'expenses' | 'labor' | 'payments' | 'employees'>('expenses');
  let expenseAmount = $state('');
  let expenseCategory = $state('operaciones');
  let expenseDescription = $state('');
  let expenseReference = $state('');
  let laborReservation = $state('');
  let laborEmployee = $state('');
  let laborRole = $state('Instalación');
  let laborHours = $state('1');
  let laborAmount = $state('');
  let laborNotes = $state('');
  let paymentEmployee = $state('');
  let paymentAmount = $state('');
  let paymentDescription = $state('Pago a empleado');
  let paymentReference = $state('');
  let employeeName = $state('');
  let employeeRole = $state('Técnico');
  let employeeEmail = $state('');
  let employeePhone = $state('');

  const accrued = $derived(operations.filter((o) => o.operation_type === 'labor_accrual').reduce((n,o) => n + Number(o.amount), 0));
  const expenses = $derived(operations.filter((o) => o.operation_type === 'operating_expense').reduce((n,o) => n + Number(o.amount), 0));
  const payments = $derived(operations.filter((o) => o.operation_type === 'employee_payment').reduce((n,o) => n + Number(o.amount), 0));
  const openCharges = $derived(charges.map((charge) => {
    const paid = customerPayments.filter((p) => p.related_operation_id === charge.id).reduce((sum, p) => sum + Number(p.amount), 0);
    return { ...charge, paid, outstanding: Math.max(0, Number(charge.amount) - paid) };
  }).filter((charge) => charge.outstanding > 0.009));
  const selectedCharge = $derived(openCharges.find((charge) => charge.id === selectedChargeId) ?? null);


  async function load() {
    loading = true; error = '';
    const [e,r,o,c,p] = await Promise.all([
      supabase.from('employees').select('id,full_name,role_title,email,phone,is_active,notes').order('full_name'),
      supabase.from('reservations').select('id,tracking_code,customer_name,service_category,preferred_date,status').neq('status','cancelled').order('created_at',{ascending:false}).limit(200),
      supabase.from('financial_operations').select('id,operation_type,amount,currency,occurred_at,category,description,status,employee_id,reservation_id').order('occurred_at',{ascending:false}).limit(100),
      supabase.from('financial_operations').select('id,amount,currency,occurred_at,description,reservation_id').eq('operation_type','customer_charge').eq('status','posted').order('occurred_at',{ascending:false}).limit(500),
      supabase.from('financial_operations').select('related_operation_id,amount').eq('operation_type','customer_payment').eq('status','posted').limit(1000)
    ]);
    if (e.error || r.error || o.error || c.error || p.error) error = e.error?.message || r.error?.message || o.error?.message || c.error?.message || p.error?.message || 'Error de carga';
    employees = (e.data ?? []) as Employee[];
    reservations = (r.data ?? []) as Reservation[];
    operations = (o.data ?? []) as Operation[];
    charges = (c.data ?? []) as Charge[];
    customerPayments = (p.data ?? []) as { related_operation_id: string | null; amount: number }[];
    if (!selectedChargeId || !charges.some((charge) => charge.id === selectedChargeId)) selectedChargeId = charges[0]?.id ?? '';
    await loadSummary();
    if (!laborEmployee && employees.length) laborEmployee = employees.find(x => x.is_active)?.id ?? '';
    if (!paymentEmployee && employees.length) paymentEmployee = employees[0].id;
    if (!laborReservation && reservations.length) laborReservation = reservations[0].id;
    loading = false;
  }

  async function runAction(action: () => Promise<{ error: { message: string } | null }>, success: string) {
    saving = true; error = ''; notice = '';
    try {
      const result = await action();
      if (result.error) throw new Error(result.error.message);
      notice = success;
      await load();
    } catch (e) { error = e instanceof Error ? e.message : 'Operación fallida'; }
    finally { saving = false; }
  }

  async function saveExpense() {
    if (Number(expenseAmount) <= 0 || !expenseCategory.trim() || !expenseDescription.trim()) { error = 'Importe, categoría y descripción son obligatorios.'; return; }
    const key = crypto.randomUUID();
    await runAction(async () => {
      const result = await supabase.rpc('record_operating_expense', {
        p_operation_key: key, p_amount: Number(expenseAmount), p_category: expenseCategory.trim(),
        p_description: expenseDescription.trim(), p_occurred_at: new Date().toISOString(),
        p_document_reference: expenseReference.trim() || null
      });
      return { error: result.error };
    }, 'Gasto registrado.');
    if (!error) { expenseAmount = ''; expenseDescription = ''; expenseReference = ''; }
  }

  async function saveLabor() {
    if (!laborReservation || !laborEmployee || !laborRole.trim() || Number(laborHours) < 0 || Number(laborAmount) <= 0) { error = 'Completa reserva, empleado, función, horas e importe válido.'; return; }
    const result = await runAction(async () => {
      const r = await supabase.rpc('accrue_job_labor', {
        p_operation_key: crypto.randomUUID(), p_reservation_id: laborReservation, p_employee_id: laborEmployee,
        p_role_description: laborRole.trim(), p_hours: Number(laborHours), p_amount: Number(laborAmount), p_notes: laborNotes.trim()
      });
      return { error: r.error };
    }, 'Mano de obra registrada como obligación.');
    if (!error) { laborAmount = ''; laborNotes = ''; }
  }

  async function savePayment() {
  async function loadSummary() {
    reportLoading = true;
    try {
      const from = new Date(`${reportFrom}T00:00:00`).toISOString();
      const to = new Date(`${reportTo}T23:59:59.999`).toISOString();
      const result = await supabase.rpc('get_financial_summary', { p_from: from, p_to: to });
      if (result.error) throw new Error(result.error.message);
      summary = (result.data?.[0] ?? null) as Summary | null;
    } catch (e) {
      error = e instanceof Error ? e.message : 'Error al cargar informe financiero';
    } finally {
      reportLoading = false;
    }
  }

  async function saveCustomerPayment() {
    if (!selectedCharge || Number(customerPaymentAmount) <= 0 || Number(customerPaymentAmount) > selectedCharge.outstanding + 0.001) {
      error = 'Selecciona cargo e importe válido, sin superar saldo pendiente.';
      return;
    }
    await runAction(async () => {
      const result = await supabase.rpc('record_customer_payment', {
        p_operation_key: crypto.randomUUID(),
        p_charge_operation_id: selectedCharge.id,
        p_amount: Number(customerPaymentAmount),
        p_description: customerPaymentDescription.trim() || 'Cobro de cliente',
        p_document_reference: customerPaymentReference.trim() || null,
        p_occurred_at: new Date().toISOString()
      });
      return { error: result.error };
    }, 'Cobro de cliente registrado.');
    if (!error) { customerPaymentAmount = ''; customerPaymentReference = ''; await loadSummary(); }
  }


    if (!paymentEmployee || Number(paymentAmount) <= 0) { error = 'Selecciona empleado e importe válido.'; return; }
    await runAction(async () => {
      const r = await supabase.rpc('pay_employee', {
        p_operation_key: crypto.randomUUID(), p_employee_id: paymentEmployee, p_amount: Number(paymentAmount),
        p_description: paymentDescription.trim() || 'Pago a empleado', p_document_reference: paymentReference.trim() || null
      });
      return { error: r.error };
    }, 'Pago registrado y aplicado a saldos pendientes.');
    if (!error) { paymentAmount = ''; paymentReference = ''; }
  }

  async function saveEmployee() {
    if (!employeeName.trim()) { error = 'Nombre obligatorio.'; return; }
    await runAction(async () => {
      const r = await supabase.from('employees').insert({
        full_name: employeeName.trim(), role_title: employeeRole.trim() || 'Técnico',
        email: employeeEmail.trim() || null, phone: employeePhone.trim() || null
      });
      return { error: r.error };
    }, 'Empleado creado.');
    if (!error) { employeeName = ''; employeeEmail = ''; employeePhone = ''; }
  }

  async function toggleEmployee(employee: Employee) {
    await runAction(async () => {
      const r = await supabase.from('employees').update({ is_active: !employee.is_active }).eq('id', employee.id);
      return { error: r.error };
    }, employee.is_active ? 'Empleado desactivado.' : 'Empleado activado.');
  }

  function employeeBalance(id: string) {
    return operations.filter(o => o.employee_id === id && o.operation_type === 'labor_accrual').reduce((n,o) => n + Number(o.amount), 0)
      - operations.filter(o => o.employee_id === id && o.operation_type === 'employee_payment').reduce((n,o) => n + Number(o.amount), 0);
  }

  onMount(load);
</script>

<svelte:head><title>Finanzas | SOLUX</title></svelte:head>
<div class="page">
  <header><div><p class="eyebrow">Backoffice / Administración</p><h1>Finanzas y personal</h1><p class="muted">Registro de gastos, obligaciones laborales, pagos y empleados.</p></div><button class="secondary" onclick={load} disabled={loading}>Actualizar</button></header>
  {#if error}<p class="alert" role="alert">{error}</p>{/if}
  {#if notice}<p class="notice" role="status">{notice}</p>{/if}
  <div class="stats">
    <article><span>Gastos operativos registrados</span><strong>{expenses.toFixed(2)} USD</strong></article>
    <article><span>Mano de obra acumulada</span><strong>{accrued.toFixed(2)} USD</strong></article>
    <article><span>Pagos a empleados</span><strong>{payments.toFixed(2)} USD</strong></article>
  </div>
  <nav class="tabs">
    <button class:active={tab === 'expenses'} onclick={() => tab = 'expenses'}>Gastos</button>
    <button class:active={tab === 'labor'} onclick={() => tab = 'labor'}>Mano de obra</button>
    <button class:active={tab === 'payments'} onclick={() => tab = 'payments'}>Pagos</button>
    <button class:active={tab === 'employees'} onclick={() => tab = 'employees'}>Empleados</button>
  </nav>
  {#if tab === 'expenses'}
    <section class="panel"><h2>Registrar gasto operativo</h2><div class="form-grid">
      <label>Importe (USD)<input type="number" min="0.01" step="0.01" bind:value={expenseAmount} /></label>
      <label>Categoría<input bind:value={expenseCategory} placeholder="transporte, herramientas…" /></label>
      <label class="wide">Descripción<input bind:value={expenseDescription} /></label>
      <label>Referencia de factura/recibo<input bind:value={expenseReference} /></label>
    </div><button onclick={saveExpense} disabled={saving}>{saving ? 'Guardando…' : 'Registrar gasto'}</button></section>
  {:else if tab === 'labor'}
    <section class="panel"><h2>Acumular mano de obra</h2><p class="muted">Registra obligación por trabajo. No significa que dinero haya salido de caja.</p><div class="form-grid">
      <label>Reserva / trabajo<select bind:value={laborReservation}>{#each reservations as r}<option value={r.id}>{r.tracking_code} · {r.customer_name} · {r.service_category}</option>{/each}</select></label>
      <label>Empleado<select bind:value={laborEmployee}>{#each employees.filter(e => e.is_active) as e}<option value={e.id}>{e.full_name}</option>{/each}</select></label>
      <label>Función<input bind:value={laborRole} /></label>
      <label>Horas<input type="number" min="0" step="0.25" bind:value={laborHours} /></label>
      <label>Importe acordado (USD)<input type="number" min="0.01" step="0.01" bind:value={laborAmount} /></label>
      <label>Notas<input bind:value={laborNotes} /></label>
    </div><button onclick={saveLabor} disabled={saving || !reservations.length || !employees.some(e => e.is_active)}>{saving ? 'Guardando…' : 'Registrar obligación'}</button></section>
  {:else if tab === 'payments'}
    <section class="panel"><h2>Registrar pago a empleado</h2><p class="muted">Pago limitado al saldo laboral acumulado pendiente. Se distribuye entre obligaciones antiguas primero.</p><div class="form-grid">
      <label>Empleado<select bind:value={paymentEmployee}>{#each employees as e}<option value={e.id}>{e.full_name}{e.is_active ? '' : ' (inactivo)'}</option>{/each}</select></label>
      <label>Importe (USD)<input type="number" min="0.01" step="0.01" bind:value={paymentAmount} /></label>
      <label>Descripción<input bind:value={paymentDescription} /></label>
      <label>Referencia bancaria/recibo<input bind:value={paymentReference} /></label>
    </div>{#if paymentEmployee}<p class="balance">Saldo calculado en libro cargado: {employeeBalance(paymentEmployee).toFixed(2)} USD</p>{/if}<button onclick={savePayment} disabled={saving || !paymentEmployee}>{saving ? 'Procesando…' : 'Registrar pago'}</button></section>
  {:else}
    <section class="panel"><h2>Nuevo empleado</h2><div class="form-grid">
      <label>Nombre completo<input bind:value={employeeName} /></label><label>Cargo<input bind:value={employeeRole} /></label>
      <label>Email<input type="email" bind:value={employeeEmail} /></label><label>Teléfono<input bind:value={employeePhone} /></label>
    </div><button onclick={saveEmployee} disabled={saving}>{saving ? 'Guardando…' : 'Crear empleado'}</button>
    <h2 class="subheading">Personal registrado</h2><div class="table-wrap"><table><thead><tr><th>Empleado</th><th>Cargo</th><th>Estado</th><th>Saldo laboral aprox.</th><th></th></tr></thead><tbody>
      {#each employees as e}<tr><td>{e.full_name}<small>{e.email ?? e.phone ?? ''}</small></td><td>{e.role_title}</td><td>{e.is_active ? 'Activo' : 'Inactivo'}</td><td>{employeeBalance(e.id).toFixed(2)} USD</td><td><button class="secondary compact" onclick={() => toggleEmployee(e)} disabled={saving}>{e.is_active ? 'Desactivar' : 'Activar'}</button></td></tr>{/each}
    </tbody></table></div></section>
  {/if}
  <section class="panel"><h2>Libro financiero reciente</h2>
  <section class="panel">
    <h2>Cobros de clientes</h2>
    <p class="muted">Un cargo registrado no es entrada de caja. Registra aquí el dinero recibido; cada cobro se vincula a un cargo y no puede superar su saldo pendiente.</p>
    <div class="form-grid">
      <label class="wide">Cargo pendiente
        <select bind:value={selectedChargeId}>
          {#each openCharges as charge}
            <option value={charge.id}>{new Date(charge.occurred_at).toLocaleDateString()} · {charge.description} · Pendiente {charge.outstanding.toFixed(2)} {charge.currency}</option>
          {/each}
        </select>
      </label>
      {#if selectedCharge}
        <p class="balance wide">Cargo: {Number(selectedCharge.amount).toFixed(2)} {selectedCharge.currency}. Pagado: {selectedCharge.paid.toFixed(2)}. Pendiente: {selectedCharge.outstanding.toFixed(2)}.</p>
      {/if}
      <label>Importe recibido (USD)<input type="number" min="0.01" max={selectedCharge?.outstanding ?? undefined} step="0.01" bind:value={customerPaymentAmount} /></label>
      <label>Descripción<input bind:value={customerPaymentDescription} /></label>
      <label class="wide">Referencia de transferencia/recibo<input bind:value={customerPaymentReference} /></label>
    </div>
    {#if !openCharges.length}<p class="muted">No hay cargos pendientes detectados en los últimos 500 cargos cargados.</p>{/if}
    <button onclick={saveCustomerPayment} disabled={saving || !selectedCharge}>{saving ? 'Registrando…' : 'Registrar cobro recibido'}</button>
  </section>

  <section class="panel">
    <h2>Informe financiero</h2>
    <p class="muted">Resumen por fecha de operación. Flujo de caja estimado incluye cobros de clientes y aportes de capital, menos reembolsos, gastos operativos, pagos laborales y retiros; no incluye compras de inventario ni pagos a proveedores.</p>
    <div class="report-controls">
      <label>Desde<input type="date" bind:value={reportFrom} /></label>
      <label>Hasta<input type="date" bind:value={reportTo} /></label>
      <button class="secondary" onclick={loadSummary} disabled={reportLoading || !reportFrom || !reportTo || reportFrom > reportTo}>{reportLoading ? 'Consultando…' : 'Consultar periodo'}</button>
    </div>
    {#if summary}
      <div class="report-grid">
        <article><span>Ventas brutas (stock propio)</span><strong>{Number(summary.sales_gross).toFixed(2)} USD</strong></article>
        <article><span>Comisión ventas gestionadas</span><strong>{Number(summary.managed_sales_commission).toFixed(2)} USD</strong></article>
        <article><span>Cobros de clientes (caja)</span><strong>{Number(summary.customer_cash_in).toFixed(2)} USD</strong></article>
        <article><span>Reembolsos</span><strong>{Number(summary.customer_refunds).toFixed(2)} USD</strong></article>
        <article><span>Gastos operativos</span><strong>{Number(summary.operating_expenses).toFixed(2)} USD</strong></article>
        <article><span>Compras de inventario</span><strong>{Number(summary.inventory_purchases).toFixed(2)} USD</strong></article>
        <article><span>Mano de obra acumulada</span><strong>{Number(summary.labor_accrued).toFixed(2)} USD</strong></article>
        <article><span>Pagos a empleados (caja)</span><strong>{Number(summary.employee_cash_out).toFixed(2)} USD</strong></article>
        <article><span>Flujo de caja estimado</span><strong>{Number(summary.estimated_cash_flow).toFixed(2)} USD</strong></article>
        <article><span>Cargos de clientes pendientes</span><strong>{Number(summary.unpaid_customer_charges).toFixed(2)} USD</strong></article>
      </div>
    {/if}
  </section>
<p class="muted">Importes registrados; no equivalen necesariamente a entradas o salidas de caja. Los cobros y pagos de clientes requieren registro separado.</p>
    {#if loading}<p>Cargando…</p>{:else if !operations.length}<p class="muted">Sin operaciones.</p>{:else}
      <div class="table-wrap"><table><thead><tr><th>Fecha</th><th>Tipo</th><th>Descripción</th><th>Estado</th><th class="number">Importe</th></tr></thead><tbody>
        {#each operations as op}<tr><td>{new Date(op.occurred_at).toLocaleDateString()}</td><td>{op.operation_type}</td><td>{op.description}<small>{op.category}</small></td><td>{op.status}</td><td class="number">{Number(op.amount).toFixed(2)} {op.currency}</td></tr>{/each}
      </tbody></table></div>
    {/if}
  </section>
</div>
<style>
.page{padding:clamp(20px,4vw,40px);max-width:1250px;margin:0 auto;color:var(--color-text)}header{display:flex;align-items:center;justify-content:space-between;gap:20px;margin-bottom:24px}
h1{font-size:clamp(26px,3vw,36px);margin:4px 0 8px}h2{font-size:18px;margin:0 0 18px}.subheading{margin-top:28px}
.eyebrow{font-size:11px;text-transform:uppercase;letter-spacing:.12em;color:var(--color-primary);font-weight:800;margin:0}.muted,small{color:var(--color-muted);font-size:13px;line-height:1.5}
.stats{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px;margin-bottom:16px}.stats article{padding:16px;border:1px solid var(--color-border);border-radius:12px;display:flex;flex-direction:column;gap:8px}.stats span{font-size:12px;color:var(--color-muted)}.stats strong{font-size:22px}
.report-controls{display:grid;grid-template-columns:repeat(2,minmax(0,1fr)) auto;gap:12px;align-items:end;margin:18px 0}
.report-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px;margin-top:18px}
.report-grid article{padding:14px;border:1px solid var(--color-border);border-radius:10px;display:flex;flex-direction:column;gap:8px}
.report-grid span{font-size:12px;color:var(--color-muted)}.report-grid strong{font-size:18px}

.tabs{display:flex;gap:8px;flex-wrap:wrap;margin-bottom:16px}.tabs button{background:var(--color-surface-2);color:var(--color-text);border:1px solid var(--color-border)}.tabs button.active{background:var(--color-primary);color:white}
.panel{background:var(--color-surface);border:1px solid var(--color-border);border-radius:14px;padding:22px;margin-bottom:16px}label{display:flex;flex-direction:column;gap:7px;font-size:13px;font-weight:650}
input,select{width:100%;min-width:0;padding:10px 12px;border:1px solid var(--color-border);border-radius:8px;background:var(--color-background);color:var(--color-text)}.form-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:16px;margin:18px 0}.wide{grid-column:1/-1}
button{border:0;border-radius:8px;padding:11px 16px;background:var(--color-primary);color:white;font-weight:750;cursor:pointer}button:disabled{opacity:.55;cursor:not-allowed}.secondary{background:var(--color-surface-2);color:var(--color-text);border:1px solid var(--color-border)}.compact{padding:7px 10px;font-size:12px}
.alert,.notice{padding:12px 14px;border-radius:8px;margin:0 0 16px;font-size:13px}.alert{background:#fee2e2;color:#991b1b}.notice{background:#dcfce7;color:#166534}.balance{font-size:13px;font-weight:700}
.table-wrap{overflow:auto;margin-top:14px}table{width:100%;border-collapse:collapse;text-align:left}th,td{padding:11px;border-bottom:1px solid var(--color-border);font-size:13px}td small{display:block}.number{text-align:right}
@media(max-width:680px){header{align-items:flex-start;flex-direction:column}.stats,.report-grid{grid-template-columns:1fr}.form-grid,.report-controls{grid-template-columns:1fr}.wide{grid-column:auto}}
</style>
