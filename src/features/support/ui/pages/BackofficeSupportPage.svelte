<script lang="ts">
  import { onMount } from 'svelte';
  import { getSupportRepository } from '$features/support/di';
  import type {
    SupportTicket,
    TicketMessage,
    TicketStatus,
    TicketPriority
  } from '$features/support/domain/entities';
  import { getAuthUser } from '$features/auth/ui/stores/auth.store.svelte';
  import { devLog, devError } from '$infrastructure/ui/dev-logger';
  import ResizableSplit from '$infrastructure/ui/ResizableSplit.svelte';

  const STATUSES: TicketStatus[] = [
    'open',
    'in_progress',
    'waiting_customer',
    'resolved',
    'closed'
  ];

  const statusLabel: Record<TicketStatus, string> = {
    open: 'Abierto',
    in_progress: 'En curso',
    waiting_customer: 'Espera cliente',
    resolved: 'Resuelto',
    closed: 'Cerrado'
  };

  const priorityLabel: Record<TicketPriority, string> = {
    low: 'Baja',
    medium: 'Media',
    high: 'Alta',
    urgent: 'Urgente'
  };

  let items = $state<SupportTicket[]>([]);
  let loading = $state(true);
  let error = $state('');
  let filter = $state<'all' | TicketStatus>('all');
  let search = $state('');
  let updatingId = $state<string | null>(null);

  let selected = $state<SupportTicket | null>(null);
  let messages = $state<TicketMessage[]>([]);
  let loadingThread = $state(false);
  let reply = $state('');
  let replyInternal = $state(false);
  let sending = $state(false);

  const counts = $derived(
    STATUSES.reduce(
      (acc, s) => {
        acc[s] = items.filter((t) => t.status === s).length;
        return acc;
      },
      {} as Record<TicketStatus, number>
    )
  );

  const filtered = $derived.by(() => {
    let list = filter === 'all' ? items : items.filter((t) => t.status === filter);
    const q = search.trim().toLowerCase();
    if (q) {
      list = list.filter(
        (t) =>
          t.trackingCode.toLowerCase().includes(q) ||
          t.subject.toLowerCase().includes(q) ||
          t.customerName.toLowerCase().includes(q) ||
          t.customerEmail.toLowerCase().includes(q)
      );
    }
    return list;
  });

  let loadRequest = 0;
  let threadRequest = 0;

  async function load() {
    if (loading) return;
    const request = ++loadRequest;
    loading = true;
    error = '';
    try {
      const result = await getSupportRepository().listAll();
      if (request !== loadRequest) return;
      items = result;
      devLog('bo-support', `loaded ${items.length}`);
      if (selected) {
        const fresh = items.find((t) => t.id === selected!.id);
        if (fresh) selected = fresh;
        else {
          selected = null;
          messages = [];
          threadRequest++;
        }
      }
    } catch (e) {
      if (request !== loadRequest) return;
      devError('bo-support', 'listAll failed', e, { file: 'BackofficeSupportPage.svelte' });
      error = e instanceof Error ? e.message : 'Error al cargar tickets';
    } finally {
      if (request === loadRequest) loading = false;
    }
  }

  async function openTicket(t: SupportTicket) {
    const request = ++threadRequest;
    selected = t;
    loadingThread = true;
    messages = [];
    reply = '';
    replyInternal = false;
    error = '';
    try {
      const result = await getSupportRepository().listMessages(t.id);
      if (request !== threadRequest || selected?.id !== t.id) return;
      messages = result;
    } catch (e) {
      if (request !== threadRequest || selected?.id !== t.id) return;
      devError('bo-support', 'listMessages failed', e);
      error = e instanceof Error ? e.message : 'Error al cargar mensajes';
    } finally {
      if (request === threadRequest) loadingThread = false;
    }
  }

  async function changeStatus(t: SupportTicket, status: TicketStatus) {
    if (t.status === status || updatingId !== null || sending) return;
    if ((status === 'resolved' || status === 'closed') && !confirm(`¿Cambiar ticket ${t.trackingCode} a ${statusLabel[status].toLowerCase()}?`)) return;
    error = '';
    updatingId = t.id;
    try {
      const updated = await getSupportRepository().updateStatus(t.id, status);
      items = items.map((x) => (x.id === t.id ? updated : x));
      if (selected?.id === t.id) selected = updated;
      devLog('bo-support', 'status updated', { id: t.id, status });
    } catch (e) {
      devError('bo-support', 'updateStatus failed', e);
      error = e instanceof Error ? e.message : 'No se pudo actualizar';
    } finally {
      updatingId = null;
    }
  }

  async function sendReply() {
    const ticket = selected;
    const body = reply.trim();
    const internal = replyInternal;
    if (!ticket || !body || sending || loadingThread || updatingId !== null) return;
    const user = getAuthUser();
    const name = user?.fullName ?? 'Agente';
    error = '';
    sending = true;
    try {
      const msg = await getSupportRepository().addAgentMessage(ticket.id, name, body, internal);
      if (selected?.id === ticket.id) {
        messages = [...messages, msg];
        reply = '';
        replyInternal = false;
      }
    } catch (e) {
      devError('bo-support', 'addAgentMessage failed', e);
      error = e instanceof Error ? e.message : 'No se pudo enviar';
    } finally {
      sending = false;
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

<ResizableSplit storageKey="solux-bo-support-split" initialLeft={360} minLeft={280} maxLeft={560}>
  {#snippet left()}
    <section class="list-pane">
      <header class="pane-header">
        <div>
          <p class="eyebrow">Backoffice</p>
          <h1>Soporte</h1>
        </div>
        <button type="button" class="icon-btn" onclick={load} disabled={loading || updatingId !== null || sending} title="Actualizar">
          {loading ? '…' : '↻'}
        </button>
      </header>

      <div class="search-row">
        <input type="search" placeholder="Buscar código, cliente, asunto…" bind:value={search} />
      </div>

      <div class="chips" role="tablist">
        <button type="button" class="chip" class:active={filter === 'all'} onclick={() => (filter = 'all')}>
          Todos <span>{items.length}</span>
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

      <div class="ticket-list">
        {#if loading && items.length === 0}
          <div class="skeleton-stack">
            {#each [1, 2, 3, 4] as _}<div class="skeleton-card"></div>{/each}
          </div>
        {:else if filtered.length === 0}
          <div class="empty-state">
            <div class="empty-icon">◈</div>
            <p>No hay tickets aquí</p>
            <small>Cambia el filtro o crea uno de prueba en Supabase</small>
          </div>
        {:else}
          {#each filtered as t (t.id)}
            <button
              type="button"
              class="ticket-card"
              class:selected={selected?.id === t.id}
              disabled={loadingThread || sending || updatingId !== null}
              onclick={() => openTicket(t)}
            >
              <div class="ticket-top">
                <code>{t.trackingCode}</code>
                <span class="time">{relativeHint(t.createdAt)}</span>
              </div>
              <strong class="subject">{t.subject}</strong>
              <div class="ticket-meta">
                <span class="who">{t.customerName}</span>
                <span class="badge status" data-status={t.status}>{statusLabel[t.status]}</span>
                <span class="badge prio" data-prio={t.priority}>{priorityLabel[t.priority]}</span>
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
          <div class="empty-icon big">✉</div>
          <h2>Selecciona un ticket</h2>
          <p>Revisa el hilo, cambia el estado y responde al cliente.</p>
        </div>
      {:else}
        <header class="detail-header">
          <div class="detail-title">
            <div class="code-row">
              <code>{selected.trackingCode}</code>
              <span class="badge status" data-status={selected.status}>{statusLabel[selected.status]}</span>
              <span class="badge prio" data-prio={selected.priority}>{priorityLabel[selected.priority]}</span>
            </div>
            <h2>{selected.subject}</h2>
          </div>
          <div class="status-control">
            <label for="status-select">Estado</label>
            <select
              id="status-select"
              value={selected.status}
              disabled={updatingId !== null || sending}
              onchange={(e) =>
                changeStatus(selected!, (e.currentTarget as HTMLSelectElement).value as TicketStatus)}
            >
              {#each STATUSES as s}
                <option value={s}>{statusLabel[s]}</option>
              {/each}
            </select>
          </div>
        </header>

        <div class="customer-card">
          <div class="avatar">{selected.customerName.slice(0, 1).toUpperCase()}</div>
          <div>
            <strong>{selected.customerName}</strong>
            <div class="contact-line">{selected.customerEmail}</div>
            {#if selected.customerPhone}<div class="contact-line">{selected.customerPhone}</div>{/if}
          </div>
          <div class="dates">
            <span>Creado {formatDate(selected.createdAt)}</span>
            <span>Act. {formatDate(selected.updatedAt)}</span>
          </div>
        </div>

        <div class="report-box">
          <h3>Reporte inicial</h3>
          <p>{selected.description}</p>
        </div>

        <div class="thread-wrap">
          <h3>Conversación</h3>
          {#if loadingThread}
            <div class="skeleton-stack compact">
              <div class="skeleton-card"></div>
              <div class="skeleton-card"></div>
            </div>
          {:else if messages.length === 0}
            <p class="muted-hint">Aún no hay mensajes. Escribe la primera respuesta abajo.</p>
          {:else}
            <ul class="thread">
              {#each messages as m (m.id)}
                <li
                  class:from-agent={m.author === 'agent'}
                  class:from-customer={m.author === 'customer'}
                  class:internal={m.isInternal}
                >
                  <div class="bubble">
                    <div class="bubble-head">
                      <strong>{m.authorName}</strong>
                      {#if m.isInternal}<em>interno</em>{/if}
                      <time>{formatDate(m.createdAt)}</time>
                    </div>
                    <p>{m.body}</p>
                  </div>
                </li>
              {/each}
            </ul>
          {/if}
        </div>

        <footer class="composer">
          <textarea
            rows="3"
            placeholder={replyInternal ? 'Nota interna (solo staff)…' : 'Escribe una respuesta al cliente…'}
            bind:value={reply}
            onkeydown={(e) => {
              if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) sendReply();
            }}
          ></textarea>
          <div class="composer-bar">
            <label class="toggle">
              <input type="checkbox" bind:checked={replyInternal} />
              <span>Nota interna</span>
            </label>
            <button
              type="button"
              class="btn btn-primary"
              disabled={sending || loadingThread || updatingId !== null || !reply.trim()}
              onclick={sendReply}
            >
              {sending ? 'Enviando…' : replyInternal ? 'Guardar nota' : 'Enviar respuesta'}
            </button>
          </div>
        </footer>
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
  .icon-btn:disabled {
    opacity: 0.5;
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
  .ticket-list {
    flex: 1;
    overflow-y: auto;
    overflow-x: hidden;
    padding: 0 10px 16px;
    display: flex;
    flex-direction: column;
    gap: 6px;
    min-width: 0;
  }
  .ticket-card {
    text-align: left;
    border: 1px solid transparent;
    background: transparent;
    border-radius: 14px;
    padding: 12px 14px;
    color: var(--color-text);
    cursor: pointer;
    min-width: 0;
  }
  .ticket-card:hover {
    background: var(--color-surface-2);
  }
  .ticket-card.selected {
    background: color-mix(in srgb, var(--color-primary) 10%, var(--color-surface));
    border-color: color-mix(in srgb, var(--color-primary) 35%, var(--color-border));
  }
  .ticket-top {
    display: flex;
    justify-content: space-between;
    margin-bottom: 4px;
  }
  .ticket-top code {
    font-size: 11px;
    font-weight: 800;
    color: var(--color-primary);
  }
  .time {
    font-size: 10px;
    color: var(--color-muted);
  }
  .subject {
    display: block;
    font-size: 13.5px;
    margin-bottom: 8px;
  }
  .ticket-meta {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    align-items: center;
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
  .badge.status[data-status='open'] {
    background: color-mix(in srgb, #3498db 18%, transparent);
    color: #2980b9;
  }
  .badge.status[data-status='in_progress'] {
    background: color-mix(in srgb, var(--color-primary) 16%, transparent);
    color: var(--color-primary);
  }
  .badge.status[data-status='waiting_customer'] {
    background: color-mix(in srgb, var(--color-accent) 22%, transparent);
    color: #b8860b;
  }
  .badge.status[data-status='resolved'] {
    background: color-mix(in srgb, #27ae60 16%, transparent);
    color: #1e8449;
  }
  .badge.status[data-status='closed'] {
    background: var(--color-surface-2);
    color: var(--color-muted);
  }
  .badge.prio[data-prio='low'] {
    background: var(--color-surface-2);
    color: var(--color-muted);
  }
  .badge.prio[data-prio='medium'] {
    background: color-mix(in srgb, #3498db 14%, transparent);
    color: #2980b9;
  }
  .badge.prio[data-prio='high'] {
    background: color-mix(in srgb, #e67e22 18%, transparent);
    color: #d35400;
  }
  .badge.prio[data-prio='urgent'] {
    background: color-mix(in srgb, #e74c3c 18%, transparent);
    color: #c0392b;
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
    height: 72px;
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
    overflow: hidden;
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
  .report-box {
    margin: 14px 28px 0;
    padding: 14px 16px;
    background: color-mix(in srgb, var(--color-accent) 8%, var(--color-surface));
    border: 1px solid color-mix(in srgb, var(--color-accent) 25%, var(--color-border));
    border-radius: 14px;
  }
  .report-box h3 {
    margin: 0 0 8px;
    font-size: 11px;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: var(--color-muted);
  }
  .report-box p {
    margin: 0;
    font-size: 14px;
    line-height: 1.55;
    white-space: pre-wrap;
  }
  .thread-wrap {
    flex: 1;
    overflow-y: auto;
    padding: 18px 28px;
  }
  .thread-wrap h3 {
    margin: 0 0 12px;
    font-size: 12px;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: var(--color-muted);
  }
  .muted-hint {
    color: var(--color-muted);
    font-size: 13px;
  }
  .thread {
    list-style: none;
    margin: 0;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: 12px;
  }
  .thread li {
    display: flex;
  }
  .thread li.from-agent {
    justify-content: flex-end;
  }
  .bubble {
    max-width: min(420px, 92%);
    padding: 12px 14px;
    border-radius: 16px;
    background: var(--color-surface);
    border: 1px solid var(--color-border);
  }
  .from-agent .bubble {
    background: color-mix(in srgb, var(--color-primary) 12%, var(--color-surface));
    border-color: color-mix(in srgb, var(--color-primary) 25%, var(--color-border));
    border-bottom-right-radius: 4px;
  }
  .from-customer .bubble {
    border-bottom-left-radius: 4px;
  }
  .thread li.internal .bubble {
    border-style: dashed;
    background: var(--color-surface-2);
  }
  .bubble-head {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    margin-bottom: 6px;
    font-size: 11px;
    color: var(--color-muted);
  }
  .bubble-head strong {
    color: var(--color-text);
  }
  .bubble-head em {
    font-style: normal;
    font-weight: 800;
    font-size: 10px;
    text-transform: uppercase;
    color: #b8860b;
  }
  .bubble p {
    margin: 0;
    font-size: 13.5px;
    line-height: 1.5;
    white-space: pre-wrap;
  }
  .composer {
    border-top: 1px solid var(--color-border);
    background: var(--color-surface);
    padding: 14px 28px 18px;
  }
  .composer textarea {
    width: 100%;
    border: 1px solid var(--color-border);
    background: var(--color-bg);
    color: var(--color-text);
    padding: 12px 14px;
    border-radius: 14px;
    resize: vertical;
    min-height: 72px;
    font-size: 14px;
    outline: none;
  }
  .composer textarea:focus {
    border-color: var(--color-primary);
    box-shadow: 0 0 0 3px color-mix(in srgb, var(--color-primary) 14%, transparent);
  }
  .composer-bar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    margin-top: 10px;
  }
  .toggle {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    font-size: 12px;
    font-weight: 600;
    color: var(--color-muted);
  }
  .composer .btn:disabled {
    opacity: 0.55;
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
  }
</style>
