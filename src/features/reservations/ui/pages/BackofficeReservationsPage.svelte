<script lang="ts">
  import { onMount } from 'svelte';
  import { getReservationRepository } from '$features/reservations/di';
  import type { Reservation, ReservationStatus } from '$features/reservations/domain/entities';
  import { devLog, devError } from '$infrastructure/ui/dev-logger';

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
  let updatingId = $state<string | null>(null);
  let selected = $state<Reservation | null>(null);

  const filtered = $derived(
    filter === 'all' ? items : items.filter((r) => r.status === filter)
  );

  async function load() {
    loading = true;
    error = '';
    try {
      items = await getReservationRepository().listAll();
      devLog('bo-reservas', `loaded ${items.length}`);
    } catch (e) {
      devError('bo-reservas', 'listAll failed', e, {
        file: 'BackofficeReservationsPage.svelte'
      });
      error = e instanceof Error ? e.message : 'Error al cargar reservas';
    } finally {
      loading = false;
    }
  }

  async function changeStatus(r: Reservation, status: ReservationStatus) {
    if (r.status === status) return;
    updatingId = r.id;
    try {
      const updated = await getReservationRepository().updateStatus(r.id, status);
      items = items.map((x) => (x.id === r.id ? updated : x));
      if (selected?.id === r.id) selected = updated;
      devLog('bo-reservas', 'status updated', { id: r.id, status });
    } catch (e) {
      devError('bo-reservas', 'updateStatus failed', e);
      error = e instanceof Error ? e.message : 'No se pudo actualizar';
    } finally {
      updatingId = null;
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

  onMount(load);
</script>

<section class="page bo-page">
  <div class="section-head">
    <div>
      <div class="eyebrow">Backoffice</div>
      <h2>Reservaciones</h2>
    </div>
    <div class="head-actions">
      <select bind:value={filter} aria-label="Filtrar por estado">
        <option value="all">Todas ({items.length})</option>
        {#each STATUSES as s}
          <option value={s}
            >{statusLabel[s]} ({items.filter((i) => i.status === s).length})</option
          >
        {/each}
      </select>
      <button type="button" class="btn btn-small btn-ghost" onclick={load} disabled={loading}>
        {loading ? 'Cargando…' : 'Actualizar'}
      </button>
    </div>
  </div>

  {#if error}
    <div class="banner-error" role="alert">{error}</div>
  {/if}

  {#if loading && items.length === 0}
    <p class="muted">Cargando reservas…</p>
  {:else if filtered.length === 0}
    <div class="card empty">
      <p>No hay reservas{filter !== 'all' ? ` con estado “${statusLabel[filter]}”` : ''}.</p>
      <p class="muted">Las nuevas llegarán desde el formulario público `/reservas`.</p>
    </div>
  {:else}
    <div class="table-wrap card">
      <table>
        <thead>
          <tr>
            <th>Código</th>
            <th>Cliente</th>
            <th>Servicio</th>
            <th>Fecha pref.</th>
            <th>Estado</th>
            <th>Creada</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {#each filtered as r (r.id)}
            <tr>
              <td><code>{r.trackingCode}</code></td>
              <td>
                <strong>{r.customerName}</strong>
                <div class="sub">{r.customerPhone}</div>
              </td>
              <td>{r.serviceCategory}</td>
              <td>
                {r.preferredDate}
                <div class="sub">{r.preferredTimeSlot}</div>
              </td>
              <td>
                <select
                  class="status-select status-{r.status}"
                  value={r.status}
                  disabled={updatingId === r.id}
                  onchange={(e) =>
                    changeStatus(r, (e.currentTarget as HTMLSelectElement).value as ReservationStatus)}
                >
                  {#each STATUSES as s}
                    <option value={s}>{statusLabel[s]}</option>
                  {/each}
                </select>
              </td>
              <td class="sub">{formatDate(r.createdAt)}</td>
              <td>
                <button type="button" class="link-btn" onclick={() => (selected = r)}>Ver</button>
              </td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>
  {/if}

  {#if selected}
    <div class="drawer-backdrop" role="presentation" onclick={() => (selected = null)}></div>
    <aside class="drawer card">
      <div class="drawer-head">
        <h3>Reserva {selected.trackingCode}</h3>
        <button type="button" class="link-btn" onclick={() => (selected = null)}>Cerrar</button>
      </div>
      <dl class="detail">
        <div><dt>Cliente</dt><dd>{selected.customerName}</dd></div>
        <div><dt>Email</dt><dd>{selected.customerEmail}</dd></div>
        <div><dt>Teléfono</dt><dd>{selected.customerPhone}</dd></div>
        <div><dt>Servicio</dt><dd>{selected.serviceCategory}</dd></div>
        <div><dt>Fecha</dt><dd>{selected.preferredDate} · {selected.preferredTimeSlot}</dd></div>
        <div><dt>Dirección</dt><dd>{selected.address || '—'}</dd></div>
        <div><dt>Notas</dt><dd>{selected.notes || '—'}</dd></div>
        <div><dt>Estado</dt><dd>{statusLabel[selected.status]}</dd></div>
        <div><dt>Creada</dt><dd>{formatDate(selected.createdAt)}</dd></div>
        <div><dt>Actualizada</dt><dd>{formatDate(selected.updatedAt)}</dd></div>
      </dl>
      <label class="field">
        <span>Cambiar estado</span>
        <select
          value={selected.status}
          disabled={updatingId === selected.id}
          onchange={(e) =>
            changeStatus(
              selected!,
              (e.currentTarget as HTMLSelectElement).value as ReservationStatus
            )}
        >
          {#each STATUSES as s}
            <option value={s}>{statusLabel[s]}</option>
          {/each}
        </select>
      </label>
    </aside>
  {/if}
</section>

<style>
  .bo-page {
    padding-top: 32px;
  }
  .head-actions {
    display: flex;
    gap: 10px;
    align-items: center;
    flex-wrap: wrap;
  }
  .head-actions select {
    border: 1px solid var(--color-border);
    background: var(--color-surface);
    color: var(--color-text);
    padding: 8px 12px;
    border-radius: 10px;
    font-size: 13px;
    font-weight: 600;
  }
  .banner-error {
    background: color-mix(in srgb, #c0392b 12%, var(--color-surface));
    border: 1px solid color-mix(in srgb, #c0392b 35%, var(--color-border));
    color: #a93226;
    padding: 12px 14px;
    border-radius: var(--radius-sm);
    margin-bottom: 16px;
    font-size: 13px;
  }
  .muted {
    color: var(--color-muted);
    font-size: 13px;
  }
  .empty {
    text-align: center;
    padding: 40px 24px;
  }
  .table-wrap {
    padding: 0;
    overflow: auto;
  }
  table {
    width: 100%;
    border-collapse: collapse;
    font-size: 13px;
  }
  th,
  td {
    text-align: left;
    padding: 12px 14px;
    border-bottom: 1px solid var(--color-border);
    vertical-align: top;
  }
  th {
    font-size: 11px;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    color: var(--color-muted);
    background: var(--color-surface-2);
  }
  code {
    font-size: 12px;
    font-weight: 700;
    color: var(--color-primary);
  }
  .sub {
    font-size: 11px;
    color: var(--color-muted);
    margin-top: 2px;
  }
  .status-select {
    border: 1px solid var(--color-border);
    border-radius: 8px;
    padding: 6px 8px;
    font-size: 12px;
    font-weight: 700;
    background: var(--color-bg);
    color: var(--color-text);
  }
  .link-btn {
    border: 0;
    background: none;
    color: var(--color-primary);
    font-weight: 700;
    font-size: 12px;
    padding: 0;
  }
  .drawer-backdrop {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.35);
    z-index: 40;
  }
  .drawer {
    position: fixed;
    top: 0;
    right: 0;
    bottom: 0;
    width: min(400px, 100vw);
    z-index: 50;
    border-radius: 0;
    overflow: auto;
    padding: 24px;
  }
  .drawer-head {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
  }
  .drawer-head h3 {
    margin: 0;
    font-size: 16px;
  }
  .detail {
    margin: 0 0 20px;
    display: grid;
    gap: 12px;
  }
  .detail dt {
    font-size: 11px;
    font-weight: 700;
    color: var(--color-muted);
    text-transform: uppercase;
    letter-spacing: 0.04em;
  }
  .detail dd {
    margin: 2px 0 0;
    font-size: 14px;
  }
  .field span {
    display: block;
    font-size: 12px;
    font-weight: 700;
    margin-bottom: 6px;
  }
  .field select {
    width: 100%;
    border: 1px solid var(--color-border);
    background: var(--color-bg);
    color: var(--color-text);
    padding: 10px 12px;
    border-radius: 10px;
  }
</style>
