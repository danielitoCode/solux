<script lang="ts">
  import { onMount } from 'svelte';
  import { getCatalogRepository } from '$features/catalog/di';
  import type { CatalogItem } from '$features/catalog/domain/entities';
  import { devError } from '$infrastructure/ui/dev-logger';

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
</script>

<section class="page">
  <div class="section-head">
    <div>
      <div class="eyebrow">Catálogo</div>
      <h2>Productos y servicios.</h2>
    </div>
    <p>Carta de equipos y servicios que instalamos y mantenemos. Precios orientativos; cada proyecto se dimensiona a medida.</p>
  </div>

  {#if loading}
    <div class="grid grid-3">
      {#each [1, 2, 3] as _}<article class="card catalog-card skeleton"></article>{/each}
    </div>
  {:else if error}
    <div class="banner-error" role="alert">{error}</div>
  {:else}
    <div class="grid grid-3">
      {#each items as item (item.id)}
        {@const images = item.imageUrls ?? []}
        {@const imageIndex = activeImage[item.id] ?? 0}
        <article class="card catalog-card">
          <div class="catalog-badge">{item.type === 'product' ? 'Producto' : 'Servicio'}</div>

          {#if images.length}
            <div class="catalog-media">
              <a href={images[imageIndex]} target="_blank" rel="noopener noreferrer">
                <img src={images[imageIndex]} alt={item.name} loading="lazy" />
              </a>
              {#if images.length > 1}
                <div class="image-strip" aria-label="Fotos de {item.name}">
                  {#each images as image, index}
                    <button
                      type="button"
                      class:active={index === imageIndex}
                      aria-label={`Ver foto ${index + 1}`}
                      onclick={() => setImage(item.id, index)}
                    >
                      <img src={image} alt="" loading="lazy" />
                    </button>
                  {/each}
                </div>
              {/if}
            </div>
          {:else}
            <div class="icon">
              {#if item.category === 'solar_panels'}☀
              {:else if item.category === 'inverters'}◈
              {:else if item.category === 'batteries'}▣
              {:else if item.category === 'solar_kits'}✦
              {:else if item.category === 'maintenance'}✓
              {:else}⌁
              {/if}
            </div>
          {/if}

          <p class="cat-label">{categoryLabel[item.category] ?? item.category}</p>
          <h3>{item.name}</h3>
          <p>{item.shortDescription}</p>
          {#if item.features?.length}
            <ul class="feat-list">
              {#each item.features.slice(0, 3) as feature}
                <li>{feature}</li>
              {/each}
            </ul>
          {/if}
          <div class="catalog-footer">
            {#if item.price != null}
              <strong class="price">desde {item.price} {item.currency}</strong>
            {:else}
              <strong class="price">A consultar</strong>
            {/if}
            <a class="btn btn-small btn-primary" href="/reservas">Solicitar</a>
          </div>
        </article>
      {:else}
        <div class="empty-state">Catálogo sin productos publicados.</div>
      {/each}
    </div>
  {/if}

  <div class="banner" style="margin-top: 45px">
    <div>
      <strong>¿No encuentras lo que buscas?</strong>
      <p>Diseñamos soluciones a medida. Solicita una visita técnica.</p>
    </div>
    <a class="btn btn-accent" href="/reservas">Reservar visita</a>
  </div>
</section>

<style>
  .catalog-card {
    display: flex;
    flex-direction: column;
    position: relative;
  }
  .catalog-badge {
    position: absolute;
    top: 16px;
    right: 16px;
    z-index: 2;
    font-size: 10px;
    font-weight: 800;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    padding: 4px 10px;
    border-radius: 999px;
    background: color-mix(in srgb, var(--color-primary) 12%, transparent);
    color: var(--color-primary);
  }
  .catalog-media {
    margin: -6px -6px 18px;
  }
  .catalog-media > a {
    display: block;
    aspect-ratio: 16 / 10;
    overflow: hidden;
    border-radius: 18px;
    background: var(--color-surface-2, #f3f5f4);
  }
  .catalog-media > a img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
  }
  .image-strip {
    display: flex;
    gap: 6px;
    margin-top: 7px;
    overflow-x: auto;
    padding-bottom: 2px;
  }
  .image-strip button {
    flex: 0 0 48px;
    width: 48px;
    height: 38px;
    padding: 0;
    border: 2px solid transparent;
    border-radius: 8px;
    overflow: hidden;
    background: transparent;
    cursor: pointer;
  }
  .image-strip button.active { border-color: var(--color-primary); }
  .image-strip img { width: 100%; height: 100%; object-fit: cover; display: block; }
  .catalog-card > .icon { margin-top: 6px; }
  .cat-label {
    font-size: 11px;
    font-weight: 700;
    color: var(--color-primary);
    text-transform: uppercase;
    letter-spacing: 0.06em;
    margin-bottom: 6px !important;
  }
  .feat-list { list-style: none; padding: 0; margin: 14px 0 0; flex: 1; }
  .feat-list li { font-size: 12px; color: var(--color-muted); margin: 6px 0; }
  .feat-list li::before { content: '·'; color: var(--color-primary-2); font-weight: 800; margin-right: 6px; }
  .catalog-footer {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-top: 20px;
    padding-top: 16px;
    border-top: 1px solid var(--color-border);
  }
  .price { font-size: 15px; color: var(--color-text); }
  .skeleton { min-height: 360px; }
  .banner {
    border-radius: 26px;
    padding: 30px;
    background: linear-gradient(115deg, var(--color-primary), #07572f);
    color: white;
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 20px;
  }
  .banner p { margin: 6px 0 0; opacity: 0.8; }
  @media (max-width: 600px) {
    .banner { display: block; }
    .banner .btn { margin-top: 18px; }
  }
</style>
