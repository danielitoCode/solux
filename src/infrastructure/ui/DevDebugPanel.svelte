<script lang="ts">
  import { onMount } from 'svelte';
  import { page } from '$app/stores';
  import {
    subscribeDevLogs,
    clearDevLogs,
    type DevLogEntry
  } from './dev-logger';

  const enabled = import.meta.env.DEV;

  let open = $state(false);
  let minimized = $state(true);
  let logs = $state<DevLogEntry[]>([]);

  onMount(() => {
    if (!enabled) return;
    return subscribeDevLogs((e) => {
      logs = e;
    });
  });

  const errorCount = $derived(logs.filter((l) => l.scope.startsWith('ERROR')).length);

  function formatTime(ts: number) {
    return new Date(ts).toLocaleTimeString();
  }

  function formatDetail(d: unknown) {
    if (d == null) return '';
    if (typeof d === 'string') return d;
    try {
      return JSON.stringify(d, null, 2);
    } catch {
      return String(d);
    }
  }
</script>

{#if enabled}
  <div class="dev-root" class:minimized>
    {#if minimized}
      <button
        type="button"
        class="dev-fab"
        onclick={() => {
          minimized = false;
          open = true;
        }}
        title="Dev panel"
      >
        DEV{#if errorCount > 0}<span class="badge">{errorCount}</span>{/if}
      </button>
    {:else}
      <div class="dev-panel" class:collapsed={!open}>
        <header class="dev-header">
          <button type="button" class="dev-title" onclick={() => (open = !open)}>
            <span>SOLUX Dev</span>
            <small>{$page.url.pathname}</small>
            {#if errorCount > 0}<span class="badge">{errorCount}</span>{/if}
          </button>
          <div class="dev-actions">
            <button type="button" onclick={clearDevLogs} title="Limpiar">CLR</button>
            <button type="button" onclick={() => (minimized = true)} title="Minimizar">—</button>
          </div>
        </header>

        {#if open}
          <div class="dev-meta">
            <div><strong>Ruta</strong> {$page.url.pathname}{$page.url.search}</div>
          </div>
          <ul class="dev-list">
            {#each logs as log (log.id)}
              <li class:err={log.scope.startsWith('ERROR')}>
                <div class="line1">
                  <time>{formatTime(log.ts)}</time>
                  <span class="scope">{log.scope}</span>
                </div>
                <div class="msg">{log.message}</div>
                {#if log.route}
                  <div class="meta">ruta: {log.route}</div>
                {/if}
                {#if log.file}
                  <div class="meta">archivo: {log.file}</div>
                {/if}
                {#if log.detail}
                  <pre>{formatDetail(log.detail)}</pre>
                {/if}
              </li>
            {:else}
              <li class="empty">Sin logs aún. Interactúa con la app.</li>
            {/each}
          </ul>
        {/if}
      </div>
    {/if}
  </div>
{/if}

<style>
  .dev-root {
    position: fixed;
    z-index: 99999;
    right: 12px;
    bottom: 12px;
    font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
    font-size: 11px;
    line-height: 1.35;
  }
  .dev-fab {
    border: 1px solid #333;
    background: #111;
    color: #0f0;
    border-radius: 999px;
    padding: 8px 14px;
    font-weight: 800;
    letter-spacing: 0.06em;
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.35);
    position: relative;
  }
  .badge {
    position: absolute;
    top: -6px;
    right: -6px;
    background: #e74c3c;
    color: #fff;
    border-radius: 999px;
    min-width: 18px;
    height: 18px;
    font-size: 10px;
    display: grid;
    place-items: center;
    padding: 0 4px;
  }
  .dev-panel {
    width: min(420px, calc(100vw - 24px));
    max-height: min(50vh, 420px);
    background: #0d1117;
    color: #e6edf3;
    border: 1px solid #30363d;
    border-radius: 12px;
    box-shadow: 0 16px 48px rgba(0, 0, 0, 0.45);
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }
  .dev-panel.collapsed {
    max-height: none;
  }
  .dev-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
    padding: 8px 10px;
    background: #161b22;
    border-bottom: 1px solid #30363d;
  }
  .dev-title {
    border: 0;
    background: transparent;
    color: inherit;
    text-align: left;
    display: flex;
    flex-direction: column;
    gap: 2px;
    font-weight: 700;
    position: relative;
  }
  .dev-title small {
    font-weight: 500;
    color: #8b949e;
    font-size: 10px;
  }
  .dev-actions {
    display: flex;
    gap: 4px;
  }
  .dev-actions button {
    border: 1px solid #30363d;
    background: #21262d;
    color: #e6edf3;
    border-radius: 6px;
    padding: 4px 8px;
    font-size: 10px;
    font-weight: 700;
  }
  .dev-meta {
    padding: 6px 10px;
    border-bottom: 1px solid #30363d;
    color: #8b949e;
  }
  .dev-list {
    list-style: none;
    margin: 0;
    padding: 0;
    overflow: auto;
    flex: 1;
  }
  .dev-list li {
    padding: 8px 10px;
    border-bottom: 1px solid #21262d;
  }
  .dev-list li.err {
    background: rgba(231, 76, 60, 0.12);
  }
  .line1 {
    display: flex;
    gap: 8px;
    align-items: baseline;
  }
  time {
    color: #8b949e;
  }
  .scope {
    color: #58a6ff;
    font-weight: 700;
  }
  li.err .scope {
    color: #ff7b72;
  }
  .msg {
    margin-top: 2px;
    word-break: break-word;
  }
  .meta {
    margin-top: 2px;
    color: #8b949e;
    font-size: 10px;
  }
  pre {
    margin: 6px 0 0;
    padding: 6px;
    background: #010409;
    border-radius: 6px;
    overflow: auto;
    max-height: 120px;
    font-size: 10px;
    color: #c9d1d9;
  }
  .empty {
    color: #8b949e;
    text-align: center;
    padding: 16px !important;
  }
</style>
