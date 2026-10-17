<script lang="ts">
  import { onDestroy, onMount, tick } from 'svelte';
  import { fade, fly, scale, slide } from 'svelte/transition';
  import { cubicOut } from 'svelte/easing';
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
  import { ms, reveal, scrollDepth } from '$infrastructure/ui/util/motion';
  import Ambient from "$infrastructure/ui/component/Ambient.svelte";

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

  // Pasos del progreso (la cancelación y la espera del cliente son estados especiales)
  const reservationSteps: ReservationStatus[] = ['pending', 'confirmed', 'in_progress', 'completed'];
  const ticketSteps: TicketStatus[] = ['open', 'in_progress', 'resolved', 'closed'];

  const reservationIndex = (status: ReservationStatus) => reservationSteps.indexOf(status);
  const ticketIndex = (status: TicketStatus) =>
          status === 'waiting_customer' ? 1 : ticketSteps.indexOf(status);

  /* ─────────── Estado ─────────── */
  let codeInput = $state('');
  let loading = $state(false);
  let searched = $state(false);
  let error = $state('');
  let kind = $state<ResultKind>(null);

  let reservation = $state<Reservation | null>(null);
  let ticket = $state<SupportTicket | null>(null);
  let messages = $state<TicketMessage[]>([]);

  let resultsEl = $state<HTMLElement>();
  let copiedCode = $state('');
  let copiedTimer: ReturnType<typeof setTimeout> | undefined;

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

    // Lleva la vista al resultado (útil en móvil)
    if (kind && kind !== 'none') {
      await tick();
      resultsEl?.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'start' });
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

  const initials = (name: string) =>
          name
                  .split(/\s+/)
                  .filter(Boolean)
                  .slice(0, 2)
                  .map((part) => part[0]?.toUpperCase())
                  .join('') || '•';

  async function copy(code: string) {
    if (typeof navigator === 'undefined') return;
    try {
      await navigator.clipboard.writeText(code);
      copiedCode = code;
      clearTimeout(copiedTimer);
      copiedTimer = setTimeout(() => (copiedCode = ''), 2000);
    } catch {
      // Sin permiso de portapapeles: el código sigue visible para copiarlo a mano
    }
  }

  onMount(() => {
    const q = $page.url.searchParams.get('code');
    if (q) {
      codeInput = q.trim().toUpperCase();
      lookup(codeInput);
    }
  });

  onDestroy(() => clearTimeout(copiedTimer));

  /* ─────────── Encabezado ─────────── */
  const title = 'Consulta tu reserva o ticket.';
  const words = title.split(/\s+/);
</script>

<svelte:head>
  <title>Seguimiento | SOLUX</title>
</svelte:head>

