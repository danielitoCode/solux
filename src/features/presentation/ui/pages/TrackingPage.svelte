<script lang="ts">
  import { onMount } from 'svelte';
  import { page } from '$app/stores';
  import { getReservationRepository } from '$features/reservations/di';
  import { getSupportRepository } from '$features/support/di';
  import type { Reservation, ReservationStatus } from '$features/reservations/domain/entities';
  import type {
    SupportTicket,
    TicketMessage,
    TicketStatus
  } from '$features/support/domain/entities';
  import { devLog, devError } from '$infrastructure/ui/dev-logger';

  type ResultKind = 'reservation' | 'ticket' | 'both' | 'none' | null;

  const reservationStatusLabel: Record<ReservationStatus, string> = {
    pending: 'Pendiente',
    confirmed: 'Confirmada',
    in_progress: 'En curso',
    completed: 'Completada',
    cancelled: 'Cancelada'
  };

  const ticketStatusLabel: Record<TicketStatus, string> = {
    open: 'Abierto',
    in_progress: 'En curso',
    waiting_customer: 'Esperando tu respuesta',
    resolved: 'Resuelto',
    closed: 'Cerrado'
  };

  let codeInput = $state('');
  let loading = $state(false);
  let searched = $state(false);
  let error = $state('');
  let kind = $state<ResultKind>(null);

  let reservation = $state<Reservation | null>(null);
  let ticket = $state<SupportTicket | null>(null);
  let messages = $state<TicketMessage[]>([]);

  async function lookup(raw: string) {
    const code = raw.trim().toUpperCase();
    if (!code) {
      error = 'Escribe tu código de seguimiento (ej. SLX-XXXXXXXX).';
      return;
    }

    loading = true;
    error = '';
    searched = true;
    reservation = null;
    ticket = null;
    messages = [];
    kind = null;

    try {
      const [res, tkt] = await Promise.all([
        getReservationRepository().getByTrackingCode(code),
        getSupportRepository().getByTrackingCode(code)
      ]);

      reservation = res;
      ticket = tkt;

      if (tkt) {
        messages = await getSupportRepository().getMessagesByTrackingCode(code);
      }

      if (res && tkt) kind = 'both';
      else if (res) kind = 'reservation';
      else if (tkt) kind = 'ticket';
      else {
        kind = 'none';
        error = 'No encontramos ninguna reserva ni ticket con ese código.';
      }

      devLog('tracking-public', 'lookup', { code, kind });
    } catch (e) {
      devError('tracking-public', 'lookup failed', e, { file: 'TrackingPage.svelte' });
      error = e instanceof Error ? e.message : 'No se pudo consultar el código.';
      kind = null;
    } finally {
      loading = false;
    }
  }

  function onSubmit(e: SubmitEvent) {
    e.preventDefault();
    lookup(codeInput);
  }

  function formatDate(iso: string) {
    try {
      return new Date(iso).toLocaleString('es-CU', {
        dateStyle: 'medium',
        timeStyle: 'short'
      });
    } catch {
      return iso;
    }
  }

  function formatDay(iso: string) {
    try {
      return new Date(iso + (iso.length === 10 ? 'T12:00:00' : '')).toLocaleDateString('es-CU', {
        dateStyle: 'medium'
      });
    } catch {
      return iso;
    }
  }

  const slotLabel: Record<string, string> = {
    morning: 'Mañana (8:00 – 12:00)',
    afternoon: 'Tarde (12:00 – 17:00)',
    evening: 'Final del día (17:00 – 19:00)',
    flexible: 'Flexible / a convenir'
  };

  onMount(() => {
    const q = $page.url.searchParams.get('code');
    if (q) {
      codeInput = q.trim().toUpperCase();
      lookup(codeInput);
    }
  });
</script>

<svelte:head>
  <title>Seguimiento | SOLUX</title>
</svelte:head>

