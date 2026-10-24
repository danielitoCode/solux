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
  import { intentLabel, sourceLabel } from '$infrastructure/ui/lead-labels';

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
  let intentFilter = $state<'all' | string>('all');
  let sourceFilter = $state<'all' | string>('all');
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

  const intentCounts = $derived.by(() => {
    const acc: Record<string, number> = {};
    for (const t of items) acc[t.intent] = (acc[t.intent] ?? 0) + 1;
    return acc;
  });
  const sourceCounts = $derived.by(() => {
    const acc: Record<string, number> = {};
    for (const t of items) acc[t.source] = (acc[t.source] ?? 0) + 1;
    return acc;
  });
  const intentKeys = $derived(Object.keys(intentCounts).sort());
  const sourceKeys = $derived(Object.keys(sourceCounts).sort());

  const filtered = $derived.by(() => {
    let list = filter === 'all' ? items : items.filter((t) => t.status === filter);
    if (intentFilter !== 'all') list = list.filter((t) => t.intent === intentFilter);
    if (sourceFilter !== 'all') list = list.filter((t) => t.source === sourceFilter);
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
      devLog('bo-support', 'status', { id: t.id, status });
    } catch (e) {
      devError('bo-support', 'updateStatus failed', e);
      error = e instanceof Error ? e.message : 'No se pudo actualizar el estado';
    } finally {
      updatingId = null;
    }
  }

  async function sendReply() {
    if (!selected || !reply.trim() || sending || updatingId !== null) return;
    const body = reply.trim();
    const isInternal = replyInternal;
    const ticketId = selected.id;
    sending = true;
    error = '';
    try {
      const user = getAuthUser();
      const authorName = user?.fullName || user?.email || 'Agente';
      const msg = await getSupportRepository().addAgentMessage(
        ticketId,
        authorName,
        body,
        isInternal
      );
      if (selected?.id === ticketId) {
        messages = [...messages, msg];
        reply = '';
        replyInternal = false;
      }
      devLog('bo-support', 'reply sent', { ticketId, isInternal });
    } catch (e) {
      devError('bo-support', 'addAgentMessage failed', e);
      error = e instanceof Error ? e.message : 'No se pudo enviar la respuesta';
    } finally {
      sending = false;
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

      <div class="chips" role="tablist" aria-label="Estado">
        <button type="button" class="chip" class:active={filter === 'all'} onclick={() => (filter = 'all')}>
          Todos <span>{items.length}</span>
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

      <div class="ticket-list">
        {#if loading && items.length === 0}
          <div class="skeleton-stack">
            {#each [1, 2, 3, 4] as _}<div class="skeleton-card"></div>{/each}
          </div>
        {:else if filtered.length === 0}
          <div class="empty-state">
            <div class="empty-icon">◈</div>
            <p>No hay tickets aquí</p>
            <small>Cambia el filtro o crea uno desde el formulario público</small>
          </div>
        {:else}
          {#each filtered as t (t.id)}
            <button
              type="button"
              class="item-card"
              class:selected={selected?.id === t.id}
              onclick={() => openTicket(t)}
              disabled={loading || updatingId !== null || sending}
            >
              <div class="item-top">
                <code>{t.trackingCode}</code>
                <span class="time">{relativeHint(t.createdAt)}</span>
              </div>
              <strong class="subject">{t.subject}</strong>
              <div class="item-meta">
                <span class="who">{t.customerName}</span>
                <span class="badge lead" title="Intención">{intentLabel(t.intent)}</span>
                <span class="badge lead muted" title="Origen">{sourceLabel(t.source)}</span>
                <span class="badge status" data-status={t.status}>{statusLabel[t.status]}</span>
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
          <p>Gestiona el estado y responde al cliente desde aquí.</p>
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
            <h2>{selected.subject}</h2>
          </div>
          <div class="actions">
            <label class="field-inline">
              <span>Estado</span>
              <select
                value={selected.status}
                disabled={updatingId === selected.id || sending}
                onchange={(e) => changeStatus(selected!, (e.currentTarget as HTMLSelectElement).value as TicketStatus)}
              >
                {#each STATUSES as s}
                  <option value={s}>{statusLabel[s]}</option>
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
            {#if selected.customerPhone}
              <div class="contact-line">
                <a href="tel:{selected.customerPhone}">{selected.customerPhone}</a>
              </div>
            {/if}
          </div>
          <div class="dates">
            <span>Creado {formatDate(selected.createdAt)}</span>
            <span>Actualizado {formatDate(selected.updatedAt)}</span>
          </div>
        </div>

        <div class="message-box">
          <h3>Descripción</h3>
          <p>{selected.description}</p>
        </div>

        <div class="thread-section">
          <h3>Conversación</h3>
          {#if loadingThread}
            <p class="muted-hint">Cargando mensajes…</p>
          {:else if messages.length === 0}
            <p class="muted-hint">Sin mensajes aún. Escribe la primera respuesta.</p>
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

        <div class="composer">
          <textarea
            placeholder="Escribe una respuesta al cliente…"
            bind:value={reply}
            disabled={sending || updatingId !== null}
            rows="3"
          ></textarea>
          <div class="composer-bar">
            <label class="toggle">
              <input type="checkbox" bind:checked={replyInternal} disabled={sending} />
              Nota interna
            </label>
            <button
              type="button"
              class="btn btn-primary"
              disabled={!reply.trim() || sending || updatingId !== null}
              onclick={sendReply}
            >
              {sending ? 'Enviando…' : 'Enviar'}
            </button>
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
    background: color-mix(in srgb, var(--color-primary) 12%, var(--color-surface));
    color: var(--color-primary);
  }
  .badge.lead.muted {
    background: var(--color-surface-2);
    color: var(--color-muted);
  }
  .badge.status[data-status='open'] {
    background: color-mix(in srgb, #3498db 15%, var(--color-surface));
    color: #2980b9;
  }
  .badge.status[data-status='in_progress'] {
    background: color-mix(in srgb, #f39c12 15%, var(--color-surface));
    color: #d68910;
  }
  .badge.status[data-status='waiting_customer'] {
    background: color-mix(in srgb, #9b59b6 15%, var(--color-surface));
    color: #8e44ad;
  }
  .badge.status[data-status='resolved'] {
    background: color-mix(in srgb, #27ae60 15%, var(--color-surface));
    color: #1e8449;
  }
  .badge.status[data-status='closed'] {
    background: var(--color-surface-2);
    color: var(--color-muted);
  }
  .skeleton-stack {
    display: flex;
    flex-direction: column;
    gap: 8px;
    padding: 4px;
  }
  .skeleton-card {
    height: 72px;
    border-radius: 14px;
    background: linear-gradient(90deg, var(--color-surface-2) 25%, var(--color-surface) 50%, var(--color-surface-2) 75%);
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
  .empty-state {
    text-align: center;
    padding: 48px 20px;
    color: var(--color-muted);
  }
  .empty-icon {
    font-size: 28px;
    margin-bottom: 8px;
    opacity: 0.5;
  }
  .empty-icon.big {
    font-size: 48px;
  }
  .empty-state p {
    margin: 0 0 4px;
    font-weight: 700;
    color: var(--color-text);
  }
  .empty-state small {
    font-size: 12px;
  }

  .detail-pane {
    display: flex;
    flex-direction: column;
    height: 100%;
    min-height: 0;
    overflow-y: auto;
    padding: 0 0 24px;
  }
  .detail-pane.empty {
    justify-content: center;
  }
  .empty-detail {
    text-align: center;
    padding: 40px 24px;
    color: var(--color-muted);
  }
  .empty-detail h2 {
    margin: 12px 0 6px;
    color: var(--color-text);
    font-size: 18px;
  }
  .empty-detail p {
    margin: 0;
    font-size: 13px;
  }
  .detail-header {
    display: flex;
    flex-wrap: wrap;
    gap: 16px;
    justify-content: space-between;
    align-items: flex-start;
    padding: 22px 24px 16px;
    border-bottom: 1px solid var(--color-border);
  }
  .detail-title h2 {
    margin: 8px 0 0;
    font-size: 20px;
    letter-spacing: -0.03em;
  }
  .code-row {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 8px;
  }
  .code-row code {
    font-size: 12px;
    font-weight: 800;
    color: var(--color-primary);
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
    border-radius: 10px;
    padding: 8px 12px;
    font-size: 13px;
  }
  .customer-card {
    display: flex;
    flex-wrap: wrap;
    gap: 14px;
    align-items: center;
    margin: 16px 24px;
    padding: 14px 16px;
    border-radius: 14px;
    background: var(--color-surface-2);
    border: 1px solid var(--color-border);
  }
  .avatar {
    width: 40px;
    height: 40px;
    border-radius: 12px;
    background: var(--color-primary);
    color: white;
    display: grid;
    place-items: center;
    font-weight: 800;
    font-size: 16px;
    flex-shrink: 0;
  }
  .contact-line {
    font-size: 12px;
  }
  .contact-line a {
    color: var(--color-primary);
  }
  .dates {
    margin-left: auto;
    display: flex;
    flex-direction: column;
    gap: 2px;
    font-size: 11px;
    color: var(--color-muted);
    text-align: right;
  }
  .message-box {
    margin: 0 24px 16px;
    padding: 14px 16px;
    border-radius: 12px;
    border: 1px solid var(--color-border);
    background: var(--color-surface);
  }
  .message-box h3 {
    margin: 0 0 8px;
    font-size: 12px;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    color: var(--color-muted);
  }
  .message-box p {
    margin: 0;
    font-size: 14px;
    line-height: 1.5;
    white-space: pre-wrap;
  }
  .thread-section {
    margin: 0 24px 16px;
    flex: 1;
  }
  .thread-section h3 {
    margin: 0 0 12px;
    font-size: 12px;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    color: var(--color-muted);
  }
  .muted-hint {
    margin: 0;
    font-size: 13px;
    color: var(--color-muted);
  }
  .thread {
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
  .thread li.from-agent {
    justify-content: flex-end;
  }
  .thread li.from-customer {
    justify-content: flex-start;
  }
  .bubble {
    max-width: min(480px, 90%);
    padding: 10px 14px;
    border-radius: 14px;
    background: var(--color-surface-2);
    border: 1px solid var(--color-border);
  }
  .from-agent .bubble {
    background: color-mix(in srgb, var(--color-primary) 10%, var(--color-surface));
    border-color: color-mix(in srgb, var(--color-primary) 25%, var(--color-border));
  }
  .internal .bubble {
    border-style: dashed;
    opacity: 0.9;
  }
  .bubble-head {
    display: flex;
    flex-wrap: wrap;
    align-items: baseline;
    gap: 8px;
    margin-bottom: 4px;
    font-size: 11px;
  }
  .bubble-head strong {
    font-size: 12px;
  }
  .bubble-head em {
    font-style: normal;
    font-size: 10px;
    font-weight: 800;
    text-transform: uppercase;
    color: var(--color-muted);
  }
  .bubble-head time {
    margin-left: auto;
    color: var(--color-muted);
  }
  .bubble p {
    margin: 0;
    font-size: 13.5px;
    line-height: 1.45;
    white-space: pre-wrap;
  }
  .composer {
    margin: 0 24px;
    padding: 14px;
    border-radius: 14px;
    border: 1px solid var(--color-border);
    background: var(--color-surface);
  }
  .composer textarea {
    width: 100%;
    box-sizing: border-box;
    border: 1px solid var(--color-border);
    border-radius: 10px;
    background: var(--color-bg);
    color: var(--color-text);
    padding: 10px 12px;
    font-size: 13px;
    resize: vertical;
    min-height: 72px;
    font-family: inherit;
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
    gap: 6px;
    font-size: 12px;
    color: var(--color-muted);
    cursor: pointer;
  }
</style>
