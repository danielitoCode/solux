<script lang="ts">
  import { onMount } from 'svelte';
  import { reservationWorkUseCases } from '$features/reservations/di';
  import { getReservationRepository } from '$features/reservations/di';
  import type { Reservation, ReservationStatus } from '$features/reservations/domain/entities';
  import { devLog, devError } from '$infrastructure/ui/dev-logger';
  import ResizableSplit from '$infrastructure/ui/ResizableSplit.svelte';
  import { intentLabel, sourceLabel } from '$infrastructure/ui/lead-labels';

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
  let intentFilter = $state<'all' | string>('all');
  let sourceFilter = $state<'all' | string>('all');
  let search = $state('');
  let updatingIds = $state<string[]>([]);
  let cancelling = $state(false);
  let loadRequestId = 0;
  let selected = $state<Reservation | null>(null);

  const counts = $derived(
    STATUSES.reduce(
      (acc, s) => {
        acc[s] = items.filter((r) => r.status === s).length;
        return acc;
      },
      {} as Record<ReservationStatus, number>
    )
  );

  const intentCounts = $derived.by(() => {
    const acc: Record<string, number> = {};
    for (const r of items) acc[r.intent] = (acc[r.intent] ?? 0) + 1;
    return acc;
  });
  const sourceCounts = $derived.by(() => {
    const acc: Record<string, number> = {};
    for (const r of items) acc[r.source] = (acc[r.source] ?? 0) + 1;
    return acc;
  });
  const intentKeys = $derived(Object.keys(intentCounts).sort());
  const sourceKeys = $derived(Object.keys(sourceCounts).sort());

  const filtered = $derived.by(() => {
    let list = filter === 'all' ? items : items.filter((r) => r.status === filter);
    if (intentFilter !== 'all') list = list.filter((r) => r.intent === intentFilter);
    if (sourceFilter !== 'all') list = list.filter((r) => r.source === sourceFilter);
    const q = search.trim().toLowerCase();
    if (q) {
      list = list.filter(
        (r) =>
          r.trackingCode.toLowerCase().includes(q) ||
          r.customerName.toLowerCase().includes(q) ||
          r.serviceCategory.toLowerCase().includes(q) ||
          r.customerEmail.toLowerCase().includes(q)
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
      devError('bo-reservas', 'listAll failed', e, { file: 'BackofficeReservationsPage.svelte' });
      error = e instanceof Error ? e.message : 'Error al cargar reservas';
    } finally {
      if (requestId === loadRequestId) loading = false;
    }
  }

  function openReservation(r: Reservation) {
    selected = r;
  }

  async function changeStatus(r: Reservation, status: ReservationStatus) {
    if (r.status === status || updatingIds.includes(r.id) || cancelling) return;
    if (status === 'cancelled' && !confirm(`¿Cancelar reserva ${r.trackingCode}?`)) return;
    if (status === 'completed' && !confirm(`¿Marcar ${r.trackingCode} como completada?`)) return;
    error = '';
    updatingIds = [...updatingIds, r.id];
    try {
      const updated = await getReservationRepository().updateStatus(r.id, status);
      items = items.map((x) => (x.id === r.id ? updated : x));
      if (selected?.id === r.id) selected = updated;
      devLog('bo-reservas', 'status', { id: r.id, status });
    } catch (e) {
      devError('bo-reservas', 'updateStatus failed', e);
      error = e instanceof Error ? e.message : 'No se pudo actualizar el estado';
    } finally {
      updatingIds = updatingIds.filter((id) => id !== r.id);
    }
  }

  function formatDate(iso: string) {
    try {
      return new Date(iso).toLocaleString('es-CU', { dateStyle: 'short', timeStyle: 'short' });
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
          <h1>Reservas</h1>
        </div>
        <button type="button" class="icon-btn" onclick={load} disabled={loading || updatingIds.length > 0 || cancelling} title="Actualizar">
          {loading ? '…' : '↻'}
        </button>
      </header>

      <div class="search-row">
        <input type="search" placeholder="Buscar código, cliente, servicio…" bind:value={search} />
      </div>

      <div class="chips" role="tablist" aria-label="Estado">
        <button type="button" class="chip" class:active={filter === 'all'} onclick={() => (filter = 'all')}>
          Todas <span>{items.length}</span>
        </button>
        {#each STATUSES as s}
          <button type="button" class="chip" class:active={filter === s} onclick={() => (filter = s)}>
            {statusLabel[s]} <span>{counts[s] ?? 0}</span>
          </button>
        {/each}
      </div>

      <div class="chips chips-secondary" role="tablist" aria-label="Intención">
        <button type="button" class="chip" class:active={intentFilter === 'all'} onclick={() => (intentFilter = 'all')}>
          Intent <span>todas</span>
        </button>
        {#each intentKeys as k}
          <button type="button" class="chip" class:active={intentFilter === k} onclick={() => (intentFilter = k)}>
            {intentLabel(k)} <span>{intentCounts[k]}</span>
          </button>
        {/each}
      </div>

      <div class="chips chips-secondary" role="tablist" aria-label="Origen">
        <button type="button" class="chip" class:active={sourceFilter === 'all'} onclick={() => (sourceFilter = 'all')}>
          Origen <span>todos</span>
        </button>
        {#each sourceKeys as k}
          <button type="button" class="chip" class:active={sourceFilter === k} onclick={() => (sourceFilter = k)}>
            {sourceLabel(k)} <span>{sourceCounts[k]}</span>
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
                <span class="badge lead" title="Intención">{intentLabel(r.intent)}</span>
                <span class="badge lead muted" title="Origen">{sourceLabel(r.source)}</span>
                <span class="badge status" data-status={r.status}>{statusLabel[r.status]}</span>
              </div>
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
          <div class="empty-icon big">☀</div>
          <h2>Selecciona una reserva</h2>
          <p>Revisa datos del cliente y actualiza el estado del trabajo.</p>
        </div>
      {:else}
        <header class="detail-header">
          <div class="detail-title">
            <div class="code-row">
              <code>{selected.trackingCode}</code>
              <span class="badge status" data-status={selected.status}>{statusLabel[selected.status]}</span>
              <span class="badge lead">{intentLabel(selected.intent)}</span>
              <span class="badge lead muted">{sourceLabel(selected.source)}</span>
            </div>
            <h2>{selected.customerName}</h2>
          </div>
          <div class="actions">
            <label class="field-inline">
              <span>Estado</span>
              <select
                value={selected.status}
                disabled={updatingIds.includes(selected.id) || cancelling}
                onchange={(e) => changeStatus(selected!, (e.currentTarget as HTMLSelectElement).value as ReservationStatus)}
              >
                {#each STATUSES as s}
                  <option
                    value={s}
                    disabled={
                      (s === 'completed' && selected.status !== 'completed') ||
                      ((selected.status === 'completed' || selected.status === 'cancelled') && s !== selected.status)
                    }
                  >{statusLabel[s]}</option>
                {/each}
              </select>
            </label>
          </div>
        </header>

        <div class="customer-card">
          <div class="avatar">{selected.customerName.slice(0, 1).toUpperCase()}</div>
          <div>
            <strong>{selected.customerName}</strong>
            <div class="contact-line">
              <a href="mailto:{selected.customerEmail}">{selected.customerEmail}</a>
            </div>
            <div class="contact-line">
              <a href="tel:{selected.customerPhone}">{selected.customerPhone}</a>
            </div>
          </div>
          <div class="dates">
            <span>Creada {formatDate(selected.createdAt)}</span>
            <span>Actualizada {formatDate(selected.updatedAt)}</span>
          </div>
        </div>

        <div class="info-grid">
          <div class="info-card">
            <span class="label">Servicio</span>
            <strong>{selected.serviceCategory}</strong>
          </div>
          <div class="info-card">
            <span class="label">Fecha preferida</span>
            <strong>{selected.preferredDate}</strong>
          </div>
          <div class="info-card">
            <span class="label">Franja</span>
            <strong>{selected.preferredTimeSlot}</strong>
          </div>
          <div class="info-card">
            <span class="label">Dirección</span>
            <strong>{selected.address || '—'}</strong>
          </div>
        </div>

        {#if selected.notes}
          <div class="message-box">
            <h3>Notas</h3>
            <p>{selected.notes}</p>
          </div>
        {/if}

        <div class="quick-actions">
          <a class="btn btn-primary" href="mailto:{selected.customerEmail}?subject=SOLUX — Reserva {selected.trackingCode}">
            Email al cliente
          </a>
          <a class="btn btn-ghost" href="tel:{selected.customerPhone}">Llamar</a>
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
  .chips-secondary {
    margin-top: -4px;
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
  }
  .item-top code {
    font-size: 11px;
    font-weight: 700;
    color: var(--color-primary);
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
    align-items: center;
    gap: 6px;
  }
  .who {
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
  .badge.lead {
    background: color-mix(in srgb, var(--color-primary) 14%, var(--color-surface));
    color: var(--color-primary);
    border: 1px solid color-mix(in srgb, var(--color-primary) 28%, var(--color-border));
  }
  .badge.lead.muted {
    background: var(--color-surface-2);
    color: var(--color-muted);
    border-color: var(--color-border);
  }
  .badge.status {
    background: var(--color-surface-2);
    color: var(--color-muted);
  }
  .badge.status[data-status='pending'] {
    background: color-mix(in srgb, #f39c12 18%, transparent);
    color: #b9770e;
  }
  .badge.status[data-status='confirmed'] {
    background: color-mix(in srgb, #3498db 16%, transparent);
    color: #2471a3;
  }
  .badge.status[data-status='in_progress'] {
    background: color-mix(in srgb, #9b59b6 16%, transparent);
    color: #7d3c98;
  }
  .badge.status[data-status='completed'] {
    background: color-mix(in srgb, #27ae60 16%, transparent);
    color: #1e8449;
  }
  .badge.status[data-status='cancelled'] {
    background: color-mix(in srgb, #7f8c8d 16%, transparent);
    color: #566573;
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
    0% { background-position: 200% 0; }
    100% { background-position: -200% 0; }
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
    align-items: flex-start;
    padding: 22px 28px 16px;
    border-bottom: 1px solid var(--color-border);
    background: var(--color-surface);
  }
  .detail-title h2 {
    margin: 8px 0 0;
    font-size: 20px;
    letter-spacing: -0.03em;
  }
  .code-row {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    align-items: center;
  }
  .code-row code {
    font-size: 12px;
    font-weight: 700;
    color: var(--color-primary);
  }
  .actions {
    display: flex;
    gap: 8px;
    flex-shrink: 0;
  }
  .field-inline {
    display: flex;
    flex-direction: column;
    gap: 4px;
    font-size: 11px;
    font-weight: 700;
    color: var(--color-muted);
  }
  .field-inline select {
    border: 1px solid var(--color-border);
    background: var(--color-bg);
    color: var(--color-text);
    padding: 8px 10px;
    border-radius: 10px;
    font-size: 13px;
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
  .contact-line a {
    color: var(--color-primary);
    font-weight: 600;
  }
  .dates {
    font-size: 11px;
    color: var(--color-muted);
    text-align: right;
    display: flex;
    flex-direction: column;
    gap: 4px;
  }
  .info-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 12px;
    margin: 16px 28px 0;
  }
  .info-card {
    padding: 14px 16px;
    background: var(--color-surface);
    border: 1px solid var(--color-border);
    border-radius: 14px;
  }
  .info-card .label {
    display: block;
    font-size: 10px;
    font-weight: 800;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    color: var(--color-muted);
    margin-bottom: 6px;
  }
  .info-card strong {
    font-size: 14px;
  }
  .message-box {
    margin: 16px 28px 0;
    padding: 18px 16px;
    background: var(--color-surface);
    border: 1px solid var(--color-border);
    border-radius: 16px;
  }
  .message-box h3 {
    margin: 0 0 12px;
    font-size: 11px;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: var(--color-muted);
  }
  .message-box p {
    margin: 0;
    font-size: 15px;
    line-height: 1.6;
    white-space: pre-wrap;
  }
  .quick-actions {
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
    padding: 16px 28px 28px;
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
