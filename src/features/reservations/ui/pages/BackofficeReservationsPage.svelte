<script lang="ts">
  import { onMount } from 'svelte';
  import { reservationWorkUseCases } from '$features/reservations/di';
  import { getReservationRepository } from '$features/reservations/di';
  import type { Reservation, ReservationStatus } from '$features/reservations/domain/entities';
  import { devLog, devError } from '$infrastructure/ui/dev-logger';
  import ResizableSplit from '$infrastructure/ui/ResizableSplit.svelte';
  import ReservationMaterialsPanel from '$features/reservations/ui/components/ReservationMaterialsPanel.svelte';
  import JobCloseoutPanel from '$features/reservations/ui/components/JobCloseoutPanel.svelte';

  const STATUSES: ReservationStatus[] = [
    'pending',
    'confirmed',
    'in_progress',
    'completed',
    'cancelled'
  ];

  const statusLabel: Record<ReservationStatus, string> = {
    pending: 'Pendiente',
    confirmed: 'Confirmada',
    in_progress: 'En curso',
    completed: 'Completada',
    cancelled: 'Cancelada'
  };

  let items = $state<Reservation[]>([]);
  let loading = $state(true);
  let error = $state('');
  let filter = $state<'all' | ReservationStatus>('all');
  let search = $state('');
  let updatingIds = $state<string[]>([]);
  let loadRequestId = 0;
  let selected = $state<Reservation | null>(null);
  let cancellationTarget = $state<Reservation | null>(null);
  let cancellationReason = $state('');
  let cancellationNotes = $state('');
  let cancellationCharge = $state('0');
  let cancelling = $state(false);

  const counts = $derived(
    STATUSES.reduce(
      (acc, s) => {
        acc[s] = items.filter((r) => r.status === s).length;
        return acc;
      },
      {} as Record<ReservationStatus, number>
    )
  );

  const filtered = $derived.by(() => {
    let list = filter === 'all' ? items : items.filter((r) => r.status === filter);
    const q = search.trim().toLowerCase();
    if (q) {
      list = list.filter(
        (r) =>
          r.trackingCode.toLowerCase().includes(q) ||
          r.customerName.toLowerCase().includes(q) ||
          r.customerEmail.toLowerCase().includes(q) ||
          r.customerPhone.toLowerCase().includes(q) ||
          r.serviceCategory.toLowerCase().includes(q)
      );
    }
    return list;
  });

  async function load() {
    const requestId = ++loadRequestId;
    loading = true;
    error = '';
    try {
      const result = await getReservationRepository().listAll();
      if (requestId !== loadRequestId) return;
      items = result;
      devLog('bo-reservas', `loaded ${result.length}`);
      if (selected) {
        selected = result.find((r) => r.id === selected!.id) ?? null;
      }
    } catch (e) {
      if (requestId !== loadRequestId) return;
      devError('bo-reservas', 'listAll failed', e, {
        file: 'BackofficeReservationsPage.svelte'
      });
      error = e instanceof Error ? e.message : 'Error al cargar reservas';
    } finally {
      if (requestId === loadRequestId) loading = false;
    }
  }

  function openReservation(r: Reservation) {
    selected = r;
  }

  const ALLOWED_TRANSITIONS: Record<ReservationStatus, ReservationStatus[]> = {
    pending: ['confirmed', 'cancelled'],
    confirmed: ['in_progress', 'cancelled'],
    in_progress: ['completed', 'cancelled'],
    completed: [],
    cancelled: []
  };

  async function changeStatus(r: Reservation, status: ReservationStatus) {
    if (updatingIds.includes(r.id) || cancelling || loading || r.status === status) return;
    error = '';
    if (!ALLOWED_TRANSITIONS[r.status].includes(status)) {
      error = 'Transición de estado no permitida.';
      return;
    }
    if (status === 'completed') {
      error = 'Cierra el trabajo desde el panel Cierre financiero para registrar cargo y margen.';
      return;
    }
    if (status === 'cancelled') {
      if (r.status === 'in_progress') {
        cancellationTarget = r;
        cancellationReason = '';
        cancellationNotes = '';
        cancellationCharge = '0';
        return;
      }
      if (!window.confirm('¿Cancelar esta reserva? Esta acción no se puede revertir.')) return;
    }
    updatingIds = [...updatingIds, r.id];
    try {
      const updated = await getReservationRepository().updateStatus(r.id, status);
      items = items.map((x) => (x.id === r.id ? updated : x));
      if (selected?.id === r.id) selected = updated;
      devLog('bo-reservas', 'status updated', { id: r.id, status });
    } catch (e) {
      devError('bo-reservas', 'updateStatus failed', e);
      error = e instanceof Error ? e.message : 'No se pudo actualizar';
    } finally {
      updatingIds = updatingIds.filter((id) => id !== r.id);
    }
  }

  async function confirmCancellation() {
    const target = cancellationTarget;
    const charge = Number(cancellationCharge);
    if (cancelling || updatingIds.length > 0 || loading) return;
    if (!target || !cancellationReason.trim() || !Number.isFinite(charge) || charge < 0) {
      error = 'Indica motivo y un cargo válido mayor o igual a cero.';
      return;
    }
    cancelling = true;
    error = '';
    try {
      await reservationWorkUseCases.cancelJob.execute({
        operationKey: crypto.randomUUID(),
        reservationId: target.id,
        customerCharge: charge,
        reason: cancellationReason.trim(),
        notes: cancellationNotes.trim()
      });
      cancellationTarget = null;
      await load();
      error = '';
      devLog('bo-reservas', 'job cancellation liquidated', { id: target.id });
    } catch (e) {
      devError('bo-reservas', 'cancel_reservation_job failed', e);
      error = e instanceof Error ? e.message : 'No se pudo liquidar la cancelación';
    } finally {
      cancelling = false;
    }
  }

  function formatDate(iso: string) {
    try {
      return new Date(iso).toLocaleString('es-CU', {
        dateStyle: 'short',
        timeStyle: 'short'
      });
    } catch {
      return iso;
    }
  }

  function relativeHint(iso: string) {
    const diff = Date.now() - new Date(iso).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `hace ${Math.max(1, mins)} min`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `hace ${hrs} h`;
    const days = Math.floor(hrs / 24);
    return `hace ${days} d`;
  }

  onMount(load);
