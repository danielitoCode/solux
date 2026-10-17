<script lang="ts">
  import { onMount } from 'svelte';
  import type { ConsumableProduct } from '../domain/entities/consumable-product';
  import { getConsumablesState, loadConsumables, saveConsumable, toggleConsumable } from './stores/consumables.store.svelte';
  import Hint from '$infrastructure/ui/Hint.svelte';

  let viewState = getConsumablesState();
  let editingId = $state<string | null>(null);
  let name = $state('');
  let sku = $state('');
  let category = $state('Consumibles');
  let unit = $state('unidad');
  let description = $state('');
  let cost = $state('0');
  let markup = $state('0');
  let active = $state(true);

  function reset() {
    editingId = null;
    name = '';
    sku = '';
    category = 'Consumibles';
    unit = 'unidad';
    description = '';
    cost = '0';
    markup = '0';
    active = true;
  }
  function edit(product: ConsumableProduct) {
    editingId = product.id;
    name = product.name;
    sku = product.sku ?? '';
    category = product.category;
    unit = product.unit;
    description = product.description;
    cost = String(product.defaultCost);
    markup = String(product.defaultMarkupPercent);
    active = product.isActive;
  }
  async function save() {
    const costValue = Number(cost);
    const markupValue = Number(markup);
    if (
      !name.trim() ||
      !unit.trim() ||
      !Number.isFinite(costValue) ||
      costValue < 0 ||
      !Number.isFinite(markupValue) ||
      markupValue < 0 ||
      markupValue > 1000
    )
      return;
    await saveConsumable(editingId, {
      name: name.trim(),
      sku: sku.trim() || null,
      category: category.trim() || 'Consumibles',
      unit: unit.trim(),
      description: description.trim(),
      defaultCost: costValue,
      defaultMarkupPercent: markupValue,
      isActive: active
    });
    if (!viewState.error) reset();
  }
  async function toggle(product: ConsumableProduct) {
    if (!window.confirm(`${product.isActive ? '¿Desactivar' : '¿Activar'} "${product.name}"?`)) return;
    await toggleConsumable(product);
  }
  onMount(loadConsumables);
</script>

<svelte:head><title>Consumibles | Backoffice SOLUX</title></svelte:head>

