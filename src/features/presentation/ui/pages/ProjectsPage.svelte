<script lang="ts">
    import { onMount } from 'svelte';
    import { flip } from 'svelte/animate';
    import { Tween } from 'svelte/motion';
    import { fade } from 'svelte/transition';
    import { cubicOut } from 'svelte/easing';
    import { getPresentationUseCases } from '$features/presentation/di';

    const presentation = getPresentationUseCases();
    import { ms, reveal, scrollDepth } from '$infrastructure/ui/util/motion';
    import Ambient from "$infrastructure/ui/component/Ambient.svelte";
    import './projects-page.css';

    /* ─────────── Tipos ─────────── */
    type Layout = 'hero-left' | 'editorial' | 'gallery-grid' | 'technical-report';
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
        layout: Layout;
    };

    /* ─────────── Estado ─────────── */
    let projects = $state<Project[]>([]);
    let loading = $state(true);
    let loadError = $state(false);
    let header = $state({
        eyebrow: 'Proyectos',
        title: 'Instalaciones reales. Soluciones diseñadas para cada necesidad.',
        description: 'Equipos, características y resultados de instalaciones solares ejecutadas por SOLUX.'
    });

    const words = $derived(header.title.split(/\s+/).filter(Boolean));

    function sortByCapacity(list: Project[]): Project[] {
        return [...list].sort((a, b) => {
            const ca = a.capacity_kw;
            const cb = b.capacity_kw;
            if (ca == null && cb == null) return 0;
            if (ca == null) return 1;
            if (cb == null) return -1;
            return cb - ca; // mayor potencia primero
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
            projects = sortByCapacity(publishedProjects.map((p) => ({
                ...p,
                gallery: p.gallery ?? [],
                specifications: p.specifications ?? []
            })));
        } catch (err) {
            console.error('No se pudieron cargar los proyectos', err);
            loadError = true;
        } finally {
            loading = false;
        }
    }

    onMount(load);

    /* ─────────── Filtro por categoría ─────────── */
    let category = $state('all');

    const categories = $derived.by(() => {
        const counts = new Map<string, number>();
        for (const p of projects) if (p.category) counts.set(p.category, (counts.get(p.category) ?? 0) + 1);
        return [...counts];
    });
    const visible = $derived(sortByCapacity(category === 'all' ? projects : projects.filter((p) => p.category === category)));

    $effect(() => {
        if (category !== 'all' && !categories.some(([c]) => c === category)) category = 'all';
    });

    /* ─────────── Métricas reales con conteo animado ─────────── */
    const totalKw = $derived(projects.reduce((sum, p) => sum + (p.capacity_kw ?? 0), 0));
    const countTween = new Tween(0, { duration: ms(1200), easing: cubicOut });
    const kwTween = new Tween(0, { duration: ms(1400), easing: cubicOut });

    $effect(() => {
        if (loading || loadError) return;
        countTween.target = projects.length;
        kwTween.target = totalKw;
    });

    const formatKw = (value: number) => new Intl.NumberFormat('es', { maximumFractionDigits: 1 }).format(value);

    /* ─────────── Descripciones largas: recortadas con "Leer más" ─────────── */
    let expanded = $state<Record<string, boolean>>({});

    const isLong = (text: string) =>
        (text?.length ?? 0) > 300 || (text?.match(/\n/g)?.length ?? 0) >= 5;

    /** Guarda la altura completa del texto (--full) para animar el despliegue. */
    function measure(node: HTMLElement) {
        const set = () => node.style.setProperty('--full', `${node.scrollHeight}px`);
        set();
        const ro = new ResizeObserver(set);
        ro.observe(node);
        return { destroy: () => ro.disconnect() };
    }

    /* Límite de fotos visibles por tarjeta: el resto se resume en "+N" */
    const MOSAIC_MAX = 6;
    const TECH_MAX = 8;
    const mosaicClass = (n: number) => `m${Math.min(n, 6)}`;

    /* ─────────── Lightbox con galería ─────────── */
    let lightbox = $state<{ images: string[]; index: number; title: string } | null>(null);

    const openLightbox = (p: Project, index: number) =>
        (lightbox = { images: p.gallery, index, title: p.title });
    const closeLightbox = () => (lightbox = null);

    function step(direction: 1 | -1) {
        if (!lightbox) return;
        const n = lightbox.images.length;
        lightbox = { ...lightbox, index: (lightbox.index + direction + n) % n };
    }

    function onKeydown(e: KeyboardEvent) {
        if (!lightbox) return;
        if (e.key === 'Escape') closeLightbox();
        else if (e.key === 'ArrowRight') step(1);
        else if (e.key === 'ArrowLeft') step(-1);
    }

    function focusOnMount(node: HTMLElement) {
        node.focus();
    }
</script>

<svelte:window onkeydown={onKeydown} />

<section class="page projects-page" use:scrollDepth>
    <Ambient />

    <!-- ───────── Encabezado ───────── -->
    <header class="section-head intro">
        <div>
            <div class="eyebrow rise" style="--i: 0">{header.eyebrow}</div>
            {#key header.title}
                <h1 class="headline" aria-label={header.title}>
                    {#each words as word, i}
            <span class="word" aria-hidden="true"
            ><span class="word-in" style="--w: {i}">{word}</span></span
            >{' '}
                    {/each}
                </h1>
            {/key}
        </div>
        {#key header.description}
            <p class="rise" style="--i: 4" in:fade={{ duration: ms(300) }}>{header.description}</p>
        {/key}
    </header>

    <!-- ───────── Métricas y filtros ───────── -->
    {#if !loading && !loadError && projects.length}
        <div class="summary rise" style="--i: 5">
            <div class="metric">
                <strong>{Math.round(countTween.current)}</strong>
                <span>{projects.length === 1 ? 'proyecto publicado' : 'proyectos publicados'}</span>
            </div>
            {#if totalKw > 0}
                <div class="metric">
                    <strong>{formatKw(kwTween.current)} <small>kW</small></strong>
                    <span>de capacidad instalada</span>
                </div>
            {/if}
        </div>

        {#if categories.length > 1}
            <div class="chips rise" style="--i: 6" role="group" aria-label="Filtrar por categoría">
                <button
                        type="button"
                        class="chip"
                        class:active={category === 'all'}
                        aria-pressed={category === 'all'}
                        onclick={() => (category = 'all')}
                >
                    Todos <span class="chip-count">{projects.length}</span>
                </button>
                {#each categories as [key, count] (key)}
                    <button
                            type="button"
                            class="chip"
                            class:active={category === key}
                            aria-pressed={category === key}
                            onclick={() => (category = key)}
                    >
                        {key} <span class="chip-count">{count}</span>
                    </button>
                {/each}
            </div>
        {/if}
    {/if}

    <!-- ───────── Contenido ───────── -->
    {#if loading}
        <div class="projects-list" aria-busy="true" aria-label="Cargando proyectos">
            {#each [1, 2] as n (n)}
                <div class="project-card sk" aria-hidden="true">
                    <div class="sk-block sk-photo"></div>
                    <div class="sk-info">
                        <div class="sk-block sk-line short"></div>
                        <div class="sk-block sk-title"></div>
                        <div class="sk-block sk-line"></div>
                        <div class="sk-block sk-line mid"></div>
                    </div>
                </div>
            {/each}
        </div>
    {:else if loadError}
        <div class="state-box" role="alert" in:fade={{ duration: ms(250) }}>
            <p>No se pudieron cargar los proyectos publicados.</p>
            <button type="button" class="btn btn-ghost btn-small" onclick={load}>Reintentar</button>
        </div>
    {:else if !projects.length}
        <div class="empty" in:fade={{ duration: ms(250) }}>
            <h2>Próximamente</h2>
            <p>Estamos preparando casos de instalación con equipos y detalles técnicos.</p>
        </div>
    {:else}
        <div class="projects-list">
            {#each visible as p (p.id)}
                <article
                        class="project-card rv"
                        class:editorial={p.layout === 'editorial'}
                        class:mosaic={p.layout === 'gallery-grid'}
                        class:technical={p.layout === 'technical-report'}
                        use:reveal
                        animate:flip={{ duration: ms(380) }}
                >
                    {#if p.layout === 'hero-left'}
                        <div class="split" class:no-media={!p.gallery.length}>
                            {#if p.gallery.length}{@render media(p)}{/if}
                            {@render info(p)}
                        </div>
                    {:else if p.layout === 'editorial'}
                        <div class="split editorial" class:no-media={!p.gallery.length}>
                            {@render info(p)}
                            {#if p.gallery.length}{@render media(p)}{/if}
                        </div>
                    {:else if p.layout === 'gallery-grid'}
                        <div class="mosaic-head">
                            <div class="eyebrow">{p.category}{#if p.location} · {p.location}{/if}</div>
                            <h2>{p.title}</h2>
                            {@render desc(p)}
                        </div>
                        {#if p.gallery.length}
                            {@const shown = Math.min(p.gallery.length, MOSAIC_MAX)}
                            <div class="mosaic-gallery {mosaicClass(shown)}">
                                {#each p.gallery.slice(0, shown) as _, i}
                                    {@render photo(p, i, '', i === shown - 1 ? p.gallery.length - shown : 0)}
                                {/each}
                            </div>
                        {/if}
                        <div class="mosaic-specs">
                            <p class="system">{p.system_name}{#if p.capacity_kw} · {p.capacity_kw} kW{/if}</p>
                            {@render specs(p.specifications)}
                        </div>
                    {:else}
                        <div class="technical-head">
                            <div>
                                <div class="eyebrow">Ficha de instalación · {p.category}</div>
                                <h2>{p.title}</h2>
                                {@render desc(p)}
                            </div>
                            <div class="capacity">{p.capacity_kw ?? '—'}<small>kW instalados</small></div>
                        </div>
                        <div class="technical-data">
                            <div><small>Sistema</small><strong>{p.system_name || '—'}</strong></div>
                            <div><small>Inversor</small><strong>{p.inverter || '—'}</strong></div>
                            <div><small>Paneles</small><strong>{p.panels || '—'}</strong></div>
                            <div><small>Batería / respaldo</small><strong>{p.battery || '—'}</strong></div>
                            <div><small>Ubicación</small><strong>{p.location || '—'}</strong></div>
                        </div>
                        {@render specs(p.specifications)}
                        {#if p.gallery.length}
                            {@const shown = Math.min(p.gallery.length, TECH_MAX)}
                            <div class="technical-gallery">
                                {#each p.gallery.slice(0, shown) as _, i}
                                    {@render photo(p, i, '', i === shown - 1 ? p.gallery.length - shown : 0)}
                                {/each}
                            </div>
                        {/if}
                    {/if}
                </article>
            {/each}
        </div>
    {/if}

    <!-- ───────── CTA final ───────── -->
    <div class="banner rv" use:reveal>
        <div>
            <strong>¿Quieres una instalación como estas?</strong>
            <p>Evaluamos tu caso y diseñamos el sistema que realmente necesitas.</p>
        </div>
        <a class="btn btn-accent" href="/reservas">
            Solicitar presupuesto <span class="arrow" aria-hidden="true">→</span>
        </a>
    </div>
</section>

<!-- ───────── Fragmentos reutilizables ───────── -->
{#snippet photo(p: Project, i: number, cls = '', more = 0)}
    <button
            type="button"
            class="ph {cls}"
            style="--i: {i}"
            aria-label={`Ampliar foto ${i + 1} de ${p.title}`}
            onclick={() => openLightbox(p, i)}
    >
        <img src={p.gallery[i]} alt="" loading="lazy" decoding="async" />
        {#if more > 0}<span class="more">+{more}</span>{/if}
    </button>
{/snippet}

<!-- Columna de fotos: una principal de tamaño acotado + miniaturas -->
{#snippet media(p: Project)}
    {@const rest = p.gallery.slice(1, 5)}
    {@const hidden = p.gallery.length - 5}
    <div class="media-col">
        <div class="main-wrap">
            {@render photo(p, 0, 'main')}
            <span class="photo-label">Instalación SOLUX</span>
        </div>
        {#if rest.length}
            <div class="thumbs">
                {#each rest as _, i}
                    {@render photo(p, i + 1, '', i === rest.length - 1 && hidden > 0 ? hidden : 0)}
                {/each}
            </div>
        {/if}
    </div>
{/snippet}

{#snippet info(p: Project)}
    <div class="info">
        <div class="eyebrow">{p.category}{#if p.location} · {p.location}{/if}</div>
        <h2>{p.title}</h2>
        {#if p.system_name}<p class="system">{p.system_name}</p>{/if}
        {@render desc(p)}
        {@render chips(p)}
        {@render specs(p.specifications)}
    </div>
{/snippet}

<!-- Descripción: si es larga se recorta y se despliega con animación -->
{#snippet desc(p: Project)}
    {#if p.description}
        {@const long = isLong(p.description)}
        <div class="desc-wrap" class:long class:open={expanded[p.id]}>
            <p class="project-description" use:measure>{p.description}</p>
        </div>
        {#if long}
            <button
                    type="button"
                    class="more-btn"
                    aria-expanded={!!expanded[p.id]}
                    onclick={() => (expanded[p.id] = !expanded[p.id])}
            >
                {expanded[p.id] ? 'Ver menos' : 'Leer más'} <span class="chev" aria-hidden="true">⌄</span>
            </button>
        {/if}
    {/if}
{/snippet}

{#snippet chips(p: Project)}
    <div class="chips-row">
        {#if p.capacity_kw}<span>{p.capacity_kw} kW</span>{/if}
        {#if p.inverter}<span>{p.inverter}</span>{/if}
        {#if p.panels}<span>{p.panels}</span>{/if}
    </div>
{/snippet}

{#snippet specs(list: Spec[])}
    {#if list?.length}
        <div class="specs">
            {#each list as s, i}
                <div style="--i: {i}"><span>{s.label}</span><strong>{s.value}</strong></div>
            {/each}
        </div>
    {/if}
{/snippet}

<!-- ───────── Lightbox ───────── -->
{#if lightbox}
    <div class="lightbox" transition:fade={{ duration: ms(200) }}>
        <button type="button" class="lb-backdrop" aria-label="Cerrar" onclick={closeLightbox}></button>
        <div class="lb-dialog" role="dialog" aria-modal="true" aria-label={lightbox.title}>
            {#key lightbox.index}
                <img
                        src={lightbox.images[lightbox.index]}
                        alt={`${lightbox.title} — foto ${lightbox.index + 1}`}
                        in:fade={{ duration: ms(250) }}
                />
            {/key}
            {#if lightbox.images.length > 1}
                <button type="button" class="lb-nav prev" aria-label="Foto anterior" onclick={() => step(-1)}>‹</button>
                <button type="button" class="lb-nav next" aria-label="Foto siguiente" onclick={() => step(1)}>›</button>
                <span class="lb-count">{lightbox.index + 1} / {lightbox.images.length}</span>
            {/if}
            <button type="button" class="lb-close" aria-label="Cerrar" onclick={closeLightbox} use:focusOnMount>✕</button>
        </div>
    </div>
{/if}