<section class="page" use:scrollDepth>
  <Ambient />

  <!-- ───────── Encabezado ───────── -->
  <div class="section-head intro">
    <div>
      <div class="eyebrow rise" style="--i: 0">Seguimiento</div>
      <h2 class="headline" aria-label={title}>
        {#each words as word, i}
          <span class="word" aria-hidden="true"
          ><span class="word-in" style="--w: {i}">{word}</span></span
          >{' '}
        {/each}
      </h2>
    </div>
    <p class="rise" style="--i: 5">
      Introduce el código que recibiste al solicitar una visita o al abrir un ticket de soporte. No necesitas
      crear una cuenta.
    </p>
  </div>

  <!-- ───────── Búsqueda ───────── -->
  <form class="card search-card rise" style="--i: 6" onsubmit={onSubmit}>
    <label for="track-code">Código de seguimiento</label>
    <div class="search-row">
      <input
              id="track-code"
              name="code"
              autocomplete="off"
              spellcheck="false"
              placeholder="SLX-XXXXXXXX"
              bind:value={codeInput}
              oninput={() => (codeInput = codeInput.toUpperCase())}
              disabled={loading}
              aria-invalid={!!error && kind !== 'none'}
      />
      <button class="btn btn-primary submit" type="submit" disabled={loading}>
        {#if loading}
          <span class="spinner" aria-hidden="true"></span>Buscando…
        {:else}
          Consultar <span class="arrow" aria-hidden="true">→</span>
        {/if}
      </button>
    </div>
    <p class="hint">El código no distingue mayúsculas. Ejemplo: <code>SLX-A1B2C3D4</code></p>
  </form>

  {#if error && kind !== 'none'}
    <div class="banner-error" role="alert" transition:slide={{ duration: ms(220) }}>{error}</div>
  {/if}

  <div class="results" bind:this={resultsEl}>
    <!-- ───────── Cargando ───────── -->
    {#if loading}
      <article class="card result-card sk" aria-busy="true" aria-label="Buscando…" in:fade={{ duration: ms(200) }}>
        <div class="sk-block sk-line short"></div>
        <div class="sk-block sk-title"></div>
        <div class="sk-block sk-code"></div>
        <div class="sk-block sk-line"></div>
        <div class="sk-block sk-line mid"></div>
      </article>
    {/if}

    <!-- ───────── Sin resultados ───────── -->
    {#if searched && !loading && kind === 'none'}
      <div class="card empty-card" in:fly={{ y: 20, duration: ms(450), easing: cubicOut }}>
        <div class="empty-icon" aria-hidden="true">⌕</div>
        <h3>Sin resultados</h3>
        <p>{error || 'Revisa el código e inténtalo de nuevo.'}</p>
        <a class="btn btn-ghost" href="/contacto">Contactar a SOLUX</a>
      </div>
    {/if}

    <!-- ───────── Reserva ───────── -->
    {#if reservation}
      {@const rIdx = reservationIndex(reservation.status)}
      <article class="card result-card" in:fly={{ y: 24, duration: ms(500), easing: cubicOut }}>
        <header class="result-head">
          <div>
            <span class="kind-badge">Reserva</span>
            <h3>Visita técnica</h3>
          </div>
          <span class="status-badge" data-status={reservation.status}
          >{reservationStatusLabel[reservation.status]}</span
          >
        </header>

        {@render stepper(
                reservationSteps.map((s) => reservationStatusLabel[s]),
                rIdx,
                reservation.status === 'cancelled'
        )}
        {#if reservation.status === 'cancelled'}
          <p class="cancelled-note" in:slide={{ duration: ms(250) }}>Esta reserva fue cancelada.</p>
        {/if}

        {@render codeLine(reservation.trackingCode)}

        <dl class="grid">
          <div>
            <dt>Cliente</dt>
            <dd>{reservation.customerName}</dd>
          </div>
          <div>
            <dt>Servicio</dt>
            <dd>{reservation.serviceCategory}</dd>
          </div>
          <div>
            <dt>Fecha preferida</dt>
            <dd>{formatDay(reservation.preferredDate)}</dd>
          </div>
          <div>
            <dt>Franja</dt>
            <dd>{slotLabel[reservation.preferredTimeSlot] ?? reservation.preferredTimeSlot}</dd>
          </div>
          <div class="wide">
            <dt>Dirección / zona</dt>
            <dd>{reservation.address || '—'}</dd>
          </div>
          {#if reservation.notes}
            <div class="wide">
              <dt>Notas</dt>
              <dd class="notes">{reservation.notes}</dd>
            </div>
          {/if}
        </dl>

        <footer class="result-foot">
          <span>Registrada {formatDate(reservation.createdAt)}</span>
          <span>Actualizada {formatDate(reservation.updatedAt)}</span>
        </footer>
      </article>
    {/if}

    <!-- ───────── Ticket ───────── -->
    {#if ticket}
      <article
              class="card result-card"
              in:fly={{ y: 24, duration: ms(500), delay: ms(reservation ? 140 : 0), easing: cubicOut }}
      >
        <header class="result-head">
          <div>
            <span class="kind-badge ticket">Soporte</span>
            <h3>{ticket.subject}</h3>
          </div>
          <span class="status-badge ticket" data-tstatus={ticket.status}
          >{ticketStatusLabel[ticket.status]}</span
          >
        </header>

        {@render stepper(
                ticketSteps.map((s) => ticketStatusLabel[s]),
                ticketIndex(ticket.status),
                false
        )}
        {#if ticket.status === 'waiting_customer'}
          <p class="waiting-note" in:slide={{ duration: ms(250) }}>
            <span class="live" aria-hidden="true"></span>
            El equipo espera tu respuesta para continuar. Puedes escribirnos desde
            <a href="/contacto">Contacto</a>.
          </p>
        {/if}

        {@render codeLine(ticket.trackingCode)}

        <dl class="grid">
          <div>
            <dt>Cliente</dt>
            <dd>{ticket.customerName}</dd>
          </div>
          <div>
            <dt>Prioridad</dt>
            <dd class="cap">{ticket.priority}</dd>
          </div>
          <div class="wide">
            <dt>Reporte inicial</dt>
            <dd class="notes">{ticket.description}</dd>
          </div>
        </dl>

        <div class="thread">
          <h4>Conversación</h4>
          {#if messages.length === 0}
            <p class="muted">Aún no hay respuestas públicas en este ticket.</p>
          {:else}
            <ul>
              {#each messages as m, i (m.id)}
                <li
                        class:agent={m.author === 'agent'}
                        class:customer={m.author === 'customer'}
                        in:fly={{
                    x: m.author === 'agent' ? 24 : -24,
                    duration: ms(420),
                    delay: ms(Math.min(i, 6) * 80),
                    easing: cubicOut
                  }}
                >
                  <span class="avatar" aria-hidden="true">{initials(m.authorName)}</span>
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
  </div>

  <!-- ───────── Ayuda ───────── -->
  <div class="help-row rv" use:reveal>
    <p>¿Necesitas una visita técnica nueva?</p>
    <div class="help-actions">
      <a class="btn btn-primary" href="/reservas">Reservar <span class="arrow" aria-hidden="true">→</span></a>
      <a class="btn btn-ghost" href="/contacto">Contacto</a>
    </div>
  </div>
</section>

<!-- ───────── Fragmentos reutilizables ───────── -->
{#snippet stepper(labels: string[], index: number, cancelled: boolean)}
  <ol
          class="stepper"
          class:cancelled
          style="--n: {labels.length}; --p: {cancelled ? 0 : Math.max(index, 0) / (labels.length - 1)}"
          aria-label="Progreso"
  >
    {#each labels as label, i}
      {@const done = !cancelled && i < index}
      {@const current = !cancelled && i === index}
      <li class="step" class:done class:current aria-current={current ? 'step' : undefined}>
        <span class="step-dot">{done ? '✓' : i + 1}</span>
        <span class="step-label">{label}</span>
      </li>
    {/each}
  </ol>
{/snippet}

{#snippet codeLine(code: string)}
  <div class="code-line">
    <span>Código</span>
    <strong>{code}</strong>
    <button type="button" class="copy" onclick={() => copy(code)}>
      {copiedCode === code ? 'Copiado ✓' : 'Copiar'}
    </button>
  </div>
{/snippet}

<style>
  .page {
    --ease: cubic-bezier(0.22, 1, 0.36, 1);
    --media-bg: var(--color-surface-2, var(--color-border));
    isolation: isolate;
  }

  /* ───────── Entrada del encabezado ───────── */
  .rise {
    animation: rise 0.8s var(--ease) both;
    animation-delay: calc(var(--i, 0) * 90ms);
  }
  @keyframes rise {
    from {
      opacity: 0;
      transform: translateY(18px);
    }
  }
  .intro .eyebrow {
    display: inline-block;
    margin-bottom: 18px;
  }
  .headline {
    margin-block: inherit;
  }
  .word {
    display: inline-block;
    overflow: hidden;
    vertical-align: top;
    padding-block: 0.12em;
    margin-block: -0.12em;
  }
  .word-in {
    display: inline-block;
    animation: word-up 0.95s var(--ease) both;
    animation-delay: calc(0.2s + var(--w) * 80ms);
  }
  @keyframes word-up {
    from {
      transform: translateY(115%) rotate(4deg);
    }
  }

  /* ───────── Revelado al hacer scroll ───────── */
  .rv {
    opacity: 0;
    transform: translateY(28px) scale(0.98);
    filter: blur(6px);
    transition:
            opacity 0.7s var(--ease),
            transform 0.7s var(--ease),
            filter 0.7s var(--ease);
    transition-delay: var(--delay, 0ms);
  }
  .rv:global(.in) {
    opacity: 1;
    transform: none;
    filter: none;
  }
  .arrow {
    display: inline-block;
    transition: transform 0.25s var(--ease);
  }
  a:hover > .arrow,
  a:focus-visible > .arrow,
  button:hover > .arrow {
    transform: translateX(4px);
  }

  /* ───────── Búsqueda ───────── */
  .search-card {
    padding: clamp(18px, 2.6vw, 28px);
    margin-bottom: 22px;
  }
  .search-card label {
    display: block;
    margin-bottom: 10px;
    font-size: 12px;
    font-weight: 700;
    color: var(--color-muted);
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
    padding: 14px 16px;
    border-radius: 14px;
    font-size: 18px;
    font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    transition:
            border-color 0.25s var(--ease),
            box-shadow 0.25s var(--ease);
  }
  .search-row input:focus {
    outline: none;
    border-color: var(--color-primary);
    box-shadow: 0 0 0 4px color-mix(in srgb, var(--color-primary) 18%, transparent);
  }
  .search-row input[aria-invalid='true'] {
    border-color: #c0392b;
  }
  .submit {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    transition:
            transform 0.25s var(--ease),
            opacity 0.25s var(--ease);
  }
  .submit:not(:disabled):hover {
    transform: translateY(-2px);
  }
  .submit:not(:disabled):active {
    transform: scale(0.98);
  }
  .submit:disabled {
    opacity: 0.8;
    cursor: progress;
  }
  .spinner {
    width: 14px;
    height: 14px;
    border: 2px solid currentColor;
    border-right-color: transparent;
    border-radius: 50%;
    animation: spin 0.7s linear infinite;
  }
  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
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

  /* ───────── Resultados ───────── */
  .results {
    scroll-margin-top: 90px;
  }
  .empty-card {
    text-align: center;
    padding: 40px 24px;
    margin-bottom: 22px;
  }
  .empty-icon {
    width: 56px;
    height: 56px;
    margin: 0 auto 12px;
    border-radius: 18px;
    display: grid;
    place-items: center;
    background: var(--media-bg);
    color: var(--color-primary);
    font-size: 24px;
    animation: wobble 3.2s ease-in-out infinite;
  }
  @keyframes wobble {
    0%,
    100% {
      transform: rotate(0);
    }
    25% {
      transform: rotate(-8deg);
    }
    75% {
      transform: rotate(8deg);
    }
  }
  .empty-card h3 {
    margin: 0 0 8px;
  }
  .empty-card p {
    color: var(--color-muted);
    margin: 0 0 16px;
  }
  .result-card {
    padding: clamp(18px, 2.6vw, 28px);
    margin-bottom: 18px;
  }
  .result-head {
    display: flex;
    justify-content: space-between;
    gap: 16px;
    align-items: flex-start;
    margin-bottom: 22px;
  }
  .result-head h3 {
    margin: 8px 0 0;
    font-size: 20px;
  }
  .kind-badge {
    display: inline-block;
    padding: 3px 10px;
    border-radius: 999px;
    font-size: 11px;
    font-weight: 800;
    color: var(--color-primary);
    background: color-mix(in srgb, var(--color-primary) 12%, transparent);
  }
  .kind-badge.ticket {
    color: #2980b9;
    background: color-mix(in srgb, #3498db 16%, transparent);
  }
  .status-badge {
    padding: 6px 12px;
    border-radius: 999px;
    font-size: 12px;
    font-weight: 800;
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
    background: var(--media-bg);
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
    background: var(--media-bg);
    color: var(--color-muted);
  }

  /* ───────── Progreso (stepper) ───────── */
  .stepper {
    position: relative;
    list-style: none;
    margin: 0 0 18px;
    padding: 0;
    display: grid;
    grid-template-columns: repeat(var(--n), minmax(0, 1fr));
  }
  /* Pista y relleno entre los centros de los puntos */
  .stepper::before,
  .stepper::after {
    content: '';
    position: absolute;
    top: 15px;
    left: calc(100% / (var(--n) * 2));
    right: calc(100% / (var(--n) * 2));
    height: 2px;
    border-radius: 2px;
  }
  .stepper::before {
    background: var(--color-border);
  }
  .stepper::after {
    background: linear-gradient(90deg, var(--color-primary), var(--color-accent));
    transform: scaleX(var(--p));
    transform-origin: left;
    animation: fill 1.2s var(--ease) 0.3s both;
  }
  @keyframes fill {
    from {
      transform: scaleX(0);
    }
  }
  .step {
    position: relative;
    z-index: 1;
    display: grid;
    justify-items: center;
    gap: 8px;
    text-align: center;
  }
  .step-dot {
    width: 32px;
    height: 32px;
    display: grid;
    place-items: center;
    border-radius: 50%;
    border: 2px solid var(--color-border);
    background: var(--color-surface);
    color: var(--color-muted);
    font-size: 12px;
    font-weight: 800;
  }
  .step-label {
    font-size: 12px;
    font-weight: 700;
    color: var(--color-muted);
  }
  .step.done .step-dot {
    border-color: var(--color-primary);
    background: var(--color-primary);
    color: white;
  }
  .step.done .step-label {
    color: var(--color-text);
  }
  .step.current .step-dot {
    border-color: var(--color-primary);
    background: var(--color-primary);
    color: white;
    animation: current-ring 2.2s ease-out infinite;
  }
  .step.current .step-label {
    color: var(--color-primary);
  }
  @keyframes current-ring {
    0% {
      box-shadow: 0 0 0 0 rgba(8, 120, 62, 0.55);
    }
    70%,
    100% {
      box-shadow: 0 0 0 12px rgba(8, 120, 62, 0);
    }
  }
  .stepper.cancelled .step-dot {
    opacity: 0.6;
  }
  .cancelled-note,
  .waiting-note {
    display: flex;
    align-items: center;
    gap: 10px;
    margin: 0 0 18px;
    padding: 10px 14px;
    border-radius: 12px;
    font-size: 13px;
  }
  .cancelled-note {
    color: #a93226;
    background: color-mix(in srgb, #c0392b 12%, var(--color-surface));
    border: 1px solid color-mix(in srgb, #c0392b 30%, var(--color-border));
  }
  .waiting-note {
    color: #b9770e;
    background: color-mix(in srgb, #f39c12 14%, var(--color-surface));
    border: 1px solid color-mix(in srgb, #f39c12 35%, var(--color-border));
  }
  .waiting-note a {
    color: inherit;
    font-weight: 800;
    text-decoration: underline;
  }
  .live {
    flex: 0 0 8px;
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: #f39c12;
    animation: ping 1.8s ease-out infinite;
  }
  @keyframes ping {
    0% {
      box-shadow: 0 0 0 0 rgba(243, 156, 18, 0.6);
    }
    100% {
      box-shadow: 0 0 0 9px rgba(243, 156, 18, 0);
    }
  }

  /* ───────── Código ───────── */
  .code-line {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 12px 14px;
    margin-bottom: 18px;
    border-radius: 12px;
    background: color-mix(in srgb, var(--color-primary) 8%, var(--color-surface));
    border: 1px dashed color-mix(in srgb, var(--color-primary) 35%, var(--color-border));
  }
  .code-line span {
    font-size: 12px;
    font-weight: 700;
    color: var(--color-muted);
  }
  .code-line strong {
    margin-right: auto;
    font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
    letter-spacing: 0.08em;
    color: var(--color-primary);
    font-size: 18px;
  }
  .copy {
    padding: 5px 12px;
    border: 1px solid var(--color-border);
    border-radius: 999px;
    background: transparent;
    color: var(--color-muted);
    font: inherit;
    font-size: 12px;
    font-weight: 700;
    cursor: pointer;
    transition:
            border-color 0.25s var(--ease),
            color 0.25s var(--ease),
            transform 0.25s var(--ease);
  }
  .copy:hover {
    border-color: var(--color-primary);
    color: var(--color-primary);
    transform: translateY(-1px);
  }
  .copy:focus-visible {
    outline: 2px solid var(--color-primary);
    outline-offset: 2px;
  }

  /* ───────── Datos ───────── */
  .grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 16px;
    margin: 0;
  }
  .grid .wide {
    grid-column: 1 / -1;
  }
  .grid dt {
    margin-bottom: 4px;
    font-size: 12px;
    font-weight: 700;
    color: var(--color-muted);
  }
  .grid dd {
    margin: 0;
    font-size: 14px;
    font-weight: 600;
  }
  .grid dd.notes {
    font-weight: 500;
    white-space: pre-wrap;
    line-height: 1.55;
  }
  .cap {
    text-transform: capitalize;
  }
  .result-foot {
    display: flex;
    flex-wrap: wrap;
    gap: 12px 18px;
    margin-top: 18px;
    padding-top: 14px;
    border-top: 1px solid var(--color-border);
    font-size: 12px;
    color: var(--color-muted);
  }

  /* ───────── Conversación ───────── */
  .thread {
    margin-top: 22px;
  }
  .thread h4 {
    margin: 0 0 12px;
    font-size: 13px;
    color: var(--color-muted);
  }
  .thread .muted {
    color: var(--color-muted);
    font-size: 13px;
  }
  .thread ul {
    list-style: none;
    margin: 0;
    padding: 0 4px 0 0;
    max-height: 520px;
    overflow-y: auto;
    display: flex;
    flex-direction: column;
    gap: 12px;
  }
  .thread li {
    display: flex;
    align-items: flex-end;
    gap: 8px;
  }
  .thread li.agent {
    flex-direction: row-reverse;
  }
  .avatar {
    flex: 0 0 30px;
    width: 30px;
    height: 30px;
    display: grid;
    place-items: center;
    border-radius: 50%;
    background: var(--media-bg);
    color: var(--color-muted);
    font-size: 11px;
    font-weight: 800;
  }
  .agent .avatar {
    background: var(--color-primary);
    color: white;
  }
  .bubble {
    max-width: min(460px, 86%);
    padding: 12px 14px;
    border-radius: 16px 16px 16px 4px;
    background: var(--color-surface);
    border: 1px solid var(--color-border);
  }
  .agent .bubble {
    border-radius: 16px 16px 4px 16px;
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
    overflow-wrap: anywhere;
  }

  /* ───────── Carga (esqueleto) ───────── */
  .sk-block {
    border-radius: 10px;
    background: linear-gradient(
            90deg,
            var(--color-border) 25%,
            rgba(255, 255, 255, 0.12) 50%,
            var(--color-border) 75%
    )
    0 0 / 200% 100%;
    animation: shimmer 1.5s linear infinite;
  }
  .sk-line {
    height: 12px;
    margin: 12px 0;
  }
  .sk-line.short {
    width: 20%;
  }
  .sk-line.mid {
    width: 65%;
  }
  .sk-title {
    height: 26px;
    width: 45%;
    margin: 14px 0 26px;
  }
  .sk-code {
    height: 48px;
    margin-bottom: 20px;
  }
  @keyframes shimmer {
    to {
      background-position: -200% 0;
    }
  }

  /* ───────── Ayuda ───────── */
  .help-row {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: space-between;
    gap: 14px;
    margin-top: 8px;
    padding: 18px 22px;
    border: 1px solid var(--color-border);
    border-radius: 20px;
    background: rgba(255, 255, 255, 0.03);
    backdrop-filter: blur(10px);
    color: var(--color-muted);
    font-size: 14px;
  }
  .help-row p {
    margin: 0;
  }
  .help-actions {
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
  }

  /* ───────── Responsive ───────── */
  @media (max-width: 700px) {
    .grid {
      grid-template-columns: 1fr;
    }
    .result-head {
      flex-direction: column;
    }
    .step-label {
      font-size: 11px;
    }
    .code-line {
      flex-wrap: wrap;
    }
  }

  /* ───────── Accesibilidad: reduce el movimiento ───────── */
  @media (prefers-reduced-motion: reduce) {
    .rise,
    .word-in,
    .spinner,
    .empty-icon,
    .live,
    .sk-block,
    .step.current .step-dot,
    .stepper::after {
      animation: none;
    }
    .rv {
      opacity: 1;
      transform: none;
      filter: none;
      transition: none;
    }
    .submit,
    .copy,
    .arrow,
    .search-row input {
      transition: none;
    }
  }
</style>