<div class="page">
  <header>
    <div>
      <p class="eyebrow">Inventario de uso interno</p>
      <h1>Catálogo de consumibles</h1>
      <p class="sub">Insumos de ejecución (tornillería, discos, soldadura…). Independiente del catálogo de venta al público.</p>
    </div>
    <button class="secondary" type="button" onclick={loadConsumables} disabled={viewState.loading || viewState.saving}>
      <svg class="bo-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M21 12a9 9 0 1 1-2.64-6.36M21 3v6h-6"/></svg>
      Actualizar
    </button>
  </header>

  {#if viewState.error}<p class="error" role="alert">{viewState.error}</p>{/if}
  {#if viewState.notice}<p class="notice" role="status">{viewState.notice}</p>{/if}

  <div class="layout">
    <form
      class="editor"
      onsubmit={(e) => {
        e.preventDefault();
        save();
      }}
    >
      <h2>
        <svg class="bo-section-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5v14M5 12h14"/></svg>
        {editingId ? 'Editar consumible' : 'Nuevo consumible'}
      </h2>

      <label class="bo-field">
        <span class="label-row">Nombre <Hint text="Nombre que verá el equipo al asignar materiales en un trabajo." /></span>
        <input bind:value={name} required placeholder="Disco de corte 4½ pulgadas" />
      </label>

      <div class="two">
        <label class="bo-field">
          <span class="label-row">Código / SKU <Hint text="Código interno opcional para localizar el insumo en almacén o compras." /></span>
          <input bind:value={sku} placeholder="Opcional" />
        </label>
        <label class="bo-field">
          <span class="label-row">Categoría <Hint text="Agrupa consumibles similares: corte, fijación, soldadura, etc." /></span>
          <input bind:value={category} placeholder="Corte, soldadura, fijación…" />
        </label>
      </div>

      <div class="two">
        <label class="bo-field">
          <span class="label-row">Unidad <Hint text="Unidad de consumo: unidad, caja, metro, kg…" /></span>
          <input bind:value={unit} required placeholder="unidad, caja, metro…" />
        </label>
        <label class="bo-field">
          <span class="label-row">Costo unitario <Hint text="Costo de adquisición por unidad. Se usa como base al cargar materiales en trabajos." /></span>
          <input type="number" min="0" step="0.01" bind:value={cost} required />
        </label>
      </div>

      <label class="bo-field">
        <span class="label-row">Sobrecargo predeterminado (%) <Hint text="Porcentaje sugerido sobre el costo al facturar al cliente. Se puede ajustar por trabajo." /></span>
        <input type="number" min="0" max="1000" step="0.1" bind:value={markup} />
      </label>

      <label class="bo-field">
        <span class="label-row">Descripción <Hint text="Marca, medida o especificación técnica para evitar confusiones en obra." /></span>
        <textarea bind:value={description} rows="3" placeholder="Marca, medida, especificación…"></textarea>
      </label>

      <label class="bo-check">
        <input type="checkbox" bind:checked={active} />
        Disponible para usar en trabajos
        <Hint text="Si está desactivado no aparecerá al asignar materiales en reservas/trabajos." />
      </label>

      <div class="buttons">
        <button class="primary" type="submit" disabled={viewState.saving || viewState.loading}>
          {viewState.saving ? 'Guardando…' : 'Guardar'}
        </button>
        {#if editingId}
          <button type="button" class="secondary" onclick={reset} disabled={viewState.saving}>Cancelar</button>
        {/if}
      </div>
    </form>

    <section class="catalog">
      <div class="catalog-head">
        <h2>Consumibles registrados</h2>
        <span>{viewState.products.length}</span>
      </div>
      {#if viewState.loading}
        <p class="empty">Cargando…</p>
      {:else if viewState.products.length === 0}
        <p class="empty">Todavía no hay consumibles.</p>
      {:else}
        {#each viewState.products as product (product.id)}
          <article class="card" class:inactive={!product.isActive}>
            <div>
              <strong>{product.name}</strong>
              <small>{product.category} · {product.unit}{#if product.sku} · {product.sku}{/if}</small>
              <small>Costo {product.defaultCost} · Markup {product.defaultMarkupPercent}%</small>
            </div>
            <div class="card-actions">
              <button type="button" class="secondary" onclick={() => edit(product)} disabled={viewState.saving}>Editar</button>
              <button type="button" class="secondary" onclick={() => toggle(product)} disabled={viewState.saving}>
                {product.isActive ? 'Desactivar' : 'Activar'}
              </button>
            </div>
          </article>
        {/each}
      {/if}
    </section>
  </div>
</div>

<style>
  .page {
    padding: 28px;
    max-width: 1440px;
    margin: auto;
    color: var(--color-text);
  }
  header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 20px;
    margin-bottom: 24px;
  }
  h1 {
    font-size: 26px;
    letter-spacing: -0.04em;
    margin: 4px 0 8px;
  }
  h2 {
    font-size: 16px;
    margin: 0 0 16px;
    display: flex;
    align-items: center;
  }
  .eyebrow {
    font-size: 10px;
    text-transform: uppercase;
    letter-spacing: 0.13em;
    font-weight: 800;
    color: var(--color-primary);
    margin: 0;
  }
  .sub {
    color: var(--color-muted);
    font-size: 13px;
    max-width: 520px;
    margin: 0;
    line-height: 1.45;
  }
  .layout {
    display: grid;
    grid-template-columns: minmax(280px, 380px) minmax(0, 1fr);
    gap: 20px;
    align-items: start;
  }
  .editor,
  .catalog {
    background: var(--color-surface);
    border: 1px solid var(--color-border);
    border-radius: 16px;
    padding: 20px;
  }
  .two {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 12px;
    margin: 12px 0;
  }
  .editor .bo-field {
    margin: 12px 0;
  }
  .buttons {
    display: flex;
    gap: 10px;
    margin-top: 18px;
  }
  .primary,
  .secondary {
    border: 0;
    border-radius: 10px;
    padding: 11px 14px;
    font-weight: 750;
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    gap: 4px;
  }
  .primary {
    background: var(--color-primary);
    color: white;
  }
  .secondary {
    background: var(--color-surface-2);
    color: var(--color-text);
    border: 1px solid var(--color-border);
  }
  button:disabled {
    opacity: 0.55;
    cursor: not-allowed;
  }
  .catalog-head {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 12px;
  }
  .catalog-head span {
    font-size: 12px;
    font-weight: 800;
    color: var(--color-muted);
  }
  .card {
    display: flex;
    justify-content: space-between;
    gap: 12px;
    padding: 12px 0;
    border-bottom: 1px solid var(--color-border);
  }
  .card.inactive {
    opacity: 0.55;
  }
  .card strong,
  .card small {
    display: block;
  }
  .card small {
    color: var(--color-muted);
    font-size: 12px;
    margin-top: 3px;
  }
  .card-actions {
    display: flex;
    gap: 8px;
    flex-shrink: 0;
  }
  .error {
    background: #fee2e2;
    color: #991b1b;
    padding: 12px;
    border-radius: 10px;
  }
  .notice {
    background: #dcfce7;
    color: #166534;
    padding: 12px;
    border-radius: 10px;
  }
  .empty {
    color: var(--color-muted);
    font-size: 13px;
  }
  @media (max-width: 900px) {
    .layout,
    .two {
      grid-template-columns: 1fr;
    }
    header {
      flex-direction: column;
    }
  }
</style>
