<script lang="ts">
  import { onMount } from 'svelte';
  import { fade } from 'svelte/transition';
  import { getPresentationUseCases } from '$features/presentation/di';
  import Ambient from '$infrastructure/ui/component/Ambient.svelte';

  const presentation = getPresentationUseCases();

  type Spec = { label: string; value: string };
  type Project = {
    id: string;
    title: string;
    location: string;
    category: string;
    system_name: string;
    capacity_kw: number | null;
    inverter: string;
    panels: string;
    battery: string;
    description: string;
    specifications: Spec[];
    gallery: string[];
    layout: string;
  };

  let projects = $state<Project[]>([]);
  let loading = $state(true);
  let loadError = $state(false);
  let header = $state({
    eyebrow: 'Proyectos',
    title: 'Instalaciones reales. Soluciones diseñadas para cada necesidad.',
    description: 'Equipos, características y resultados de instalaciones solares ejecutadas por SOLUX.'
  });
  let category = $state('all');
  let expanded = $state<Record<string, boolean>>({});

  function sortByCapacity(list: Project[]): Project[] {
    return [...list].sort((a, b) => {
      const ca = a.capacity_kw;
      const cb = b.capacity_kw;
      if (ca == null && cb == null) return 0;
      if (ca == null) return 1;
      if (cb == null) return -1;
      return cb - ca;
    });
  }

  async function load() {
    loading = true;
    loadError = false;
    try {
      const [content, publishedProjects] = await Promise.all([
        presentation.getPageContent.execute('proyectos'),
        presentation.getPublishedProjects.execute()
      ]);
      header = {
        eyebrow: content.eyebrow || header.eyebrow,
        title: content.title || header.title,
        description: content.description || header.description
      };
      projects = sortByCapacity(
        publishedProjects.map((p) => ({
          ...p,
          gallery: p.gallery ?? [],
          specifications: p.specifications ?? []
        }))
      );
    } catch (err) {
      console.error('No se pudieron cargar los proyectos', err);
      loadError = true;
    } finally {
      loading = false;
    }
  }

  onMount(load);

  const categories = $derived.by(() => {
    const counts = new Map<string, number>();
    for (const p of projects) if (p.category) counts.set(p.category, (counts.get(p.category) ?? 0) + 1);
    return [...counts];
  });

  const visible = $derived(
    sortByCapacity(category === 'all' ? projects : projects.filter((p) => p.category === category))
  );

  const totalKw = $derived(projects.reduce((sum, p) => sum + (p.capacity_kw ?? 0), 0));

  const formatKw = (value: number) =>
    new Intl.NumberFormat('es', { maximumFractionDigits: 1 }).format(value);
</script>

