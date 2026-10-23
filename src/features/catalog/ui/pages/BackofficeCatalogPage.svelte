<script lang="ts">
  import { onMount } from 'svelte';
  import { getCatalogRepository } from '$features/catalog/di';
  import type {
    CatalogItem,
    CatalogItemType,
    CatalogCategory
  } from '$features/catalog/domain/entities';
  import { devLog, devError } from '$infrastructure/ui/dev-logger';
  import ResizableSplit from '$infrastructure/ui/ResizableSplit.svelte';
  import {
    isCloudinaryConfigured,
    uploadImageToCloudinary
  } from '$infrastructure/media/cloudinary';

  const TYPES: CatalogItemType[] = ['product', 'service'];
  const CATEGORIES: CatalogCategory[] = [
    'solar_panels',
    'inverters',
    'batteries',
    'solar_kits',
    'power_stations',
    'grounding',
    'electrical_installation',
    'electrical_repair',
    'maintenance',
    'advisory'
  ];

  const SCOPE_OPTIONS: { value: string; label: string }[] = [
    { value: '', label: 'Sin especificar' },
    { value: 'equipment_only', label: 'Solo equipo' },
    { value: 'kit_install', label: 'Equipo + instalación' },
    { value: 'install_only', label: 'Solo instalación' },
    { value: 'maintenance', label: 'Mantenimiento' },
    { value: 'advisory', label: 'Asesoría' },
    { value: 'custom', label: 'A medida' }
  ];

  const scopeLabel = (scope: string | undefined) =>
    SCOPE_OPTIONS.find((o) => o.value === scope)?.label ?? scope ?? '—';

  const typeLabel: Record<CatalogItemType, string> = {
    product: 'Producto',
    service: 'Servicio'
  };

  const categoryLabel: Record<CatalogCategory, string> = {
    solar_panels: 'Paneles',
    inverters: 'Inversores',
    batteries: 'Baterías',
    solar_kits: 'Kits solares',
    power_stations: 'Estaciones',
    grounding: 'Tierra',
    electrical_installation: 'Inst. eléctrica',
    electrical_repair: 'Reparación',
    maintenance: 'Mantenimiento',
    advisory: 'Asesoría'
  };

  type Filter = 'all' | 'active' | 'inactive' | CatalogItemType;

  let items = $state<CatalogItem[]>([]);
  let loading = $state(true);
  let error = $state('');
  let filter = $state<Filter>('all');
  let search = $state('');
  let saving = $state(false);
  let uploading = $state(false);

  let mode = $state<'view' | 'edit' | 'create'>('view');
  let selected = $state<CatalogItem | null>(null);

  // form
  let formType = $state<CatalogItemType>('product');
  let formCategory = $state<CatalogCategory>('solar_panels');
  let formName = $state('');
  let formShort = $state('');
  let formDesc = $state('');
  let formPrice = $state('');
  let formCurrency = $state('USD');
  let formFeatures = $state('');
  let formActive = $state(true);
  let formFeatured = $state(false);
  let formSort = $state(0);
  let formImages = $state<string[]>([]);
  let formProvider = $state('');
  let formScope = $state('');

  const cloudReady = isCloudinaryConfigured();

  const filtered = $derived.by(() => {
    let list = items;
    if (filter === 'active') list = list.filter((i) => i.isActive);
    else if (filter === 'inactive') list = list.filter((i) => !i.isActive);
    else if (filter === 'product' || filter === 'service') list = list.filter((i) => i.type === filter);
    const q = search.trim().toLowerCase();
    if (q) {
      list = list.filter(
        (i) =>
          i.name.toLowerCase().includes(q) ||
          i.shortDescription.toLowerCase().includes(q) ||
          i.category.toLowerCase().includes(q)
      );
    }
    return list;
  });

  async function load() {
    loading = true;
    error = '';
    try {
      items = await getCatalogRepository().listAll();
      devLog('bo-catalog', `loaded ${items.length}`);
      if (selected) {
        const fresh = items.find((i) => i.id === selected!.id);
        if (fresh) selected = fresh;
      }
    } catch (e) {
      devError('bo-catalog', 'listAll failed', e);
      error = e instanceof Error ? e.message : 'Error al cargar catálogo';
    } finally {
      loading = false;
    }
  }

  function fillForm(item: CatalogItem) {
    formType = item.type;
    formCategory = item.category;
    formName = item.name;
    formShort = item.shortDescription;
    formDesc = item.description;
    formPrice = item.price != null ? String(item.price) : '';
    formCurrency = item.currency;
    formFeatures = item.features.join('\n');
    formActive = item.isActive;
    formFeatured = item.isFeatured;
    formSort = item.sortOrder;
    formImages = [...item.imageUrls];
    formProvider = item.provider ?? '';
    formScope = item.scope ?? '';
  }

  function openItem(item: CatalogItem) {
    selected = item;
    mode = 'view';
    fillForm(item);
  }

  function startCreate() {
    selected = null;
    mode = 'create';
    formType = 'product';
    formCategory = 'solar_panels';
    formName = '';
    formShort = '';
    formDesc = '';
    formPrice = '';
    formCurrency = 'USD';
    formFeatures = '';
    formActive = true;
    formFeatured = false;
    formSort = items.length;
    formImages = [];
    formProvider = '';
    formScope = '';
  }

  function startEdit() {
    if (!selected) return;
    fillForm(selected);
    mode = 'edit';
  }

  function parseFeatures(raw: string) {
    return raw
      .split('\n')
      .map((s) => s.trim())
      .filter(Boolean);
  }

  async function save() {
    if (saving || uploading) return;
    if (!formName.trim()) {
      error = 'El nombre es obligatorio';
      return;
    }
    saving = true;
    error = '';
    try {
      const payload = {
        type: formType,
        category: formCategory,
        name: formName.trim(),
        shortDescription: formShort.trim(),
        description: formDesc.trim(),
        price: formPrice.trim() === '' ? undefined : Number(formPrice),
        currency: formCurrency.trim() || 'USD',
        imageUrls: formImages,
        features: parseFeatures(formFeatures),
        provider: formProvider.trim() || undefined,
        scope: formScope.trim() || undefined,
        isActive: formActive,
        isFeatured: formFeatured,
        sortOrder: Number(formSort) || 0
      };

      if (mode === 'create') {
        const created = await getCatalogRepository().create(payload);
        items = [...items, created].sort((a, b) => a.sortOrder - b.sortOrder);
        selected = created;
        mode = 'view';
        fillForm(created);
      } else if (mode === 'edit' && selected) {
        const updated = await getCatalogRepository().update(selected.id, payload);
        items = items.map((i) => (i.id === updated.id ? updated : i));
        selected = updated;
        mode = 'view';
        fillForm(updated);
      }
      devLog('bo-catalog', 'saved');
    } catch (e) {
      devError('bo-catalog', 'save failed', e);
      error = e instanceof Error ? e.message : 'No se pudo guardar';
    } finally {
      saving = false;
    }
  }

  async function toggleActive(item: CatalogItem) {
    const action = item.isActive ? 'desactivar' : 'activar';
    if (!window.confirm(`¿${action.charAt(0).toUpperCase() + action.slice(1)} "${item.name}"?`)) return;
    try {
      const updated = await getCatalogRepository().update(item.id, { isActive: !item.isActive });
      items = items.map((i) => (i.id === updated.id ? updated : i));
      if (selected?.id === updated.id) {
        selected = updated;
        formActive = updated.isActive;
      }
    } catch (e) {
      devError('bo-catalog', 'toggleActive failed', e);
      error = e instanceof Error ? e.message : 'No se pudo actualizar';
    }
  }

  async function onFilesSelected(e: Event) {
    const input = e.currentTarget as HTMLInputElement;
    const files = input.files;
    if (!files?.length) return;
    if (!cloudReady) {
      error = 'Configura Cloudinary en .env (VITE_CLOUDINARY_CLOUD_NAME y UPLOAD_PRESET)';
      return;
    }
    uploading = true;
    error = '';
    try {
      for (const file of Array.from(files)) {
        if (!file.type.startsWith('image/')) continue;
        const result = await uploadImageToCloudinary(file);
        formImages = [...formImages, result.url];
      }
    } catch (err) {
      error = err instanceof Error ? err.message : 'Error al subir imagen';
    } finally {
      uploading = false;
      input.value = '';
    }
  }

  function removeImage(url: string) {
    formImages = formImages.filter((u) => u !== url);
  }

  function addImageUrl(url: string) {
    const u = url.trim();
    if (!u) return;
    if (!formImages.includes(u)) formImages = [...formImages, u];
  }

  let manualUrl = $state('');

  onMount(load);
