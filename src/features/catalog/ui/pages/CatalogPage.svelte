<script lang="ts">
  import { onMount } from 'svelte';
  import { flip } from 'svelte/animate';
  import { fade, fly, scale } from 'svelte/transition';
  import { cubicOut } from 'svelte/easing';
  import { getCatalogRepository } from '$features/catalog/di';
  import type { CatalogItem } from '$features/catalog/domain/entities';
  import { devError } from '$infrastructure/ui/dev-logger';
  import { ms, reveal, scrollDepth, spotlight } from '$infrastructure/ui/util/motion';
  import Ambient from "$infrastructure/ui/component/Ambient.svelte";

  /* ─────────── Datos ─────────── */
  let items = $state<CatalogItem[]>([]);
  let loading = $state(true);
  let error = $state('');
  let activeImage = $state<Record<string, number>>({});

  const categoryLabel: Record<string, string> = {
    solar_panels: 'Paneles',
    inverters: 'Inversores',
    batteries: 'Baterías',
    solar_kits: 'Kits solares',
    power_stations: 'Estaciones',
    grounding: 'Tierra',
    electrical_installation: 'Instalación eléctrica',
    electrical_repair: 'Reparaciones',
    maintenance: 'Mantenimiento',
    advisory: 'Asesoría'
  };

  const categoryIcon: Record<string, string> = {
    solar_panels: '☀',
    inverters: '◈',
    batteries: '▣',
    solar_kits: '✦',
    maintenance: '✓'
  };
  const iconFor = (category: string) => categoryIcon[category] ?? '⌁';

  /** Links comerciales desde el catálogo (source=catalog + intent + ítem). */
  function catalogQuery(item: CatalogItem, intent: string) {
    const p = new URLSearchParams({
      intent,
      source: 'catalog',
      item: item.id,
      name: item.name
    });
    return p.toString();
  }
  function consultUrl(item: CatalogItem) {
    return `/contacto?${catalogQuery(item, 'buy')}`;
  }
  function installUrl(item: CatalogItem) {
    return `/reservas?${catalogQuery(item, 'install')}`;
  }
  function serviceUrl(item: CatalogItem) {
    const intent =
      item.category === 'maintenance'
        ? 'maintain'
        : item.category === 'advisory'
          ? 'advisory'
          : 'install';
    return `/reservas?${catalogQuery(item, intent)}`;
  }

  async function load() {
    loading = true;
    error = '';
    try {
      items = await getCatalogRepository().listActive();
    } catch (e) {
      devError('catalog-page', 'listActive failed', e);
      error = e instanceof Error ? e.message : 'No se pudo cargar el catálogo';
    } finally {
      loading = false;
    }
  }

  function setImage(itemId: string, index: number) {
    activeImage = { ...activeImage, [itemId]: index };
  }

  onMount(load);

  /* ─────────── Filtros ─────────── */
  type TypeFilter = 'all' | 'product' | 'service';
  const typeOptions: { value: TypeFilter; label: string }[] = [
    { value: 'all', label: 'Todo' },
    { value: 'product', label: 'Productos' },
    { value: 'service', label: 'Servicios' }
  ];

  let query = $state('');
  let type = $state<TypeFilter>('all');
  let category = $state('all');

  // Normaliza para buscar sin distinguir mayúsculas ni tildes
  const norm = (text: string) =>
          text
                  .normalize('NFD')
                  .replace(/[\u0300-\u036f]/g, '')
                  .toLowerCase();

  const typeIndex = $derived(typeOptions.findIndex((o) => o.value === type));

  // Resultado por tipo y búsqueda (las categorías se cuentan sobre este conjunto)
  const base = $derived.by(() => {
    const q = norm(query.trim());
    return items.filter((item) => {
      if (type !== 'all' && item.type !== type) return false;
      if (!q) return true;
      const haystack = norm(
              `${item.name} ${item.shortDescription ?? ''} ${categoryLabel[item.category] ?? item.category}`
      );
      return haystack.includes(q);
    });
  });

  const categories = $derived.by(() => {
    const counts = new Map<string, number>();
    for (const item of base) counts.set(item.category, (counts.get(item.category) ?? 0) + 1);
    return [...counts];
  });

  const filtered = $derived(category === 'all' ? base : base.filter((i) => i.category === category));
  const hasFilters = $derived(query.trim() !== '' || type !== 'all' || category !== 'all');

  // Si la categoría elegida deja de existir tras otro filtro, vuelve a "Todas"
  $effect(() => {
    if (category !== 'all' && !categories.some(([c]) => c === category)) category = 'all';
  });

  function clearFilters() {
    query = '';
    type = 'all';
    category = 'all';
  }

  const formatPrice = (value: number) => new Intl.NumberFormat('es').format(value);

  /* ─────────── Lightbox ─────────── */
  let lightbox = $state<{ src: string; alt: string } | null>(null);
  const openLightbox = (src: string, alt: string) => (lightbox = { src, alt });
  const closeLightbox = () => (lightbox = null);

  function focusOnMount(node: HTMLElement) {
    node.focus();
  }

  /* ─────────── Encabezado ─────────── */
  const title = 'Productos y servicios.';
  const words = title.split(/\s+/);
