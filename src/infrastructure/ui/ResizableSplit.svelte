<script lang="ts">
  import type { Snippet } from 'svelte';
  import { onDestroy } from 'svelte';

  type Props = {
    /** Ancho inicial del panel izquierdo (px) */
    initialLeft?: number;
    minLeft?: number;
    maxLeft?: number;
    storageKey?: string;
    left: Snippet;
    right: Snippet;
  };

  let {
    initialLeft = 360,
    minLeft = 280,
    maxLeft = 560,
    storageKey,
    left,
    right
  }: Props = $props();

  let leftWidth = $state(initialLeft);
  let dragging = $state(false);
  let shellEl: HTMLDivElement | undefined = $state();

  // Restaurar preferencia
  if (typeof window !== 'undefined' && storageKey) {
    const saved = localStorage.getItem(storageKey);
    if (saved) {
      const n = Number(saved);
      if (!Number.isNaN(n)) leftWidth = clamp(n, minLeft, maxLeft);
    }
  }

  function clamp(v: number, min: number, max: number) {
    return Math.min(max, Math.max(min, v));
  }

  function effectiveMax() {
    if (!shellEl) return maxLeft;
    // Deja al menos 320px al panel derecho
    return Math.min(maxLeft, shellEl.clientWidth - 320);
  }

  function onPointerDown(e: PointerEvent) {
    e.preventDefault();
    dragging = true;
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  }

  function onPointerMove(e: PointerEvent) {
    if (!dragging || !shellEl) return;
    const rect = shellEl.getBoundingClientRect();
    const x = e.clientX - rect.left;
    leftWidth = clamp(x, minLeft, effectiveMax());
  }

  function onPointerUp(e: PointerEvent) {
    if (!dragging) return;
    dragging = false;
    try {
      (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {
      /* */
    }
    if (storageKey) {
      localStorage.setItem(storageKey, String(Math.round(leftWidth)));
    }
  }

  function onDblClick() {
    leftWidth = clamp(initialLeft, minLeft, effectiveMax());
    if (storageKey) localStorage.setItem(storageKey, String(Math.round(leftWidth)));
  }

  // En resize de ventana, re-clampear
  function onWindowResize() {
    leftWidth = clamp(leftWidth, minLeft, effectiveMax());
  }

  if (typeof window !== 'undefined') {
    window.addEventListener('resize', onWindowResize);
  }
  onDestroy(() => {
    if (typeof window !== 'undefined') {
      window.removeEventListener('resize', onWindowResize);
    }
  });
</script>

<div
  class="split-shell"
  class:dragging
  bind:this={shellEl}
  style="--left-w: {leftWidth}px"
>
  <div class="pane left">
    {@render left()}
  </div>

  <div
    class="divider"
    role="separator"
    aria-orientation="vertical"
    aria-valuenow={Math.round(leftWidth)}
    aria-valuemin={minLeft}
    aria-valuemax={maxLeft}
    tabindex="0"
    onpointerdown={onPointerDown}
    onpointermove={onPointerMove}
    onpointerup={onPointerUp}
    onpointercancel={onPointerUp}
    ondblclick={onDblClick}
    onkeydown={(e) => {
      if (e.key === 'ArrowLeft') leftWidth = clamp(leftWidth - 16, minLeft, effectiveMax());
      if (e.key === 'ArrowRight') leftWidth = clamp(leftWidth + 16, minLeft, effectiveMax());
    }}
  >
    <span class="grip"></span>
  </div>

  <div class="pane right">
    {@render right()}
  </div>
</div>

<style>
  .split-shell {
    display: grid;
    grid-template-columns: var(--left-w) 6px 1fr;
    min-height: 100vh;
    height: 100vh;
    background: var(--color-bg);
    user-select: none;
  }
  .split-shell:not(.dragging) {
    user-select: auto;
  }
  .split-shell.dragging {
    cursor: col-resize;
  }
  .split-shell.dragging .pane {
    pointer-events: none;
  }

  .pane {
    min-width: 0;
    min-height: 0;
    overflow: hidden;
    display: flex;
    flex-direction: column;
  }
  .pane.left {
    background: var(--color-surface);
    overflow-x: hidden;
  }
  .pane.left > :global(*) {
    min-width: 0;
    max-width: 100%;
  }

  .divider {
    position: relative;
    z-index: 5;
    cursor: col-resize;
    background: var(--color-border);
    touch-action: none;
    display: grid;
    place-items: center;
    transition: background 0.15s;
  }
  .divider:hover,
  .split-shell.dragging .divider {
    background: var(--color-primary);
  }
  .grip {
    width: 2px;
    height: 28px;
    border-radius: 2px;
    background: color-mix(in srgb, var(--color-muted) 50%, transparent);
    box-shadow: 4px 0 0 color-mix(in srgb, var(--color-muted) 35%, transparent);
  }
  .divider:hover .grip,
  .split-shell.dragging .grip {
    background: rgba(255, 255, 255, 0.7);
    box-shadow: 4px 0 0 rgba(255, 255, 255, 0.45);
  }

  @media (max-width: 900px) {
    .split-shell {
      grid-template-columns: 1fr;
      height: auto;
      min-height: 100vh;
    }
    .divider {
      display: none;
    }
    .pane.left {
      border-bottom: 1px solid var(--color-border);
      max-height: 45vh;
    }
  }
</style>