<section class="page projects-page">
  <Ambient />

  <header class="section-head intro">
    <div>
      <div class="eyebrow">{header.eyebrow}</div>
      <h1 class="headline">{header.title}</h1>
    </div>
    <p>{header.description}</p>
  </header>

  {#if !loading && !loadError && projects.length}
    <div class="summary">
      <div class="metric">
        <strong>{projects.length}</strong>
        <span>{projects.length === 1 ? 'proyecto publicado' : 'proyectos publicados'}</span>
      </div>
      {#if totalKw > 0}
        <div class="metric">
          <strong>{formatKw(totalKw)} <small>kW</small></strong>
          <span>de capacidad instalada</span>
        </div>
      {/if}
    </div>

    {#if categories.length > 1}
      <div class="chips" role="group" aria-label="Filtrar por categoría">
        <button type="button" class="chip" class:active={category === 'all'} onclick={() => (category = 'all')}>
          Todos <span class="chip-count">{projects.length}</span>
        </button>
        {#each categories as [key, count] (key)}
          <button type="button" class="chip" class:active={category === key} onclick={() => (category = key)}>
            {key} <span class="chip-count">{count}</span>
          </button>
        {/each}
      </div>
    {/if}
  {/if}

  {#if loading}
    <p class="state">Cargando proyectos…</p>
  {:else if loadError}
    <div class="state-box" role="alert" in:fade={{ duration: 200 }}>
      <p>No se pudieron cargar los proyectos publicados.</p>
      <button type="button" class="btn btn-ghost btn-small" onclick={load}>Reintentar</button>
    </div>
  {:else if !projects.length}
    <div class="empty" in:fade={{ duration: 200 }}>
      <h2>Próximamente</h2>
      <p>Estamos preparando casos de instalación con equipos y detalles técnicos.</p>
    </div>
  {:else}
    <div class="projects-list">
      {#each visible as p (p.id)}
        <article class="project-card">
          <div class="info">
            <div class="eyebrow">
              {p.category}{#if p.location} · {p.location}{/if}
            </div>
            <h2>{p.title}</h2>
            {#if p.system_name}
              <p class="system">{p.system_name}</p>
            {/if}
            <div class="chips-row">
              {#if p.capacity_kw != null}<span>{p.capacity_kw} kW</span>{/if}
              {#if p.inverter}<span>{p.inverter}</span>{/if}
              {#if p.panels}<span>{p.panels}</span>{/if}
            </div>
            {#if p.description}
              {@const long = p.description.length > 280}
              <p class="project-description" class:clamped={long && !expanded[p.id]}>
                {p.description}
              </p>
              {#if long}
                <button type="button" class="more-btn" onclick={() => (expanded[p.id] = !expanded[p.id])}>
                  {expanded[p.id] ? 'Ver menos' : 'Leer más'}
                </button>
              {/if}
            {/if}
            {#if p.specifications?.length}
              <div class="specs">
                {#each p.specifications as s}
                  <div><span>{s.label}</span><strong>{s.value}</strong></div>
                {/each}
              </div>
            {/if}
            {#if p.gallery?.length}
              <div class="gallery">
                {#each p.gallery.slice(0, 4) as src, i}
                  <img src={src} alt="" loading="lazy" />
                {/each}
                {#if p.gallery.length > 4}
                  <span class="more">+{p.gallery.length - 4}</span>
                {/if}
              </div>
            {/if}
          </div>
        </article>
      {/each}
    </div>
  {/if}

  <div class="banner">
    <div>
      <strong>¿Quieres una instalación como estas?</strong>
      <p>Evaluamos tu caso y diseñamos el sistema que realmente necesitas.</p>
    </div>
    <a class="btn btn-accent" href="/reservas">Solicitar presupuesto →</a>
  </div>
</section>

<style>
  .projects-page {
    padding-bottom: 72px;
  }
  .summary {
    display: flex;
    flex-wrap: wrap;
    gap: 12px;
    margin: 0 0 20px;
  }
  .metric {
    padding: 14px 18px;
    border: 1px solid var(--color-border);
    border-radius: 16px;
    background: var(--color-surface, #fff);
  }
  .metric strong {
    display: block;
    font-size: 1.35rem;
  }
  .metric span {
    color: var(--color-muted, #667);
    font-size: 0.9rem;
  }
  .chips {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    margin-bottom: 24px;
  }
  .chip {
    border: 1px solid var(--color-border);
    background: var(--color-surface, #fff);
    border-radius: 999px;
    padding: 8px 14px;
    cursor: pointer;
  }
  .chip.active {
    border-color: var(--color-primary, #08783e);
    background: color-mix(in srgb, var(--color-primary, #08783e) 12%, transparent);
  }
  .chip-count {
    opacity: 0.7;
    margin-left: 4px;
  }
  .projects-list {
    display: grid;
    gap: 20px;
  }
  .project-card {
    border: 1px solid var(--color-border);
    border-radius: 20px;
    padding: 22px;
    background: var(--color-surface, #fff);
  }
  .project-card h2 {
    margin: 6px 0 8px;
    font-size: 1.35rem;
  }
  .system {
    color: var(--color-muted, #667);
    margin: 0 0 10px;
  }
  .chips-row {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    margin-bottom: 12px;
  }
  .chips-row span {
    font-size: 0.85rem;
    padding: 4px 10px;
    border-radius: 999px;
    background: var(--color-surface-2, #f2f5f1);
  }
  .project-description {
    margin: 0 0 8px;
    line-height: 1.55;
    white-space: pre-wrap;
  }
  .project-description.clamped {
    display: -webkit-box;
    -webkit-line-clamp: 4;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }
  .more-btn {
    background: none;
    border: 0;
    color: var(--color-primary, #08783e);
    cursor: pointer;
    padding: 0;
    margin-bottom: 12px;
  }
  .specs {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
    gap: 8px;
    margin: 12px 0;
  }
  .specs div {
    padding: 10px 12px;
    border-radius: 12px;
    background: var(--color-surface-2, #f2f5f1);
  }
  .specs span {
    display: block;
    font-size: 0.78rem;
    color: var(--color-muted, #667);
  }
  .gallery {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 8px;
    margin-top: 12px;
  }
  .gallery img {
    width: 100%;
    height: 96px;
    object-fit: cover;
    border-radius: 10px;
  }
  .gallery .more {
    display: grid;
    place-items: center;
    border-radius: 10px;
    background: var(--color-surface-2, #f2f5f1);
    font-weight: 600;
  }
  .banner {
    margin-top: 40px;
    padding: 24px;
    border-radius: 20px;
    border: 1px solid var(--color-border);
    display: flex;
    flex-wrap: wrap;
    gap: 16px;
    align-items: center;
    justify-content: space-between;
  }
  .state,
  .state-box,
  .empty {
    padding: 28px 0;
  }
  @media (max-width: 640px) {
    .gallery {
      grid-template-columns: repeat(2, 1fr);
    }
  }
</style>