</script>

<svelte:window onkeydown={(e) => e.key === 'Escape' && lightbox && closeLightbox()} />

<section class="page" use:scrollDepth>
  <Ambient />

  <!-- ───────── Encabezado ───────── -->
  <div class="section-head intro">
    <div>
      <div class="eyebrow rise" style="--i: 0">Catálogo</div>
      <h2 class="headline" aria-label={title}>
        {#each words as word, i}
          <span class="word" aria-hidden="true"
          ><span class="word-in" style="--w: {i}">{word}</span></span
          >{' '}
        {/each}
      </h2>
    </div>
    <p class="rise" style="--i: 3">
      Carta de equipos y servicios que instalamos y mantenemos. Precios orientativos; cada proyecto se
      dimensiona a medida.
    </p>
  </div>

  <!-- ───────── Filtros ───────── -->
  {#if !loading && !error && items.length}
    <div class="toolbar rise" style="--i: 4">
      <div class="toolbar-row">
        <div class="seg" role="group" aria-label="Tipo" style="--i: {typeIndex}">
          {#each typeOptions as option (option.value)}
            <button
                    type="button"
                    class:active={type === option.value}
                    aria-pressed={type === option.value}
                    onclick={() => (type = option.value)}
            >
              {option.label}
            </button>
          {/each}
        </div>

        <label class="search">
          <span class="search-icon" aria-hidden="true">⌕</span>
          <input
                  type="search"
                  placeholder="Buscar equipos o servicios"
                  bind:value={query}
                  aria-label="Buscar en el catálogo"
          />
        </label>
      </div>

      <div class="chips" role="group" aria-label="Categoría">
        <button
                type="button"
                class="chip"
                class:active={category === 'all'}
                aria-pressed={category === 'all'}
                onclick={() => (category = 'all')}
        >
          Todas <span class="chip-count">{base.length}</span>
        </button>
        {#each categories as [key, count] (key)}
          <button
                  type="button"
                  class="chip"
                  class:active={category === key}
                  aria-pressed={category === key}
                  onclick={() => (category = key)}
          >
            {categoryLabel[key] ?? key} <span class="chip-count">{count}</span>
          </button>
        {/each}
      </div>

      <p class="count" aria-live="polite">
        {filtered.length}
        {filtered.length === 1 ? 'resultado' : 'resultados'}
      </p>
    </div>
  {/if}

  <!-- ───────── Contenido ───────── -->
  {#if loading}
    <div class="cards" aria-busy="true" aria-label="Cargando catálogo">
      {#each [1, 2, 3, 4, 5, 6] as n (n)}
        <article class="card catalog-card sk" aria-hidden="true">
          <div class="sk-block sk-media"></div>
          <div class="sk-block sk-line short"></div>
          <div class="sk-block sk-line"></div>
          <div class="sk-block sk-line mid"></div>
        </article>
      {/each}
    </div>
  {:else if error}
    <div class="banner-error" role="alert" in:fade={{ duration: ms(250) }}>
      <span>{error}</span>
      <button type="button" class="btn btn-ghost btn-small" onclick={load}>Reintentar</button>
    </div>
  {:else if !filtered.length}
    <div class="empty-state empty" in:fade={{ duration: ms(250) }}>
      {#if items.length}
        <p>Ningún resultado coincide con tu búsqueda.</p>
        <button type="button" class="btn btn-ghost btn-small" onclick={clearFilters}>
          Limpiar filtros
        </button>
      {:else}
        <p>Catálogo sin productos publicados.</p>
      {/if}
    </div>
  {:else}
    <div class="cards">
      {#each filtered as item, i (item.id)}
        {@const images = item.imageUrls ?? []}
        {@const imageIndex = activeImage[item.id] ?? 0}
        <article
                class="card catalog-card"
                use:spotlight
                animate:flip={{ duration: ms(380) }}
                in:fly={{ y: 18, duration: ms(420), delay: ms(Math.min(i, 8) * 55), easing: cubicOut }}
        >
          <div class="media">
            {#if images.length}
              <button
                      type="button"
                      class="media-main"
                      aria-label="Ampliar foto de {item.name}"
                      onclick={() => openLightbox(images[imageIndex], item.name)}
              >
                {#each images as image, index}
                  <img
                          class:on={index === imageIndex}
                          src={image}
                          alt={index === imageIndex ? item.name : ''}
                          loading="lazy"
                          decoding="async"
                  />
                {/each}
              </button>
            {:else}
              <div class="media-fallback" aria-hidden="true">
                <span>{iconFor(item.category)}</span>
              </div>
            {/if}
            <span class="badge">{item.type === 'product' ? 'Producto' : 'Servicio'}</span>
          </div>

          {#if images.length > 1}
            <div class="image-strip" aria-label="Fotos de {item.name}">
              {#each images as image, index}
                <button
                        type="button"
                        class:active={index === imageIndex}
                        aria-label={`Ver foto ${index + 1}`}
                        aria-pressed={index === imageIndex}
                        onclick={() => setImage(item.id, index)}
                >
                  <img src={image} alt="" loading="lazy" />
                </button>
              {/each}
            </div>
          {/if}

          <p class="cat-label">{categoryLabel[item.category] ?? item.category}</p>
          <h3>{item.name}</h3>
          <p class="desc">{item.shortDescription}</p>

          {#if item.features?.length}
            <ul class="feat-list">
              {#each item.features.slice(0, 3) as feature}
                <li>{feature}</li>
              {/each}
            </ul>
          {:else}
            <div class="feat-list"></div>
          {/if}

          <div class="catalog-footer">
            <div class="price-block">
              {#if item.price != null}
                <span class="from">desde</span>
                <strong class="price">{formatPrice(item.price)} {item.currency}</strong>
              {:else}
                <strong class="price">A consultar</strong>
              {/if}
            </div>
            <div class="card-actions">
              {#if item.type === 'product'}
                <a class="btn btn-small btn-ghost" href={consultUrl(item)}>
                  Consultar equipo
                </a>
                <a class="btn btn-small btn-primary" href={installUrl(item)}>
                  Instalar con kit <span class="arrow" aria-hidden="true">→</span>
                </a>
              {:else}
                <a class="btn btn-small btn-primary" href={serviceUrl(item)}>
                  Solicitar servicio <span class="arrow" aria-hidden="true">→</span>
                </a>
              {/if}
            </div>
          </div>
        </article>
      {/each}
    </div>
  {/if}

  <!-- ───────── CTA final ───────── -->
  <div class="banner rv" use:reveal>
    <div>
      <strong>¿No encuentras lo que buscas?</strong>
      <p>Diseñamos soluciones a medida. Solicita una visita técnica.</p>
    </div>
    <a class="btn btn-accent" href="/reservas?intent=install&source=catalog">
      Reservar visita <span class="arrow" aria-hidden="true">→</span>
    </a>
  </div>
</section>

<!-- ───────── Lightbox ───────── -->
{#if lightbox}
  <div class="lightbox" transition:fade={{ duration: ms(200) }}>
    <button type="button" class="lb-backdrop" aria-label="Cerrar" onclick={closeLightbox}></button>
    <div class="lb-dialog" role="dialog" aria-modal="true" aria-label={lightbox.alt}>
      <img
              src={lightbox.src}
              alt={lightbox.alt}
              in:scale={{ start: 0.94, duration: ms(300), easing: cubicOut }}
      />
      <button type="button" class="lb-close" aria-label="Cerrar" onclick={closeLightbox} use:focusOnMount>
        ✕
      </button>
    </div>
  </div>
{/if}

<style>
  .page {
    --ease: cubic-bezier(0.22, 1, 0.36, 1);
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
  a:focus-visible > .arrow {
    transform: translateX(4px);
  }

  /* ───────── Barra de filtros ───────── */
  .toolbar {
    display: grid;
    gap: 16px;
    margin: 34px 0 26px;
  }
  .toolbar-row {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 14px;
  }

  /* Selector de tipo con indicador deslizante */
  .seg {
    position: relative;
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    padding: 3px;
    border: 1px solid var(--color-border);
    border-radius: 999px;
    backdrop-filter: blur(10px);
  }
  .seg::before {
    content: '';
    position: absolute;
    top: 3px;
    bottom: 3px;
    left: 3px;
    width: calc((100% - 6px) / 3);
    border-radius: 999px;
    background: var(--color-primary);
    transform: translateX(calc(var(--i, 0) * 100%));
    transition: transform 0.4s var(--ease);
  }
  .seg button {
    position: relative;
    padding: 8px 18px;
    border: 0;
    border-radius: 999px;
    background: transparent;
    color: var(--color-muted);
    font: inherit;
    font-size: 13px;
    font-weight: 700;
    cursor: pointer;
    transition: color 0.3s var(--ease);
  }
  .seg button.active {
    color: white;
  }
  .seg button:focus-visible,
  .chip:focus-visible,
  .image-strip button:focus-visible {
    outline: 2px solid var(--color-primary);
    outline-offset: 2px;
  }

  .search {
    position: relative;
    flex: 1 1 240px;
    max-width: 380px;
  }
  .search-icon {
    position: absolute;
    left: 15px;
    top: 50%;
    transform: translateY(-52%);
    color: var(--color-muted);
    font-size: 16px;
    pointer-events: none;
  }
  .search input {
    width: 100%;
    box-sizing: border-box;
    padding: 10px 16px 10px 40px;
    border: 1px solid var(--color-border);
    border-radius: 999px;
    background: transparent;
    color: inherit;
    font: inherit;
    font-size: 13px;
    backdrop-filter: blur(10px);
    transition:
            border-color 0.25s var(--ease),
            box-shadow 0.25s var(--ease);
  }
  .search input:focus {
    outline: none;
    border-color: var(--color-primary);
    box-shadow: 0 0 0 3px color-mix(in srgb, var(--color-primary) 20%, transparent);
  }

  /* Categorías */
  .chips {
    display: flex;
    gap: 8px;
    overflow-x: auto;
    padding-bottom: 4px;
    scrollbar-width: thin;
  }
  .chip {
    flex: none;
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 7px 14px;
    border: 1px solid var(--color-border);
    border-radius: 999px;
    background: transparent;
    color: var(--color-muted);
    font: inherit;
    font-size: 12px;
    font-weight: 700;
    cursor: pointer;
    transition:
            transform 0.25s var(--ease),
            border-color 0.25s var(--ease),
            color 0.25s var(--ease),
            background 0.25s var(--ease);
  }
  .chip:hover {
    transform: translateY(-2px);
    border-color: var(--color-primary);
  }
  .chip.active {
    border-color: var(--color-primary);
    color: var(--color-primary);
    background: color-mix(in srgb, var(--color-primary) 12%, transparent);
  }
  .chip-count {
    font-size: 11px;
    opacity: 0.7;
    font-variant-numeric: tabular-nums;
  }
  .count {
    margin: 0;
    color: var(--color-muted);
    font-size: 12px;
  }

  /* ───────── Tarjetas ───────── */
  .cards {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(290px, 1fr));
    gap: 18px;
  }
  .catalog-card {
    position: relative;
    display: flex;
    flex-direction: column;
    transition:
            transform 0.35s var(--ease),
            box-shadow 0.35s var(--ease),
            border-color 0.35s var(--ease);
  }
  .catalog-card:not(.sk):hover {
    transform: translateY(-6px);
    box-shadow: var(--color-shadow);
    border-color: var(--color-primary);
  }
  .catalog-card:not(.sk)::before {
    content: '';
    position: absolute;
    inset: 0;
    border-radius: inherit;
    pointer-events: none;
    z-index: 1;
    background: radial-gradient(
            280px circle at var(--sx, 50%) var(--sy, 50%),
            rgba(255, 191, 25, 0.14),
            transparent 65%
    );
    opacity: 0;
    transition: opacity 0.3s;
  }
  .catalog-card:not(.sk):hover::before {
    opacity: 1;
  }

  /* Media: foto principal con fundido entre imágenes */
  .media {
    position: relative;
    margin: -6px -6px 14px;
    aspect-ratio: 16 / 10;
    overflow: hidden;
    border-radius: 18px;
    background: var(--color-border);
  }
  .media-main {
    position: absolute;
    inset: 0;
    display: block;
    padding: 0;
    border: 0;
    cursor: zoom-in;
    background: transparent;
  }
  .media-main img {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    object-fit: cover;
    opacity: 0;
    transition: opacity 0.45s var(--ease);
  }
  .media-main img.on {
    opacity: 1;
  }
  .media-fallback {
    position: absolute;
    inset: 0;
    display: grid;
    place-items: center;
    font-size: 42px;
    color: var(--color-muted);
  }
  .badge {
    position: absolute;
    top: 12px;
    left: 12px;
    z-index: 2;
    padding: 5px 10px;
    border-radius: 999px;
    background: color-mix(in srgb, var(--color-bg) 82%, transparent);
    backdrop-filter: blur(8px);
    color: var(--color-text);
    font-size: 11px;
    font-weight: 800;
    letter-spacing: 0.04em;
    text-transform: uppercase;
  }

  .image-strip {
    display: flex;
    gap: 6px;
    margin: -6px 0 12px;
    overflow-x: auto;
    padding-bottom: 2px;
  }
  .image-strip button {
    flex: none;
    width: 48px;
    height: 36px;
    padding: 0;
    border: 2px solid transparent;
    border-radius: 8px;
    overflow: hidden;
    cursor: pointer;
    background: var(--color-border);
    transition: border-color 0.25s var(--ease);
  }
  .image-strip button.active {
    border-color: var(--color-primary);
  }
  .image-strip img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .cat-label {
    margin: 0 0 4px;
    color: var(--color-muted);
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 0.06em;
    text-transform: uppercase;
  }
  .catalog-card h3 {
    margin: 0 0 8px;
    font-size: 17px;
    line-height: 1.25;
  }
  .desc {
    margin: 0 0 12px;
    color: var(--color-muted);
    font-size: 13px;
    line-height: 1.45;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }
  .feat-list {
    margin: 0 0 auto;
    padding: 0;
    list-style: none;
    min-height: 54px;
  }
  .feat-list li {
    font-size: 12px;
    color: var(--color-muted);
    padding: 2px 0;
  }
  .feat-list li::before {
    content: '✓';
    margin-right: 8px;
    color: var(--color-primary-2);
    font-weight: 800;
  }
  .catalog-footer {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    margin-top: 20px;
    padding-top: 16px;
    border-top: 1px solid var(--color-border);
  }
  .price-block {
    display: grid;
  }
  .from {
    color: var(--color-muted);
    font-size: 11px;
  }
  .price {
    color: var(--color-text);
    font-size: 16px;
    font-variant-numeric: tabular-nums;
  }
  .card-actions {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    justify-content: flex-end;
    max-width: 100%;
  }
  .catalog-footer .btn {
    position: relative;
    z-index: 2;
    transition: transform 0.25s var(--ease);
  }
  .catalog-footer .btn:hover {
    transform: translateY(-2px);
  }

  /* ───────── Carga (esqueleto con la forma de la tarjeta) ───────── */
  .sk {
    min-height: 360px;
  }
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
  .sk-media {
    aspect-ratio: 16 / 10;
    margin: -6px -6px 14px;
    border-radius: 18px;
  }
  .sk-line {
    height: 12px;
    margin: 8px 0;
  }
  .sk-line.short {
    width: 40%;
  }
  .sk-line.mid {
    width: 70%;
  }
  @keyframes shimmer {
    to {
      background-position: -200% 0;
    }
  }

  .empty {
    text-align: center;
    padding: 48px 20px;
  }
  .banner-error {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
    flex-wrap: wrap;
    margin: 20px 0;
  }

  /* ───────── Banner CTA ───────── */
  .banner {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 20px;
    flex-wrap: wrap;
    margin-top: 40px;
    padding: 22px 26px;
    border: 1px solid var(--color-border);
    border-radius: 20px;
    background: color-mix(in srgb, var(--color-primary) 6%, var(--color-surface));
  }
  .banner strong {
    display: block;
    margin-bottom: 4px;
  }
  .banner p {
    margin: 0;
    color: var(--color-muted);
    font-size: 14px;
  }

  /* ───────── Lightbox ───────── */
  .lightbox {
    position: fixed;
    inset: 0;
    z-index: 80;
    display: grid;
    place-items: center;
  }
  .lb-backdrop {
    position: absolute;
    inset: 0;
    border: 0;
    background: rgba(0, 0, 0, 0.72);
    cursor: pointer;
  }
  .lb-dialog {
    position: relative;
    max-width: min(92vw, 960px);
    max-height: 88vh;
  }
  .lb-dialog img {
    display: block;
    max-width: 100%;
    max-height: 88vh;
    border-radius: 16px;
    box-shadow: 0 24px 80px rgba(0, 0, 0, 0.45);
  }
  .lb-close {
    position: absolute;
    top: 10px;
    right: 10px;
    width: 36px;
    height: 36px;
    border: 0;
    border-radius: 999px;
    background: rgba(0, 0, 0, 0.55);
    color: white;
    font-size: 16px;
    cursor: pointer;
  }

  @media (max-width: 640px) {
    .catalog-footer {
      flex-direction: column;
      align-items: stretch;
    }
    .card-actions {
      justify-content: stretch;
    }
    .card-actions .btn {
      flex: 1;
      text-align: center;
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .rise,
    .word-in,
    .sk-block {
      animation: none;
    }
    .rv {
      opacity: 1;
      transform: none;
      filter: none;
      transition: none;
    }
    .catalog-card,
    .chip,
    .seg::before,
    .media-main img,
    .image-strip button,
    .arrow {
      transition: none;
    }
  }
</style>