<section class="page">
  <div class="section-head">
    <div>
      <div class="eyebrow">Seguimiento</div>
      <h2>Consulta tu reserva o ticket.</h2>
    </div>
    <p>
      Introduce el código que recibiste al solicitar una visita o al abrir un ticket de soporte. No necesitas crear una
      cuenta.
    </p>
  </div>

  <form class="card search-card" onsubmit={onSubmit}>
    <label for="track-code">Código de seguimiento</label>
    <div class="search-row">
      <input
        id="track-code"
        name="code"
        autocomplete="off"
        spellcheck="false"
        placeholder="SLX-XXXXXXXX"
        bind:value={codeInput}
        disabled={loading}
      />
      <button class="btn btn-primary" type="submit" disabled={loading}>
        {loading ? 'Buscando…' : 'Consultar'}
      </button>
    </div>
    <p class="hint">El código no distingue mayúsculas. Ejemplo: <code>SLX-A1B2C3D4</code></p>
  </form>

  {#if error && kind !== 'none'}
    <div class="banner-error" role="alert">{error}</div>
  {/if}

  {#if searched && !loading && kind === 'none'}
    <div class="card empty-card">
      <div class="empty-icon">⌕</div>
      <h3>Sin resultados</h3>
      <p>{error || 'Revisa el código e inténtalo de nuevo.'}</p>
      <a class="btn btn-ghost" href="/contacto">Contactar a SOLUX</a>
    </div>
  {/if}

  {#if reservation}
    <article class="card result-card">
      <header class="result-head">
        <div>
          <span class="kind-badge">Reserva</span>
          <h3>Visita técnica</h3>
        </div>
        <span class="status-badge" data-status={reservation.status}
          >{reservationStatusLabel[reservation.status]}</span
        >
      </header>

      <div class="code-line">
        <span>Código</span>
        <strong>{reservation.trackingCode}</strong>
      </div>

      <div class="grid">
        <div>
          <span class="label">Cliente</span>
          <p>{reservation.customerName}</p>
        </div>
        <div>
          <span class="label">Servicio</span>
          <p>{reservation.serviceCategory}</p>
        </div>
        <div>
          <span class="label">Fecha preferida</span>
          <p>{formatDay(reservation.preferredDate)}</p>
        </div>
        <div>
          <span class="label">Franja</span>
          <p>{slotLabel[reservation.preferredTimeSlot] ?? reservation.preferredTimeSlot}</p>
        </div>
        <div class="wide">
          <span class="label">Dirección / zona</span>
          <p>{reservation.address || '—'}</p>
        </div>
        {#if reservation.notes}
          <div class="wide">
            <span class="label">Notas</span>
            <p class="notes">{reservation.notes}</p>
          </div>
        {/if}
      </div>

      <footer class="result-foot">
        <span>Registrada {formatDate(reservation.createdAt)}</span>
        <span>Actualizada {formatDate(reservation.updatedAt)}</span>
      </footer>

      <div class="timeline" aria-hidden="true">
        {#each (['pending', 'confirmed', 'in_progress', 'completed'] as ReservationStatus[]) as step, i}
          {@const idx = (['pending', 'confirmed', 'in_progress', 'completed'] as ReservationStatus[]).indexOf(
            reservation.status === 'cancelled' ? 'pending' : reservation.status
          )}
          <div
            class="node"
            class:done={reservation.status !== 'cancelled' && i <= idx}
            class:current={reservation.status === step}
            class:cancelled={reservation.status === 'cancelled' && step === 'pending'}
          >
            <span class="dot"></span>
            <span>{reservationStatusLabel[step]}</span>
          </div>
        {/each}
        {#if reservation.status === 'cancelled'}
          <div class="node cancelled current">
            <span class="dot"></span>
            <span>Cancelada</span>
          </div>
        {/if}
      </div>
    </article>
  {/if}

  {#if ticket}
    <article class="card result-card">
      <header class="result-head">
        <div>
          <span class="kind-badge ticket">Soporte</span>
          <h3>{ticket.subject}</h3>
        </div>
        <span class="status-badge ticket" data-tstatus={ticket.status}
          >{ticketStatusLabel[ticket.status]}</span
        >
      </header>

      <div class="code-line">
        <span>Código</span>
        <strong>{ticket.trackingCode}</strong>
      </div>

      <div class="grid">
        <div>
          <span class="label">Cliente</span>
          <p>{ticket.customerName}</p>
        </div>
        <div>
          <span class="label">Prioridad</span>
          <p class="cap">{ticket.priority}</p>
        </div>
        <div class="wide">
          <span class="label">Reporte inicial</span>
          <p class="notes">{ticket.description}</p>
        </div>
      </div>

      <div class="thread">
        <h4>Conversación</h4>
        {#if messages.length === 0}
          <p class="muted">Aún no hay respuestas públicas en este ticket.</p>
        {:else}
          <ul>
            {#each messages as m (m.id)}
              <li class:agent={m.author === 'agent'} class:customer={m.author === 'customer'}>
                <div class="bubble">
                  <div class="bubble-head">
                    <strong>{m.authorName}</strong>
                    <time>{formatDate(m.createdAt)}</time>
                  </div>
                  <p>{m.body}</p>
                </div>
              </li>
            {/each}
          </ul>
        {/if}
      </div>

      <footer class="result-foot">
        <span>Abierto {formatDate(ticket.createdAt)}</span>
        <span>Actualizado {formatDate(ticket.updatedAt)}</span>
      </footer>
    </article>
  {/if}

  <div class="help-row">
    <p>¿Necesitas una visita técnica nueva?</p>
    <a class="btn btn-primary" href="/reservas">Reservar</a>
    <a class="btn btn-ghost" href="/contacto">Contacto</a>
  </div>
</section>

<style>
  .search-card {
    padding: 22px 24px;
    margin-bottom: 22px;
  }
  .search-card label {
    display: block;
    font-size: 12px;
    font-weight: 800;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: var(--color-muted);
    margin-bottom: 10px;
  }
  .search-row {
    display: flex;
    gap: 10px;
    flex-wrap: wrap;
  }
  .search-row input {
    flex: 1;
    min-width: 200px;
    border: 1px solid var(--color-border);
    background: var(--color-bg);
    color: var(--color-text);
    padding: 12px 14px;
    border-radius: 12px;
    font-size: 16px;
    font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
    letter-spacing: 0.06em;
    text-transform: uppercase;
  }
  .hint {
    margin: 10px 0 0;
    font-size: 12px;
    color: var(--color-muted);
  }
  .hint code {
    font-size: 11px;
  }
  .banner-error {
    margin-bottom: 16px;
    padding: 12px 14px;
    border-radius: 12px;
    background: color-mix(in srgb, #c0392b 12%, var(--color-surface));
    border: 1px solid color-mix(in srgb, #c0392b 30%, var(--color-border));
    color: #a93226;
    font-size: 13px;
  }
  .empty-card {
    text-align: center;
    padding: 40px 24px;
    margin-bottom: 22px;
  }
  .empty-icon {
    width: 52px;
    height: 52px;
    margin: 0 auto 12px;
    border-radius: 16px;
    display: grid;
    place-items: center;
    background: var(--color-surface-2);
    color: var(--color-primary);
    font-size: 22px;
  }
  .empty-card h3 {
    margin: 0 0 8px;
  }
  .empty-card p {
    color: var(--color-muted);
    margin: 0 0 16px;
  }
  .result-card {
    padding: 24px;
    margin-bottom: 18px;
  }
  .result-head {
    display: flex;
    justify-content: space-between;
    gap: 16px;
    align-items: flex-start;
    margin-bottom: 16px;
  }
  .result-head h3 {
    margin: 8px 0 0;
    font-size: 20px;
  }
  .kind-badge {
    display: inline-block;
    font-size: 10px;
    font-weight: 800;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    color: var(--color-primary);
    background: color-mix(in srgb, var(--color-primary) 12%, transparent);
    padding: 3px 8px;
    border-radius: 999px;
  }
  .kind-badge.ticket {
    color: #2980b9;
    background: color-mix(in srgb, #3498db 16%, transparent);
  }
  .status-badge {
    font-size: 11px;
    font-weight: 800;
    text-transform: uppercase;
    letter-spacing: 0.04em;
    padding: 6px 10px;
    border-radius: 999px;
    white-space: nowrap;
  }
  .status-badge[data-status='pending'] {
    background: color-mix(in srgb, #f39c12 18%, transparent);
    color: #b9770e;
  }
  .status-badge[data-status='confirmed'] {
    background: color-mix(in srgb, #3498db 18%, transparent);
    color: #2980b9;
  }
  .status-badge[data-status='in_progress'] {
    background: color-mix(in srgb, var(--color-primary) 16%, transparent);
    color: var(--color-primary);
  }
  .status-badge[data-status='completed'] {
    background: color-mix(in srgb, #27ae60 16%, transparent);
    color: #1e8449;
  }
  .status-badge[data-status='cancelled'] {
    background: var(--color-surface-2);
    color: var(--color-muted);
  }
  .status-badge.ticket[data-tstatus='open'] {
    background: color-mix(in srgb, #3498db 18%, transparent);
    color: #2980b9;
  }
  .status-badge.ticket[data-tstatus='in_progress'] {
    background: color-mix(in srgb, var(--color-primary) 16%, transparent);
    color: var(--color-primary);
  }
  .status-badge.ticket[data-tstatus='waiting_customer'] {
    background: color-mix(in srgb, #f39c12 18%, transparent);
    color: #b9770e;
  }
  .status-badge.ticket[data-tstatus='resolved'] {
    background: color-mix(in srgb, #27ae60 16%, transparent);
    color: #1e8449;
  }
  .status-badge.ticket[data-tstatus='closed'] {
    background: var(--color-surface-2);
    color: var(--color-muted);
  }
  .code-line {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 12px;
    padding: 12px 14px;
    border-radius: 12px;
    background: color-mix(in srgb, var(--color-primary) 8%, var(--color-surface));
    border: 1px dashed color-mix(in srgb, var(--color-primary) 35%, var(--color-border));
    margin-bottom: 16px;
  }
  .code-line span {
    font-size: 11px;
    font-weight: 800;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: var(--color-muted);
  }
  .code-line strong {
    font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
    letter-spacing: 0.08em;
    color: var(--color-primary);
    font-size: 18px;
  }
  .grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 14px;
  }
  .grid .wide {
    grid-column: 1 / -1;
  }
  .label {
    display: block;
    font-size: 11px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    color: var(--color-muted);
    margin-bottom: 4px;
  }
  .grid p {
    margin: 0;
    font-size: 14px;
    font-weight: 600;
  }
  .grid p.notes {
    font-weight: 500;
    white-space: pre-wrap;
    line-height: 1.5;
  }
  .cap {
    text-transform: capitalize;
  }
  .result-foot {
    display: flex;
    flex-wrap: wrap;
    gap: 12px 18px;
    margin-top: 16px;
    padding-top: 14px;
    border-top: 1px solid var(--color-border);
    font-size: 12px;
    color: var(--color-muted);
  }
  .timeline {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    margin-top: 16px;
  }
  .node {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 6px 12px;
    border-radius: 999px;
    border: 1px solid var(--color-border);
    font-size: 11px;
    font-weight: 700;
    color: var(--color-muted);
  }
  .node .dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: var(--color-border);
  }
  .node.done {
    color: var(--color-primary);
    border-color: color-mix(in srgb, var(--color-primary) 30%, var(--color-border));
  }
  .node.done .dot {
    background: var(--color-primary);
  }
  .node.current {
    background: var(--color-primary);
    border-color: var(--color-primary);
    color: white;
  }
  .node.current .dot {
    background: white;
  }
  .node.cancelled.current {
    background: #c0392b;
    border-color: #c0392b;
  }
  .thread {
    margin-top: 18px;
  }
  .thread h4 {
    margin: 0 0 12px;
    font-size: 12px;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: var(--color-muted);
  }
  .thread .muted {
    color: var(--color-muted);
    font-size: 13px;
  }
  .thread ul {
    list-style: none;
    margin: 0;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: 10px;
  }
  .thread li {
    display: flex;
  }
  .thread li.agent {
    justify-content: flex-end;
  }
  .bubble {
    max-width: min(440px, 92%);
    padding: 12px 14px;
    border-radius: 16px;
    background: var(--color-surface);
    border: 1px solid var(--color-border);
  }
  .agent .bubble {
    background: color-mix(in srgb, var(--color-primary) 10%, var(--color-surface));
    border-color: color-mix(in srgb, var(--color-primary) 25%, var(--color-border));
  }
  .bubble-head {
    display: flex;
    justify-content: space-between;
    gap: 10px;
    margin-bottom: 6px;
    font-size: 11px;
    color: var(--color-muted);
  }
  .bubble p {
    margin: 0;
    font-size: 14px;
    line-height: 1.5;
    white-space: pre-wrap;
  }
  .help-row {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 12px;
    margin-top: 8px;
    padding: 18px 0 8px;
    color: var(--color-muted);
    font-size: 14px;
  }
  @media (max-width: 700px) {
    .grid {
      grid-template-columns: 1fr;
    }
    .result-head {
      flex-direction: column;
    }
  }
</style>
