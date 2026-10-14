<script lang="ts">
  import { onMount } from 'svelte';
  import { getSupportRepository } from '$features/support/di';
  import type { SupportTicket, TicketMessage, TicketStatus } from '$features/support/domain/entities';
  import { getAuthUser } from '$features/auth/ui/stores/auth.store.svelte';
  import { devLog, devError } from '$infrastructure/ui/dev-logger';

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

  let items = $state<SupportTicket[]>([]);
  let loading = $state(true);
  let error = $state('');
  let filter = $state<'all' | TicketStatus>('all');
  let updatingId = $state<string | null>(null);

  let selected = $state<SupportTicket | null>(null);
  let messages = $state<TicketMessage[]>([]);
  let loadingThread = $state(false);
  let reply = $state('');
  let replyInternal = $state(false);
  let sending = $state(false);

  const filtered = $derived(
    filter === 'all' ? items : items.filter((t) => t.status === filter)
  );

  async function load() {
    loading = true;
    error = '';
    try {
      items = await getSupportRepository().listAll();
      devLog('bo-support', `loaded ${items.length}`);
    } catch (e) {
      devError('bo-support', 'listAll failed', e, { file: 'BackofficeSupportPage.svelte' });
      error = e instanceof Error ? e.message : 'Error al cargar tickets';
    } finally {
      loading = false;
    }
  }

  async function openTicket(t: SupportTicket) {
    selected = t;
    loadingThread = true;
    messages = [];
    try {
      messages = await getSupportRepository().listMessages(t.id);
    } catch (e) {
      devError('bo-support', 'listMessages failed', e);
      error = e instanceof Error ? e.message : 'Error al cargar mensajes';
    } finally {
      loadingThread = false;
    }
  }

  async function changeStatus(t: SupportTicket, status: TicketStatus) {
    if (t.status === status) return;
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
    if (!selected || !reply.trim()) return;
    const user = getAuthUser();
    const name = user?.fullName ?? 'Agente';
    sending = true;
    try {
      const msg = await getSupportRepository().addAgentMessage(
        selected.id,
        name,
        reply.trim(),
        replyInternal
      );
      messages = [...messages, msg];
      reply = '';
      replyInternal = false;
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

  onMount(load);
</script>

<section class="page bo-page">
  <div class="section-head">
    <div>
      <div class="eyebrow">Backoffice</div>
      <h2>Soporte</h2>
    </div>
    <div class="head-actions">
      <select bind:value={filter} aria-label="Filtrar por estado">
        <option value="all">Todos ({items.length})</option>
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
    <p class="muted">Cargando tickets…</p>
  {:else if filtered.length === 0}
    <div class="card empty">
      <p>No hay tickets{filter !== 'all' ? ` “${statusLabel[filter]}”` : ''}.</p>
      <p class="muted">Prueba insertando uno en SQL o desde el canal público (cuando exista).</p>
    </div>
  {:else}
    <div class="table-wrap card">
      <table>
        <thead>
          <tr>
            <th>Código</th>
            <th>Asunto</th>
            <th>Cliente</th>
            <th>Prioridad</th>
            <th>Estado</th>
            <th>Creado</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {#each filtered as t (t.id)}
            <tr>
              <td><code>{t.trackingCode}</code></td>
              <td><strong>{t.subject}</strong></td>
              <td>
                {t.customerName}
                <div class="sub">{t.customerEmail}</div>
              </td>
              <td class="prio">{t.priority}</td>
              <td>
                <select
                  class="status-select"
                  value={t.status}
                  disabled={updatingId === t.id}
                  onchange={(e) =>
                    changeStatus(t, (e.currentTarget as HTMLSelectElement).value as TicketStatus)}
                >
                  {#each STATUSES as s}
                    <option value={s}>{statusLabel[s]}</option>
                  {/each}
                </select>
              </td>
              <td class="sub">{formatDate(t.createdAt)}</td>
              <td>
                <button type="button" class="link-btn" onclick={() => openTicket(t)}>Abrir</button>
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
        <div>
          <h3>{selected.subject}</h3>
          <code>{selected.trackingCode}</code>
        </div>
        <button type="button" class="link-btn" onclick={() => (selected = null)}>Cerrar</button>
      </div>

      <dl class="detail">
        <div><dt>Cliente</dt><dd>{selected.customerName} · {selected.customerEmail}</dd></div>
        {#if selected.customerPhone}
          <div><dt>Teléfono</dt><dd>{selected.customerPhone}</dd></div>
        {/if}
        <div><dt>Prioridad</dt><dd>{selected.priority}</dd></div>
        <div><dt>Estado</dt><dd>{statusLabel[selected.status]}</dd></div>
        <div><dt>Descripción</dt><dd class="desc">{selected.description}</dd></div>
      </dl>

      <label class="field">
        <span>Cambiar estado</span>
        <select
          value={selected.status}
          disabled={updatingId === selected.id}
          onchange={(e) =>
            changeStatus(
              selected!,
              (e.currentTarget as HTMLSelectElement).value as TicketStatus
            )}
        >
          {#each STATUSES as s}
            <option value={s}>{statusLabel[s]}</option>
          {/each}
        </select>
      </label>

      <h4 class="thread-title">Hilo</h4>
      {#if loadingThread}
        <p class="muted">Cargando mensajes…</p>
      {:else if messages.length === 0}
        <p class="muted">Sin mensajes aún. La descripción es el reporte inicial.</p>
      {:else}
        <ul class="thread">
          {#each messages as m (m.id)}
            <li class:agent={m.author === 'agent'} class:internal={m.isInternal}>
              <div class="msg-meta">
                <strong>{m.authorName}</strong>
                <span>{m.author}{m.isInternal ? ' · interno' : ''}</span>
                <time>{formatDate(m.createdAt)}</time>
              </div>
              <p>{m.body}</p>
            </li>
          {/each}
        </ul>
      {/if}

      <div class="reply">
        <textarea
          rows="3"
          placeholder="Respuesta al cliente…"
          bind:value={reply}
        ></textarea>
        <label class="check">
          <input type="checkbox" bind:checked={replyInternal} />
          Nota interna (no visible al cliente)
        </label>
        <button
          type="button"
          class="btn btn-primary btn-small"
          disabled={sending || !reply.trim()}
          onclick={sendReply}
        >
          {sending ? 'Enviando…' : 'Enviar'}
        </button>
      </div>
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
  .prio {
    text-transform: uppercase;
    font-size: 11px;
    font-weight: 700;
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
    width: min(440px, 100vw);
    z-index: 50;
    border-radius: 0;
    overflow: auto;
    padding: 24px;
    display: flex;
    flex-direction: column;
  }
  .drawer-head {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 12px;
    margin-bottom: 16px;
  }
  .drawer-head h3 {
    margin: 0 0 4px;
    font-size: 16px;
  }
  .detail {
    margin: 0 0 16px;
    display: grid;
    gap: 10px;
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
  .desc {
    white-space: pre-wrap;
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
  .thread-title {
    margin: 20px 0 10px;
    font-size: 13px;
  }
  .thread {
    list-style: none;
    margin: 0;
    padding: 0;
    display: grid;
    gap: 10px;
    flex: 1;
  }
  .thread li {
    padding: 12px;
    border-radius: 12px;
    background: var(--color-surface-2);
    border: 1px solid var(--color-border);
  }
  .thread li.agent {
    background: color-mix(in srgb, var(--color-primary) 8%, var(--color-surface));
  }
  .thread li.internal {
    border-style: dashed;
    opacity: 0.9;
  }
  .msg-meta {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    font-size: 11px;
    color: var(--color-muted);
    margin-bottom: 6px;
  }
  .msg-meta strong {
    color: var(--color-text);
  }
  .thread p {
    margin: 0;
    font-size: 13px;
    white-space: pre-wrap;
  }
  .reply {
    margin-top: 16px;
    display: grid;
    gap: 8px;
    border-top: 1px solid var(--color-border);
    padding-top: 16px;
  }
  .reply textarea {
    width: 100%;
    border: 1px solid var(--color-border);
    background: var(--color-bg);
    color: var(--color-text);
    padding: 10px 12px;
    border-radius: 10px;
    resize: vertical;
  }
  .check {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 12px;
    color: var(--color-muted);
  }
</style>