</script>

<ResizableSplit storageKey="solux-bo-catalog-split" initialLeft={360} minLeft={280} maxLeft={560}>
  {#snippet left()}
    <section class="list-pane">
      <header class="pane-header">
        <div>
          <p class="eyebrow">Backoffice</p>
          <h1>Catálogo</h1>
        </div>
        <div class="header-actions">
          <button type="button" class="icon-btn" onclick={load} disabled={loading} title="Actualizar">↻</button>
          <button type="button" class="btn btn-primary btn-small" onclick={startCreate}>+ Nuevo</button>
        </div>
      </header>

      <div class="search-row">
        <input type="search" placeholder="Buscar nombre, categoría…" bind:value={search} />
      </div>

      <div class="chips" role="tablist">
        <button type="button" class="chip" class:active={filter === 'all'} onclick={() => (filter = 'all')}>
          Todos <span>{items.length}</span>
        </button>
        <button type="button" class="chip" class:active={filter === 'active'} onclick={() => (filter = 'active')}>
          Activos
        </button>
        <button type="button" class="chip" class:active={filter === 'inactive'} onclick={() => (filter = 'inactive')}>
          Inactivos
        </button>
        <button type="button" class="chip" class:active={filter === 'product'} onclick={() => (filter = 'product')}>
          Productos
        </button>
        <button type="button" class="chip" class:active={filter === 'service'} onclick={() => (filter = 'service')}>
          Servicios
        </button>
      </div>

      {#if error && mode === 'view'}
        <div class="banner-error" role="alert">{error}</div>
      {/if}

      <div class="item-list">
        {#if loading && items.length === 0}
          <div class="skeleton-stack">
            {#each [1, 2, 3] as _}<div class="skeleton-card"></div>{/each}
          </div>
        {:else if filtered.length === 0}
          <div class="empty-state">
            <div class="empty-icon">◈</div>
            <p>Sin ítems</p>
            <small>Crea el primero con “+ Nuevo”</small>
          </div>
        {:else}
          {#each filtered as item (item.id)}
            <button
              type="button"
              class="item-card"
              class:selected={selected?.id === item.id && mode !== 'create'}
              onclick={() => openItem(item)}
            >
              <div class="thumb-row">
                {#if item.imageUrls[0]}
                  <img src={item.imageUrls[0]} alt="" class="thumb" />
                {:else}
                  <div class="thumb placeholder">—</div>
                {/if}
                <div class="thumb-meta">
                  <div class="item-top">
                    <span class="badge type">{typeLabel[item.type]}</span>
                    {#if !item.isActive}<span class="badge off">Inactivo</span>{/if}
                    {#if item.isFeatured}<span class="badge feat">Destacado</span>{/if}
                  </div>
                  <strong class="subject">{item.name}</strong>
                  <div class="who">{categoryLabel[item.category]}{#if item.provider} · {item.provider}{/if}</div>
                  {#if item.price != null}
                    <div class="price">{item.price} {item.currency}</div>
                  {/if}
                </div>
              </div>
            </button>
          {/each}
        {/if}
      </div>
    </section>
  {/snippet}

  {#snippet right()}
    <section class="detail-pane" class:empty={mode === 'view' && !selected}>
      {#if mode === 'view' && !selected}
        <div class="empty-detail">
          <div class="empty-icon big">▣</div>
          <h2>Catálogo</h2>
          <p>Selecciona un ítem o crea uno nuevo. Fotos vía Cloudinary (varias por producto).</p>
        </div>
      {:else if mode === 'view' && selected}
        <header class="detail-header">
          <div class="detail-title">
            <div class="code-row">
              <span class="badge type">{typeLabel[selected.type]}</span>
              <span class="badge">{categoryLabel[selected.category]}</span>
              {#if selected.isFeatured}<span class="badge feat">Destacado</span>{/if}
              <span class="badge" class:off={!selected.isActive}
                >{selected.isActive ? 'Activo' : 'Inactivo'}</span
              >
            </div>
            <h2>{selected.name}</h2>
          </div>
          <div class="actions">
            <button type="button" class="btn btn-ghost" disabled={saving} onclick={() => toggleActive(selected!)}>
              {selected.isActive ? 'Desactivar' : 'Activar'}
            </button>
            <button type="button" class="btn btn-primary" onclick={startEdit}>Editar</button>
          </div>
        </header>

        {#if selected.imageUrls.length}
          <div class="gallery">
            {#each selected.imageUrls as url}
              <a href={url} target="_blank" rel="noopener noreferrer">
                <img src={url} alt={selected.name} />
              </a>
            {/each}
          </div>
        {/if}

        <div class="info-grid">
          <div class="info-card">
            <h3>Precio</h3>
            <p>{selected.price != null ? `${selected.price} ${selected.currency}` : 'A consultar'}</p>
          </div>
          <div class="info-card">
            <h3>Proveedor</h3>
            <p>{selected.provider || '—'}</p>
          </div>
          <div class="info-card">
            <h3>Alcance</h3>
            <p>{scopeLabel(selected.scope)}</p>
          </div>
          <div class="info-card">
            <h3>Orden</h3>
            <p>{selected.sortOrder}</p>
          </div>
          <div class="info-card wide">
            <h3>Resumen</h3>
            <p class="body">{selected.shortDescription || '—'}</p>
          </div>
          <div class="info-card wide">
            <h3>Descripción</h3>
            <p class="body">{selected.description || '—'}</p>
          </div>
          {#if selected.features.length}
            <div class="info-card wide">
              <h3>Características</h3>
              <ul class="feats">
                {#each selected.features as f}<li>{f}</li>{/each}
              </ul>
            </div>
          {/if}
        </div>
      {:else}
        <!-- CREATE / EDIT FORM -->
        <header class="detail-header">
          <div class="detail-title">
            <p class="eyebrow">{mode === 'create' ? 'Nuevo ítem' : 'Editar'}</p>
            <h2>{mode === 'create' ? 'Crear en catálogo' : formName || 'Sin nombre'}</h2>
          </div>
          <div class="actions">
            <button
              type="button"
              class="btn btn-ghost"
              onclick={() => {
                mode = selected ? 'view' : 'view';
                if (!selected) mode = 'view';
              }}
            >
              Cancelar
            </button>
            <button type="button" class="btn btn-primary" disabled={saving || uploading} onclick={save}>
              {saving ? 'Guardando…' : 'Guardar'}
            </button>
          </div>
        </header>

        {#if error}
          <div class="banner-error form-err" role="alert">{error}</div>
        {/if}

        <form class="form" onsubmit={(e) => { e.preventDefault(); save(); }}>
          <div class="form-grid">
            <label class="field">
              <span>Tipo</span>
              <select bind:value={formType}>
                {#each TYPES as t}<option value={t}>{typeLabel[t]}</option>{/each}
              </select>
            </label>
            <label class="field">
              <span>Categoría</span>
              <select bind:value={formCategory}>
                {#each CATEGORIES as c}<option value={c}>{categoryLabel[c]}</option>{/each}
              </select>
            </label>
            <label class="field wide">
              <span>Nombre</span>
              <input bind:value={formName} required />
            </label>
            <label class="field wide">
              <span>Resumen corto</span>
              <input bind:value={formShort} />
            </label>
            <label class="field wide">
              <span>Descripción</span>
              <textarea rows="4" bind:value={formDesc}></textarea>
            </label>
            <label class="field">
              <span>Precio</span>
              <input type="number" step="0.01" bind:value={formPrice} placeholder="Vacío = a consultar" />
            </label>
            <label class="field">
              <span>Moneda</span>
              <input bind:value={formCurrency} />
            </label>
            <label class="field">
              <span>Proveedor / marca</span>
              <input bind:value={formProvider} placeholder="Ej. Jinko, Growatt…" />
            </label>
            <label class="field">
              <span>Alcance de la oferta</span>
              <select bind:value={formScope}>
                {#each SCOPE_OPTIONS as opt}
                  <option value={opt.value}>{opt.label}</option>
                {/each}
              </select>
            </label>
            <label class="field">
              <span>Orden</span>
              <input type="number" bind:value={formSort} />
            </label>
            <div class="checks">
              <label class="check"><input type="checkbox" bind:checked={formActive} /> Activo</label>
              <label class="check"><input type="checkbox" bind:checked={formFeatured} /> Destacado</label>
            </div>
            <label class="field wide">
              <span>Características (una por línea)</span>
              <textarea rows="3" bind:value={formFeatures}></textarea>
            </label>
          </div>

          <div class="photos">
            <h3>Fotos (Cloudinary)</h3>
            {#if !cloudReady}
              <p class="hint warn">
                Configura <code>VITE_CLOUDINARY_CLOUD_NAME</code> y
                <code>VITE_CLOUDINARY_UPLOAD_PRESET</code> (preset unsigned).
              </p>
            {/if}

            <div class="photo-grid">
              {#each formImages as url}
                <div class="photo">
                  <img src={url} alt="" />
                  <button type="button" class="remove" onclick={() => removeImage(url)}>×</button>
                </div>
              {/each}
              <label class="photo add">
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  hidden
                  disabled={!cloudReady || uploading}
                  onchange={onFilesSelected}
                />
                <span>{uploading ? 'Subiendo…' : '+ Subir'}</span>
              </label>
            </div>

            <div class="url-row">
              <input
                type="url"
                placeholder="O pega URL de Cloudinary…"
                bind:value={manualUrl}
              />
              <button
                type="button"
                class="btn btn-ghost btn-small"
                onclick={() => {
                  addImageUrl(manualUrl);
                  manualUrl = '';
                }}
              >
                Añadir URL
              </button>
            </div>
          </div>
        </form>
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
  .header-actions {
    display: flex;
    gap: 8px;
    align-items: center;
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
  .chips {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    padding: 0 16px 14px;
    flex-shrink: 0;
  }
  .chip {
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
  }
  .banner-error.form-err {
    margin: 12px 28px 0;
  }
  .item-list {
    flex: 1;
    overflow-y: auto;
    padding: 0 10px 16px;
    display: flex;
    flex-direction: column;
    gap: 6px;
  }
  .item-card {
    text-align: left;
    border: 1px solid transparent;
    background: transparent;
    border-radius: 14px;
    padding: 10px 12px;
    color: var(--color-text);
    cursor: pointer;
  }
  .item-card:hover {
    background: var(--color-surface-2);
  }
  .item-card.selected {
    background: color-mix(in srgb, var(--color-primary) 10%, var(--color-surface));
    border-color: color-mix(in srgb, var(--color-primary) 35%, var(--color-border));
  }
  .thumb-row {
    display: flex;
    gap: 12px;
    align-items: center;
  }
  .thumb {
    width: 52px;
    height: 52px;
    border-radius: 10px;
    object-fit: cover;
    flex-shrink: 0;
    background: var(--color-surface-2);
  }
  .thumb.placeholder {
    display: grid;
    place-items: center;
    color: var(--color-muted);
    font-size: 12px;
  }
  .thumb-meta {
    min-width: 0;
    flex: 1;
  }
  .item-top {
    display: flex;
    flex-wrap: wrap;
    gap: 4px;
    margin-bottom: 4px;
  }
  .subject {
    display: block;
    font-size: 13.5px;
    margin-bottom: 2px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .who {
    font-size: 11px;
    color: var(--color-muted);
  }
  .price {
    font-size: 12px;
    font-weight: 700;
    color: var(--color-primary);
    margin-top: 2px;
  }
  .badge {
    font-size: 10px;
    font-weight: 800;
    text-transform: uppercase;
    letter-spacing: 0.04em;
    padding: 3px 8px;
    border-radius: 999px;
    background: var(--color-surface-2);
    color: var(--color-muted);
  }
  .badge.type {
    background: color-mix(in srgb, var(--color-primary) 14%, var(--color-surface));
    color: var(--color-primary);
  }
  .badge.feat {
    background: color-mix(in srgb, #f39c12 18%, transparent);
    color: #b9770e;
  }
  .badge.off {
    background: color-mix(in srgb, #7f8c8d 16%, transparent);
    color: #566573;
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
  }
  .detail-title h2 {
    margin: 8px 0 0;
    font-size: 22px;
    letter-spacing: -0.03em;
  }
  .code-row {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 8px;
  }
  .actions {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
  }
  .gallery {
    display: flex;
    gap: 10px;
    overflow-x: auto;
    padding: 16px 28px 0;
  }
  .gallery img {
    height: 120px;
    border-radius: 12px;
    object-fit: cover;
  }
  .info-grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 12px;
    margin: 16px 28px 28px;
  }
  .info-card {
    padding: 14px 16px;
    border: 1px solid var(--color-border);
    border-radius: 14px;
    background: var(--color-surface);
  }
  .info-card.wide {
    grid-column: 1 / -1;
  }
  .info-card h3 {
    margin: 0 0 8px;
    font-size: 11px;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    color: var(--color-muted);
  }
  .info-card p,
  .info-card .body {
    margin: 0;
    font-size: 14px;
    line-height: 1.5;
    white-space: pre-wrap;
  }
  .feats {
    margin: 0;
    padding-left: 18px;
    font-size: 14px;
  }
  .form {
    padding: 16px 28px 28px;
  }
  .form-grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 12px;
  }
  .field {
    display: grid;
    gap: 6px;
    font-size: 12px;
    font-weight: 700;
  }
  .field.wide {
    grid-column: 1 / -1;
  }
  .field input,
  .field select,
  .field textarea {
    width: 100%;
    box-sizing: border-box;
    border: 1px solid var(--color-border);
    background: var(--color-bg);
    color: var(--color-text);
    border-radius: 10px;
    padding: 10px 12px;
    font: inherit;
    font-size: 13px;
    font-weight: 400;
  }
  .checks {
    display: flex;
    gap: 16px;
    align-items: center;
    grid-column: 1 / -1;
  }
  .check {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 13px;
    font-weight: 600;
  }
  .photos {
    margin-top: 20px;
    padding-top: 16px;
    border-top: 1px solid var(--color-border);
  }
  .photos h3 {
    margin: 0 0 10px;
    font-size: 14px;
  }
  .hint {
    font-size: 12px;
    color: var(--color-muted);
    margin: 0 0 12px;
  }
  .hint.warn {
    color: #b9770e;
  }
  .photo-grid {
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
  }
  .photo {
    position: relative;
    width: 96px;
    height: 96px;
    border-radius: 12px;
    overflow: hidden;
    border: 1px solid var(--color-border);
  }
  .photo img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
  .photo .remove {
    position: absolute;
    top: 4px;
    right: 4px;
    width: 24px;
    height: 24px;
    border: 0;
    border-radius: 999px;
    background: rgba(0, 0, 0, 0.55);
    color: white;
    cursor: pointer;
  }
  .photo.add {
    display: grid;
    place-items: center;
    cursor: pointer;
    background: var(--color-surface-2);
    color: var(--color-muted);
    font-size: 12px;
    font-weight: 700;
  }
  .url-row {
    display: flex;
    gap: 8px;
    margin-top: 12px;
  }
  .url-row input {
    flex: 1;
    border: 1px solid var(--color-border);
    background: var(--color-bg);
    color: var(--color-text);
    border-radius: 10px;
    padding: 10px 12px;
    font: inherit;
    font-size: 13px;
  }
  @media (max-width: 900px) {
    .form-grid,
    .info-grid {
      grid-template-columns: 1fr;
    }
  }
</style>