</script>

<ResizableSplit storageKey="solux-bo-reservas-split" initialLeft={360} minLeft={280} maxLeft={560}>
  {#snippet left()}
    <section class="list-pane">
      <header class="pane-header">
        <div>
          <p class="eyebrow">Backoffice</p>
          <h1>Reservaciones</h1>
        </div>
        <button type="button" class="icon-btn" onclick={load} disabled={loading || updatingIds.length > 0 || cancelling} title="Actualizar">
          {loading ? '…' : '↻'}
        </button>
      </header>

      <div class="search-row">
        <input type="search" placeholder="Buscar código, cliente, servicio…" bind:value={search} />
      </div>

      <div class="chips" role="tablist">
        <button type="button" class="chip" class:active={filter === 'all'} onclick={() => (filter = 'all')}>
          Todas <span>{items.length}</span>
        </button>
        {#each STATUSES as s}
          <button type="button" class="chip" class:active={filter === s} onclick={() => (filter = s)}>
            {statusLabel[s]} <span>{counts[s] ?? 0}</span>
          </button>
        {/each}
      </div>

      {#if error}
        <div class="banner-error" role="alert">{error}</div>
      {/if}

      <div class="item-list">
        {#if loading && items.length === 0}
          <div class="skeleton-stack">
            {#each [1, 2, 3, 4] as _}<div class="skeleton-card"></div>{/each}
          </div>
        {:else if filtered.length === 0}
          <div class="empty-state">
            <div class="empty-icon">◈</div>
            <p>No hay reservas aquí</p>
            <small>Cambia el filtro o inserta una de prueba en Supabase</small>
          </div>
        {:else}
          {#each filtered as r (r.id)}
            <button
              type="button"
              class="item-card"
              class:selected={selected?.id === r.id}
              onclick={() => openReservation(r)}
              disabled={loading || updatingIds.length > 0 || cancelling}
            >
              <div class="item-top">
                <code>{r.trackingCode}</code>
                <span class="time">{relativeHint(r.createdAt)}</span>
              </div>
              <strong class="subject">{r.customerName}</strong>
              <div class="item-meta">
                <span class="who">{r.serviceCategory}</span>
                <span class="badge status" data-status={r.status}>{statusLabel[r.status]}</span>
              </div>
              <div class="item-sub">{r.preferredDate} · {r.preferredTimeSlot}</div>
            </button>
          {/each}
        {/if}
      </div>
    </section>
  {/snippet}

  {#snippet right()}
    <section class="detail-pane" class:empty={!selected}>
      {#if !selected}
        <div class="empty-detail">
          <div class="empty-icon big">📅</div>
          <h2>Selecciona una reserva</h2>
          <p>Revisa los datos del cliente y actualiza el estado de la visita.</p>
        </div>
      {:else}
        <header class="detail-header">
          <div class="detail-title">
            <div class="code-row">
              <code>{selected.trackingCode}</code>
              <span class="badge status" data-status={selected.status}>{statusLabel[selected.status]}</span>
            </div>
            <h2>{selected.customerName}</h2>
          </div>
          <div class="status-control">
            <label for="res-status">Estado</label>
            <select
              id="res-status"
              value={selected.status}
              disabled={loading || updatingIds.includes(selected.id) || updatingIds.length > 0 || cancelling}
              onchange={(e) =>
                changeStatus(
                  selected!,
                  (e.currentTarget as HTMLSelectElement).value as ReservationStatus
                )}
            >
              {#each STATUSES as s}
                <option value={s} disabled={(s === 'completed' && selected.status !== 'completed') || ((selected.status === 'completed' || selected.status === 'cancelled') && s !== selected.status)}>{statusLabel[s]}</option>
              {/each}
            </select>
          </div>
        </header>

        <div class="customer-card">
          <div class="avatar">{selected.customerName.slice(0, 1).toUpperCase()}</div>
          <div>
            <strong>{selected.customerName}</strong>
            <div class="contact-line">{selected.customerEmail}</div>
            <div class="contact-line">{selected.customerPhone}</div>
          </div>
          <div class="dates">
            <span>Creada {formatDate(selected.createdAt)}</span>
            <span>Act. {formatDate(selected.updatedAt)}</span>
          </div>
        </div>

        <div class="info-grid">
          <div class="info-card">
            <h3>Servicio</h3>
            <p>{selected.serviceCategory}</p>
          </div>
          <div class="info-card accent">
            <h3>Visita preferida</h3>
            <p>{selected.preferredDate}</p>
            <small>{selected.preferredTimeSlot}</small>
          </div>
          <div class="info-card wide">
            <h3>Dirección</h3>
            <p>{selected.address || '—'}</p>
          </div>
          <div class="info-card wide">
            <h3>Notas</h3>
            <p class="notes">{selected.notes || 'Sin notas'}</p>
          </div>
        </div>

        {#if selected.status === 'in_progress'}
          <div style="margin: 0 28px 24px;"><ReservationMaterialsPanel reservationId={selected.id} /></div>
        {/if}
        {#if selected.status === 'in_progress' || selected.status === 'completed'}
          <JobCloseoutPanel reservationId={selected.id} status={selected.status} customerName={selected.customerName} customerEmail={selected.customerEmail} customerPhone={selected.customerPhone} serviceCategory={selected.serviceCategory} address={selected.address} onClosed={load} />
        {/if}

        {#if cancellationTarget?.id === selected.id}
          <section class="cancellation-panel" aria-labelledby="cancel-title">
            <h3 id="cancel-title">Liquidar y cancelar trabajo</h3>
            <p>Se registrarán costos incurridos y cargo aprobado en una operación financiera. El cargo no implica pago recibido.</p>
            <label>Motivo obligatorio
              <textarea bind:value={cancellationReason} rows="2" required maxlength="1000"></textarea>
            </label>
            <label>Cargo aprobado al cliente (USD)
              <input type="number" min="0" step="0.01" bind:value={cancellationCharge} required />
            </label>
            <label>Notas
              <textarea bind:value={cancellationNotes} rows="2" maxlength="2000"></textarea>
            </label>
            <div class="cancellation-actions">
              <button type="button" class="cancel-secondary" onclick={() => (cancellationTarget = null)} disabled={cancelling || loading || updatingIds.length > 0}>Volver</button>
              <button type="button" onclick={confirmCancellation} disabled={cancelling || loading || updatingIds.length > 0 || !cancellationReason.trim() || !Number.isFinite(Number(cancellationCharge)) || Number(cancellationCharge) < 0}>
                {cancelling ? 'Liquidando…' : 'Liquidar y cancelar'}
              </button>
            </div>
          </section>
        {/if}

        <div class="status-steps">
          <h3>Flujo de estado</h3>
          <div class="steps">
            {#each STATUSES as s}
              <button
                type="button"
                class="step"
                class:current={selected.status === s}
                class:done={STATUSES.indexOf(selected.status) > STATUSES.indexOf(s) &&
                  selected.status !== 'cancelled' &&
                  s !== 'cancelled'}
                class:cancelled={s === 'cancelled' && selected.status === 'cancelled'}
                disabled={loading || updatingIds.length > 0 || cancelling || !ALLOWED_TRANSITIONS[selected.status].includes(s) || s === 'completed'}
                onclick={() => changeStatus(selected!, s)}
              >
                <span class="dot"></span>
                {statusLabel[s]}
              </button>
            {/each}
          </div>
        </div>
      {/if}
    </section>
  {/snippet}
</ResizableSplit>

<style>
  .list-pane {
    display: flex;
    flex-direction: column;
    height: 100%;
    min-height: 0;
    min-width: 0;
    overflow: hidden;
  }
  .pane-header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    padding: 22px 20px 12px;
    flex-shrink: 0;
  }
  .pane-header h1 {
    margin: 4px 0 0;
    font-size: 22px;
    letter-spacing: -0.04em;
  }
  .eyebrow {
    margin: 0;
    color: var(--color-primary);
    font-size: 10px;
    font-weight: 800;
    letter-spacing: 0.16em;
    text-transform: uppercase;
  }
  .icon-btn {
    width: 36px;
    height: 36px;
    border-radius: 10px;
    border: 1px solid var(--color-border);
    background: var(--color-bg);
    color: var(--color-text);
    font-size: 16px;
    flex-shrink: 0;
  }
  .search-row {
    padding: 0 16px 12px;
    flex-shrink: 0;
    min-width: 0;
  }
  .search-row input {
    width: 100%;
    box-sizing: border-box;
    border: 1px solid var(--color-border);
    background: var(--color-bg);
    color: var(--color-text);
    padding: 11px 14px;
    border-radius: 12px;
    font-size: 13px;
    outline: none;
  }
  .search-row input:focus {
    border-color: var(--color-primary);
    box-shadow: 0 0 0 3px color-mix(in srgb, var(--color-primary) 15%, transparent);
  }

  /* Chips: se reorganizan al mover el split */
  .chips {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    padding: 0 16px 14px;
    width: 100%;
    box-sizing: border-box;
    min-width: 0;
    flex-shrink: 0;
  }
  .chip {
    flex: 0 1 auto;
    max-width: 100%;
    border: 1px solid var(--color-border);
    background: var(--color-bg);
    color: var(--color-muted);
    border-radius: 999px;
    padding: 6px 12px;
    font-size: 11px;
    font-weight: 700;
    display: inline-flex;
    align-items: center;
    gap: 6px;
    white-space: nowrap;
  }
  .chip span {
    background: var(--color-surface-2);
    padding: 1px 6px;
    border-radius: 999px;
    font-size: 10px;
  }
  .chip.active {
    background: var(--color-primary);
    border-color: var(--color-primary);
    color: white;
  }
  .chip.active span {
    background: rgba(255, 255, 255, 0.2);
    color: white;
  }

  .banner-error {
    margin: 0 16px 10px;
    background: color-mix(in srgb, #c0392b 12%, var(--color-surface));
    border: 1px solid color-mix(in srgb, #c0392b 35%, var(--color-border));
    color: #a93226;
    padding: 10px 12px;
    border-radius: 10px;
    font-size: 12px;
    flex-shrink: 0;
  }
  .item-list {
    flex: 1;
    overflow-y: auto;
    overflow-x: hidden;
    padding: 0 10px 16px;
    display: flex;
    flex-direction: column;
    gap: 6px;
    min-width: 0;
  }
  .item-card {
    text-align: left;
    border: 1px solid transparent;
    background: transparent;
    border-radius: 14px;
    padding: 12px 14px;
    color: var(--color-text);
    cursor: pointer;
    min-width: 0;
  }
  .item-card:hover {
    background: var(--color-surface-2);
  }
  .item-card.selected {
    background: color-mix(in srgb, var(--color-primary) 10%, var(--color-surface));
    border-color: color-mix(in srgb, var(--color-primary) 35%, var(--color-border));
  }
  .item-top {
    display: flex;
    justify-content: space-between;
    gap: 8px;
    margin-bottom: 4px;
    min-width: 0;
  }
  .item-top code {
    font-size: 11px;
    font-weight: 800;
    color: var(--color-primary);
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .time {
    font-size: 10px;
    color: var(--color-muted);
    flex-shrink: 0;
  }
  .subject {
    display: block;
    font-size: 13.5px;
    margin-bottom: 6px;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .item-meta {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    align-items: center;
  }
  .who {
    font-size: 11px;
    color: var(--color-muted);
  }
  .item-sub {
    margin-top: 6px;
    font-size: 11px;
    color: var(--color-muted);
  }
  .badge {
    font-size: 10px;
    font-weight: 800;
    text-transform: uppercase;
    letter-spacing: 0.04em;
    padding: 3px 8px;
    border-radius: 999px;
  }
  .badge.status[data-status='pending'] {
    background: color-mix(in srgb, #f39c12 18%, transparent);
    color: #b9770e;
  }
  .badge.status[data-status='confirmed'] {
    background: color-mix(in srgb, #3498db 18%, transparent);
    color: #2980b9;
  }
  .badge.status[data-status='in_progress'] {
    background: color-mix(in srgb, var(--color-primary) 16%, transparent);
    color: var(--color-primary);
  }
  .badge.status[data-status='completed'] {
    background: color-mix(in srgb, #27ae60 16%, transparent);
    color: #1e8449;
  }
  .badge.status[data-status='cancelled'] {
    background: var(--color-surface-2);
    color: var(--color-muted);
  }
  .empty-state,
  .empty-detail {
    text-align: center;
    padding: 48px 24px;
    color: var(--color-muted);
  }
  .empty-icon {
    width: 48px;
    height: 48px;
    margin: 0 auto 12px;
    border-radius: 14px;
    background: var(--color-surface-2);
    display: grid;
    place-items: center;
    font-size: 20px;
    color: var(--color-primary);
  }
  .empty-icon.big {
    width: 64px;
    height: 64px;
    font-size: 28px;
    border-radius: 18px;
  }
  .empty-detail {
    margin: auto;
  }
  .empty-detail h2 {
    margin: 12px 0 8px;
    color: var(--color-text);
    font-size: 20px;
  }
  .skeleton-stack {
    display: grid;
    gap: 8px;
    padding: 4px;
  }
  .skeleton-card {
    height: 88px;
    border-radius: 12px;
    background: linear-gradient(
      90deg,
      var(--color-surface-2) 25%,
      color-mix(in srgb, var(--color-surface-2) 60%, white) 50%,
      var(--color-surface-2) 75%
    );
    background-size: 200% 100%;
    animation: shimmer 1.2s infinite;
  }
  @keyframes shimmer {
    0% {
      background-position: 200% 0;
    }
    100% {
      background-position: -200% 0;
    }
  }
  .detail-pane {
    display: flex;
    flex-direction: column;
    height: 100%;
    min-height: 0;
    overflow-y: auto;
  }
  .detail-pane.empty {
    align-items: center;
    justify-content: center;
  }
  .detail-header {
    display: flex;
    justify-content: space-between;
    gap: 20px;
    padding: 22px 28px 16px;
    border-bottom: 1px solid var(--color-border);
    background: var(--color-surface);
  }
  .detail-title h2 {
    margin: 8px 0 0;
    font-size: 22px;
    letter-spacing: -0.03em;
  }
  .code-row {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    align-items: center;
  }
  .code-row code {
    font-weight: 800;
    color: var(--color-primary);
    font-size: 13px;
  }
  .status-control {
    display: flex;
    flex-direction: column;
    gap: 6px;
    min-width: 160px;
  }
  .status-control label {
    font-size: 11px;
    font-weight: 700;
    color: var(--color-muted);
    text-transform: uppercase;
  }
  .status-control select {
    border: 1px solid var(--color-border);
    background: var(--color-bg);
    color: var(--color-text);
    padding: 10px 12px;
    border-radius: 10px;
    font-size: 13px;
    font-weight: 600;
  }
  .customer-card {
    display: grid;
    grid-template-columns: auto 1fr auto;
    gap: 14px;
    align-items: center;
    margin: 16px 28px 0;
    padding: 14px 16px;
    background: var(--color-surface);
    border: 1px solid var(--color-border);
    border-radius: 16px;
  }
  .avatar {
    width: 42px;
    height: 42px;
    border-radius: 12px;
    background: linear-gradient(145deg, var(--color-primary), var(--color-primary-2));
    color: white;
    display: grid;
    place-items: center;
    font-weight: 800;
  }
  .contact-line {
    font-size: 12px;
    color: var(--color-muted);
  }
  .dates {
    display: flex;
    flex-direction: column;
    gap: 2px;
    font-size: 11px;
    color: var(--color-muted);
    text-align: right;
  }
  .info-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 12px;
    margin: 16px 28px;
  }
  .info-card {
    padding: 14px 16px;
    background: var(--color-surface);
    border: 1px solid var(--color-border);
    border-radius: 14px;
  }
  .info-card.wide {
    grid-column: 1 / -1;
  }
  .info-card.accent {
    background: color-mix(in srgb, var(--color-primary) 8%, var(--color-surface));
    border-color: color-mix(in srgb, var(--color-primary) 25%, var(--color-border));
  }
  .info-card h3 {
    margin: 0 0 8px;
    font-size: 11px;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: var(--color-muted);
  }
  .info-card p {
    margin: 0;
    font-size: 15px;
    font-weight: 600;
  }
  .info-card small {
    display: block;
    margin-top: 4px;
    font-size: 12px;
    color: var(--color-muted);
  }
  .notes {
    font-weight: 500 !important;
    font-size: 14px !important;
    white-space: pre-wrap;
  }
  .cancellation-panel { margin: 0 28px 24px; padding: 18px; border: 1px solid color-mix(in srgb, #c0392b 35%, var(--color-border)); border-radius: 14px; background: var(--color-surface); display: grid; gap: 12px; }
  .cancellation-panel h3, .cancellation-panel p { margin: 0; }
  .cancellation-panel p { color: var(--color-muted); font-size: 12px; line-height: 1.5; }
  .cancellation-panel label { display: grid; gap: 6px; font-size: 12px; font-weight: 700; }
  .cancellation-panel input, .cancellation-panel textarea { width: 100%; box-sizing: border-box; padding: 10px; border: 1px solid var(--color-border); border-radius: 8px; background: var(--color-bg); color: var(--color-text); font: inherit; }
  .cancellation-actions { display: flex; justify-content: flex-end; gap: 8px; }
  .cancel-secondary { background: var(--color-surface-2); color: var(--color-text); border: 1px solid var(--color-border); }
  .status-steps {
    margin: 0 28px 28px;
    padding: 18px 16px;
    background: var(--color-surface);
    border: 1px solid var(--color-border);
    border-radius: 16px;
  }
  .status-steps h3 {
    margin: 0 0 14px;
    font-size: 11px;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: var(--color-muted);
  }
  .steps {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }
  .step {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    border: 1px solid var(--color-border);
    background: var(--color-bg);
    color: var(--color-muted);
    border-radius: 999px;
    padding: 8px 14px;
    font-size: 12px;
    font-weight: 700;
  }
  .step .dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: var(--color-border);
  }
  .step.done {
    color: var(--color-primary);
    border-color: color-mix(in srgb, var(--color-primary) 30%, var(--color-border));
  }
  .step.done .dot {
    background: var(--color-primary);
  }
  .step.current {
    background: var(--color-primary);
    border-color: var(--color-primary);
    color: white;
  }
  .step.current .dot {
    background: white;
  }
  .step.cancelled {
    background: #c0392b;
    border-color: #c0392b;
    color: white;
  }
  .step.cancelled .dot {
    background: white;
  }
  @media (max-width: 900px) {
    .customer-card {
      grid-template-columns: auto 1fr;
    }
    .dates {
      grid-column: 1 / -1;
      text-align: left;
      flex-direction: row;
      gap: 12px;
    }
    .info-grid {
      grid-template-columns: 1fr;
    }
  }
</style>
