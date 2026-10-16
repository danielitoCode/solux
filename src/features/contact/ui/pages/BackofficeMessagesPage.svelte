<script lang="ts">
  import { onMount } from 'svelte';
  import { getContactMessageRepository } from '$features/contact/di';
  import type { ContactMessage, ContactSubject } from '$features/contact/domain/entities';
  import { devLog, devError } from '$infrastructure/ui/dev-logger';
  import ResizableSplit from '$infrastructure/ui/ResizableSplit.svelte';

  type Filter = 'all' | 'unread' | 'read' | ContactSubject;

  const subjectLabel: Record<ContactSubject, string> = {
    quote: 'Cotización',
    general: 'General',
    partnership: 'Alianza',
    other: 'Otro'
  };

  let items = $state<ContactMessage[]>([]);
  let loading = $state(true);
  let error = $state('');
  let filter = $state<Filter>('all');
  let search = $state('');
  let updatingIds = $state<string[]>([]);
  let loadRequestId = 0;
  let selected = $state<ContactMessage | null>(null);

  const unreadCount = $derived(items.filter((m) => !m.isRead).length);
  const readCount = $derived(items.filter((m) => m.isRead).length);

  const filtered = $derived.by(() => {
    let list = items;
    if (filter === 'unread') list = list.filter((m) => !m.isRead);
    else if (filter === 'read') list = list.filter((m) => m.isRead);
    else if (filter === 'quote' || filter === 'general' || filter === 'partnership' || filter === 'other') {
      list = list.filter((m) => m.subject === filter);
    }
    const q = search.trim().toLowerCase();
    if (q) {
      list = list.filter(
        (m) =>
          m.name.toLowerCase().includes(q) ||
          m.email.toLowerCase().includes(q) ||
          m.message.toLowerCase().includes(q) ||
          (m.phone?.toLowerCase().includes(q) ?? false)
      );
    }
    return list;
  });

  async function load() {
    const requestId = ++loadRequestId;
    loading = true;
    error = '';
    try {
      const result = await getContactMessageRepository().listAll();
      if (requestId !== loadRequestId) return;
      items = result;
      devLog('bo-messages', `loaded ${result.length}`);
      if (selected) {
        selected = result.find((m) => m.id === selected!.id) ?? null;
      }
    } catch (e) {
      if (requestId !== loadRequestId) return;
      devError('bo-messages', 'listAll failed', e, { file: 'BackofficeMessagesPage.svelte' });
      error = e instanceof Error ? e.message : 'Error al cargar mensajes';
    } finally {
      if (requestId === loadRequestId) loading = false;
    }
  }

  async function openMessage(m: ContactMessage) {
    selected = m;
    if (!m.isRead) {
      await setRead(m, true);
    }
  }

  async function setRead(m: ContactMessage, isRead: boolean) {
    if (updatingIds.includes(m.id) || m.isRead === isRead) return;
    updatingIds = [...updatingIds, m.id];
    try {
      const updated = await getContactMessageRepository().markRead(m.id, isRead);
      items = items.map((x) => (x.id === m.id ? updated : x));
      if (selected?.id === m.id) selected = updated;
      devLog('bo-messages', 'markRead', { id: m.id, isRead });
    } catch (e) {
      devError('bo-messages', 'markRead failed', e);
      error = e instanceof Error ? e.message : 'No se pudo actualizar';
    } finally {
      updatingIds = updatingIds.filter((id) => id !== m.id);
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

<ResizableSplit storageKey="solux-bo-messages-split" initialLeft={360} minLeft={280} maxLeft={560}>
  {#snippet left()}
    <section class="list-pane">
      <header class="pane-header">
        <div>
          <p class="eyebrow">Backoffice</p>
          <h1>Mensajes</h1>
        </div>
        <button type="button" class="icon-btn" onclick={load} disabled={loading || updatingIds.length > 0} title="Actualizar">
          {loading ? '…' : '↻'}
        </button>
      </header>

      <div class="search-row">
        <input type="search" placeholder="Buscar nombre, email, texto…" bind:value={search} />
      </div>

      <div class="chips" role="tablist">
        <button type="button" class="chip" class:active={filter === 'all'} onclick={() => (filter = 'all')}>
          Todos <span>{items.length}</span>
        </button>
        <button type="button" class="chip" class:active={filter === 'unread'} onclick={() => (filter = 'unread')}>
          No leídos <span>{unreadCount}</span>
        </button>
        <button type="button" class="chip" class:active={filter === 'read'} onclick={() => (filter = 'read')}>
          Leídos <span>{readCount}</span>
        </button>
        {#each Object.entries(subjectLabel) as [key, label]}
          <button
            type="button"
            class="chip"
            class:active={filter === key}
            onclick={() => (filter = key as ContactSubject)}
          >
            {label}
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
            <p>No hay mensajes aquí</p>
            <small>Cambia el filtro o recibe uno desde el formulario de contacto</small>
          </div>
        {:else}
          {#each filtered as m (m.id)}
            <button
              type="button"
              class="item-card"
              class:selected={selected?.id === m.id}
              class:unread={!m.isRead}
              onclick={() => openMessage(m)} disabled={updatingIds.includes(m.id)}
            >
              <div class="item-top">
                <span class="badge subject">{subjectLabel[m.subject]}</span>
                <span class="time">{relativeHint(m.createdAt)}</span>
              </div>
              <strong class="subject">{m.name}</strong>
              <div class="preview">{m.message}</div>
              <div class="item-meta">
                <span class="who">{m.email}</span>
                {#if !m.isRead}
                  <span class="dot-unread" title="No leído"></span>
                {/if}
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
          <h2>Selecciona un mensaje</h2>
          <p>Lee la consulta y márcala como leída o no leída.</p>
        </div>
      {:else}
        <header class="detail-header">
          <div class="detail-title">
            <div class="code-row">
              <span class="badge subject">{subjectLabel[selected.subject]}</span>
              {#if selected.isRead}
                <span class="badge status read">Leído</span>
              {:else}
                <span class="badge status unread">No leído</span>
              {/if}
            </div>
            <h2>{selected.name}</h2>
          </div>
          <div class="actions">
            {#if selected.isRead}
              <button
                type="button"
                class="btn btn-ghost"
                disabled={updatingIds.includes(selected.id)}
                onclick={() => setRead(selected!, false)}
              >
                Marcar no leído
              </button>
            {:else}
              <button
                type="button"
                class="btn btn-primary"
                disabled={updatingId === selected.id}
                onclick={() => setRead(selected!, true)}
              >
                Marcar leído
              </button>
            {/if}
          </div>
        </header>

        <div class="customer-card">
          <div class="avatar">{selected.name.slice(0, 1).toUpperCase()}</div>
          <div>
            <strong>{selected.name}</strong>
            <div class="contact-line">
              <a href="mailto:{selected.email}">{selected.email}</a>
            </div>
            {#if selected.phone}
              <div class="contact-line">
                <a href="tel:{selected.phone}">{selected.phone}</a>
              </div>
            {/if}
          </div>
          <div class="dates">
            <span>{formatDate(selected.createdAt)}</span>
          </div>
        </div>

        <div class="message-box">
          <h3>Mensaje</h3>
          <p>{selected.message}</p>
        </div>

        <div class="quick-actions">
          <a class="btn btn-primary" href="mailto:{selected.email}?subject=Re: SOLUX — {subjectLabel[selected.subject]}">
            Responder por email
          </a>
          {#if selected.phone}
            <a class="btn btn-ghost" href="tel:{selected.phone}">Llamar</a>
          {/if}
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
  .item-card.unread {
    background: color-mix(in srgb, var(--color-primary) 5%, transparent);
  }
  .item-card.unread .subject {
    font-weight: 800;
  }
  .item-top {
    display: flex;
    justify-content: space-between;
    gap: 8px;
    margin-bottom: 4px;
  }
  .time {
    font-size: 10px;
    color: var(--color-muted);
    flex-shrink: 0;
  }
  .subject {
    display: block;
    font-size: 13.5px;
    margin-bottom: 4px;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .preview {
    font-size: 12px;
    color: var(--color-muted);
    display: -webkit-box;
    line-clamp: 2;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
    margin-bottom: 6px;
    line-height: 1.4;
  }
  .item-meta {
    display: flex;
    align-items: center;
    gap: 8px;
  }
  .who {
    font-size: 11px;
    color: var(--color-muted);
  }
  .dot-unread {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: var(--color-primary);
    flex-shrink: 0;
  }
  .badge {
    font-size: 10px;
    font-weight: 800;
    text-transform: uppercase;
    letter-spacing: 0.04em;
    padding: 3px 8px;
    border-radius: 999px;
  }
  .badge.subject {
    background: color-mix(in srgb, var(--color-primary) 14%, transparent);
    color: var(--color-primary);
  }
  .badge.status.read {
    background: color-mix(in srgb, #27ae60 16%, transparent);
    color: #1e8449;
  }
  .badge.status.unread {
    background: color-mix(in srgb, #f39c12 18%, transparent);
    color: #b9770e;
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
    align-items: flex-start;
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
  .actions {
    display: flex;
    gap: 8px;
    flex-shrink: 0;
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
  }
  .message-box {
    margin: 16px 28px;
    padding: 18px 16px;
    background: var(--color-surface);
    border: 1px solid var(--color-border);
    border-radius: 16px;
    flex: 1;
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
    padding: 0 28px 28px;
  }
  @media (max-width: 900px) {
    .customer-card {
      grid-template-columns: auto 1fr;
    }
    .dates {
      grid-column: 1 / -1;
      text-align: left;
    }
  }
</style>
