<script lang="ts">
    import { onMount } from 'svelte';
    import { flip } from 'svelte/animate';
    import { Tween } from 'svelte/motion';
    import { fade } from 'svelte/transition';
    import { cubicOut } from 'svelte/easing';
    import { supabase } from '$infrastructure/data/supabase-client';
    import { ms, reveal, scrollDepth } from '$infrastructure/ui/util/motion';
    import Ambient from "$infrastructure/ui/component/Ambient.svelte";

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

    async function load() {
        loading = true;
        loadError = false;
        try {
            const [contentResult, projectsResult] = await Promise.all([
                supabase.from('site_content').select('content').eq('page_slug', 'proyectos').maybeSingle(),
                supabase
                    .from('site_projects')
                    .select('*')
                    .eq('is_published', true)
                    .order('sort_order')
                    .order('created_at', { ascending: false })
            ]);

            if (contentResult.data?.content) {
                const c = contentResult.data.content as Partial<typeof header>;
                header = {
                    eyebrow: c.eyebrow || header.eyebrow,
                    title: c.title || header.title,
                    description: c.description || header.description
                };
            }

            if (projectsResult.error) {
                loadError = true;
            } else {
                // Normaliza listas que pueden llegar vacías (null) desde la base de datos
                projects = ((projectsResult.data ?? []) as unknown as Project[]).map((p) => ({
                    ...p,
                    gallery: p.gallery ?? [],
                    specifications: p.specifications ?? []
                }));
            }
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
    const visible = $derived(category === 'all' ? projects : projects.filter((p) => p.category === category));

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

<style>
    .page {
        --ease: cubic-bezier(0.22, 1, 0.36, 1);
        --media-bg: var(--color-surface-2, var(--color-border));
        isolation: isolate;
    }
    .projects-page {
        padding-bottom: 72px;
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
    .intro h1 {
        font-size: clamp(28px, 4vw, 46px);
        line-height: 1.08;
        letter-spacing: -0.045em;
        margin: 10px 0;
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
        animation-delay: calc(0.2s + var(--w) * 70ms);
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
        transform: translateX(5px);
    }

    /* ───────── Métricas y filtros ───────── */
    .summary {
        display: flex;
        flex-wrap: wrap;
        margin: 30px 0 20px;
        width: fit-content;
        max-width: 100%;
        border: 1px solid var(--color-border);
        border-radius: 20px;
        background: rgba(255, 255, 255, 0.03);
        backdrop-filter: blur(10px);
    }
    .metric {
        display: grid;
        gap: 2px;
        padding: 16px 26px;
    }
    .metric + .metric {
        border-left: 1px solid var(--color-border);
    }
    .metric strong {
        font-size: 26px;
        letter-spacing: -0.03em;
        font-variant-numeric: tabular-nums;
    }
    .metric small {
        font-size: 14px;
        color: var(--color-muted);
    }
    .metric span {
        color: var(--color-muted);
        font-size: 12px;
    }
    .chips {
        display: flex;
        gap: 8px;
        overflow-x: auto;
        padding-bottom: 4px;
        margin-bottom: 22px;
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
    .chip:focus-visible,
    .ph:focus-visible {
        outline: 2px solid var(--color-primary);
        outline-offset: 2px;
    }
    .chip-count {
        font-size: 11px;
        opacity: 0.7;
        font-variant-numeric: tabular-nums;
    }

    /* ───────── Tarjetas de proyecto ───────── */
    .projects-list {
        display: grid;
        gap: 28px;
    }
    .project-card {
        border: 1px solid var(--color-border);
        border-radius: 24px;
        background: var(--color-surface);
        /* clip (no hidden) para recortar esquinas sin romper el sticky interno */
        overflow: clip;
        transition:
                border-color 0.35s var(--ease),
                box-shadow 0.35s var(--ease),
                opacity 0.7s var(--ease),
                transform 0.7s var(--ease),
                filter 0.7s var(--ease);
    }
    .project-card:hover {
        border-color: var(--color-primary);
        box-shadow: var(--color-shadow);
    }

    /* ───────── Fotos: siempre con proporción fija, nunca se estiran ───────── */
    .ph {
        position: relative;
        display: block;
        width: 100%;
        aspect-ratio: 4 / 3;
        padding: 0;
        border: 0;
        border-radius: 14px;
        overflow: hidden;
        background: var(--media-bg);
        cursor: zoom-in;
    }
    .ph img {
        position: absolute;
        inset: 0;
        width: 100%;
        height: 100%;
        object-fit: cover;
        transform: scale(1.12);
        transition: transform 1.2s var(--ease);
        transition-delay: calc(var(--i, 0) * 60ms);
    }
    .project-card:global(.in) .ph img {
        transform: scale(1);
    }
    .project-card:global(.in) .ph:hover img {
        transform: scale(1.06);
        transition-delay: 0ms;
        transition-duration: 0.8s;
    }
    /* "+N": fotos adicionales que no caben en la tarjeta */
    .more {
        position: absolute;
        inset: 0;
        z-index: 1;
        display: grid;
        place-items: center;
        color: white;
        font-size: 20px;
        font-weight: 800;
        background: rgba(0, 0, 0, 0.55);
        backdrop-filter: blur(2px);
    }

    /* ───────── Layouts hero-left y editorial (misma base robusta) ───────── */
    .split {
        display: grid;
        grid-template-columns: minmax(0, 1.05fr) minmax(0, 0.95fr);
        gap: clamp(20px, 3vw, 44px);
        padding: clamp(14px, 2.2vw, 26px);
        align-items: start;
    }
    .split.editorial {
        grid-template-columns: minmax(0, 0.95fr) minmax(0, 1.05fr);
    }
    .split.no-media {
        grid-template-columns: minmax(0, 1fr);
    }
    /* La columna de fotos mantiene su tamaño y acompaña la lectura */
    .media-col {
        display: grid;
        gap: 10px;
        position: sticky;
        top: 92px;
    }
    .main-wrap {
        position: relative;
    }
    .main-wrap .ph {
        border-radius: 18px;
    }
    .photo-label {
        position: absolute;
        left: 14px;
        bottom: 14px;
        z-index: 1;
        padding: 8px 12px;
        border-radius: 999px;
        color: white;
        font-size: 11px;
        font-weight: 800;
        background: rgba(0, 0, 0, 0.45);
        border: 1px solid rgba(255, 255, 255, 0.22);
        backdrop-filter: blur(10px);
        pointer-events: none;
    }
    .thumbs {
        display: grid;
        grid-template-columns: repeat(4, minmax(0, 1fr));
        gap: 8px;
    }
    .thumbs .ph {
        aspect-ratio: 1;
        border-radius: 12px;
    }

    .info {
        min-width: 0;
        padding: clamp(6px, 1.5vw, 18px);
    }
    .info h2,
    .mosaic-head h2,
    .technical-head h2 {
        font-size: clamp(24px, 3vw, 36px);
        line-height: 1.12;
        letter-spacing: -0.035em;
        margin: 10px 0;
    }
    .system {
        margin: 0;
        font-weight: 750;
        color: var(--color-text);
        font-size: 15px;
    }

    /* Descripción recortada con "Leer más" */
    .project-description {
        margin: 12px 0 0;
        white-space: pre-wrap;
        overflow-wrap: anywhere;
        color: var(--color-muted);
        line-height: 1.7;
        font-size: 14px;
    }
    .desc-wrap.long .project-description {
        max-height: calc(1.7em * 6);
        overflow: hidden;
        transition: max-height 0.55s var(--ease);
        -webkit-mask-image: linear-gradient(#000 55%, transparent);
        mask-image: linear-gradient(#000 55%, transparent);
    }
    .desc-wrap.long.open .project-description {
        max-height: var(--full, 2000px);
        -webkit-mask-image: none;
        mask-image: none;
    }
    .more-btn {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        margin-top: 8px;
        padding: 0;
        border: 0;
        background: none;
        color: var(--color-primary);
        font: inherit;
        font-size: 12px;
        font-weight: 800;
        cursor: pointer;
    }
    .more-btn .chev {
        transition: transform 0.3s var(--ease);
    }
    .more-btn[aria-expanded='true'] .chev {
        transform: rotate(180deg);
    }
    .more-btn:focus-visible {
        outline: 2px solid var(--color-primary);
        outline-offset: 3px;
        border-radius: 4px;
    }

    .chips-row {
        display: flex;
        flex-wrap: wrap;
        gap: 7px;
        margin: 18px 0;
    }
    .chips-row span {
        border: 1px solid var(--color-border);
        border-radius: 999px;
        padding: 7px 10px;
        font-size: 11px;
        font-weight: 700;
    }

    /* Especificaciones: cada fila aparece en cadena */
    .specs {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 0 18px;
        margin-top: 20px;
        border-top: 1px solid var(--color-border);
    }
    .specs div {
        display: flex;
        justify-content: space-between;
        gap: 10px;
        padding: 12px 0;
        border-bottom: 1px solid var(--color-border);
        font-size: 12px;
        opacity: 0;
        transform: translateX(-8px);
        transition:
                opacity 0.5s var(--ease),
                transform 0.5s var(--ease);
        transition-delay: calc(400ms + var(--i, 0) * 60ms);
    }
    .project-card:global(.in) .specs div {
        opacity: 1;
        transform: none;
    }
    .specs span {
        color: var(--color-muted);
    }
    .specs strong {
        text-align: right;
    }

    /* ───────── Layout gallery-grid: el mosaico se adapta al nº de fotos ───────── */
    .mosaic-head {
        padding: 28px 30px 8px;
        max-width: 860px;
    }
    .mosaic-gallery {
        display: grid;
        grid-template-columns: repeat(3, minmax(0, 1fr));
        grid-auto-rows: clamp(120px, 16vw, 190px);
        gap: 10px;
        padding: 14px;
    }
    .mosaic-gallery .ph {
        height: 100%;
        aspect-ratio: auto;
        border-radius: 12px;
    }
    .mosaic-gallery.m1 {
        grid-template-columns: minmax(0, 1fr);
        grid-auto-rows: auto;
    }
    .mosaic-gallery.m1 .ph {
        aspect-ratio: 16 / 9;
        max-height: 480px;
    }
    .mosaic-gallery.m2,
    .mosaic-gallery.m4 {
        grid-template-columns: repeat(2, minmax(0, 1fr));
    }
    .mosaic-gallery.m3 {
        grid-template-columns: minmax(0, 1.3fr) minmax(0, 1fr);
    }
    .mosaic-gallery.m3 .ph:first-child {
        grid-row: span 2;
    }
    .mosaic-gallery.m5 .ph:first-child,
    .mosaic-gallery.m6 .ph:first-child {
        grid-column: span 2;
        grid-row: span 2;
    }
    .mosaic-gallery.m5 .ph:last-child {
        grid-column: span 2;
    }
    .mosaic-specs {
        padding: 0 30px 26px;
    }

    /* ───────── Layout technical-report ───────── */
    .technical-head {
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 24px;
        padding: 28px 30px;
        background: var(--media-bg);
    }
    .technical-head > div:first-child {
        max-width: 760px;
    }
    .capacity {
        flex-shrink: 0;
        font-size: 34px;
        font-weight: 850;
        letter-spacing: -0.05em;
        font-variant-numeric: tabular-nums;
    }
    .capacity small {
        display: block;
        font-size: 10px;
        letter-spacing: 0;
        color: var(--color-muted);
    }
    .technical-data {
        display: grid;
        grid-template-columns: repeat(5, minmax(0, 1fr));
        border-block: 1px solid var(--color-border);
    }
    .technical-data div {
        display: flex;
        flex-direction: column;
        gap: 7px;
        padding: 18px;
        transition: background 0.3s var(--ease);
    }
    .technical-data div + div {
        border-left: 1px solid var(--color-border);
    }
    .technical-data div:hover {
        background: color-mix(in srgb, var(--color-primary) 8%, transparent);
    }
    .technical-data small {
        font-size: 11px;
        color: var(--color-muted);
    }
    .technical-data strong {
        font-size: 12px;
    }
    .technical > .specs {
        margin: 20px 28px;
    }
    .technical-gallery {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
        gap: 10px;
        padding: 14px;
    }
    .technical-gallery .ph {
        border-radius: 10px;
    }

    /* ───────── Carga, error y vacío ───────── */
    .sk {
        display: grid;
        grid-template-columns: 1.1fr 0.9fr;
        min-height: 420px;
    }
    .sk-info {
        padding: 44px;
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
    .sk-photo {
        border-radius: 0;
    }
    .sk-title {
        height: 30px;
        width: 75%;
        margin: 16px 0;
    }
    .sk-line {
        height: 12px;
        margin: 12px 0;
    }
    .sk-line.short {
        width: 35%;
    }
    .sk-line.mid {
        width: 70%;
    }
    @keyframes shimmer {
        to {
            background-position: -200% 0;
        }
    }
    .state-box,
    .empty {
        display: grid;
        justify-items: center;
        gap: 14px;
        padding: 50px 20px;
        text-align: center;
        border: 1px dashed var(--color-border);
        border-radius: 18px;
    }
    .state-box p,
    .empty p {
        margin: 0;
        color: var(--color-muted);
        font-size: 13px;
    }

    /* ───────── Lightbox ───────── */
    .lightbox {
        position: fixed;
        inset: 0;
        z-index: 100;
        display: grid;
        place-items: center;
        padding: 24px;
    }
    .lb-backdrop {
        position: absolute;
        inset: 0;
        border: 0;
        background: rgba(0, 0, 0, 0.84);
        backdrop-filter: blur(8px);
        cursor: zoom-out;
    }
    .lb-dialog {
        position: relative;
        max-width: min(1100px, 100%);
        max-height: 100%;
    }
    .lb-dialog img {
        display: block;
        max-width: 100%;
        max-height: calc(100vh - 48px);
        border-radius: 18px;
        box-shadow: var(--color-shadow);
    }
    .lb-close,
    .lb-nav {
        position: absolute;
        width: 40px;
        height: 40px;
        border: 0;
        border-radius: 50%;
        color: white;
        cursor: pointer;
        background: rgba(0, 0, 0, 0.55);
        backdrop-filter: blur(8px);
        transition: transform 0.25s var(--ease);
    }
    .lb-close {
        top: 12px;
        right: 12px;
        font-size: 15px;
    }
    .lb-close:hover {
        transform: scale(1.1) rotate(90deg);
    }
    .lb-nav {
        top: 50%;
        font-size: 26px;
        line-height: 1;
        translate: 0 -50%;
    }
    .lb-nav.prev {
        left: 12px;
    }
    .lb-nav.next {
        right: 12px;
    }
    .lb-nav:hover {
        transform: scale(1.12);
    }
    .lb-count {
        position: absolute;
        left: 50%;
        bottom: 12px;
        translate: -50% 0;
        padding: 5px 12px;
        border-radius: 999px;
        color: white;
        font-size: 12px;
        background: rgba(0, 0, 0, 0.55);
    }
    .lb-close:focus-visible,
    .lb-nav:focus-visible {
        outline: 2px solid var(--color-accent);
        outline-offset: 2px;
    }

    /* ───────── Banner final ───────── */
    .banner {
        position: relative;
        overflow: hidden;
        margin-top: 45px;
        border-radius: 26px;
        padding: 30px;
        background: linear-gradient(115deg, var(--color-primary), #07572f, var(--color-primary));
        background-size: 200% 100%;
        color: white;
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 20px;
        animation: banner-shift 10s ease-in-out infinite alternate;
    }
    .banner > * {
        position: relative;
        z-index: 1;
    }
    .banner::after {
        content: '';
        position: absolute;
        right: -40px;
        top: -60px;
        width: 220px;
        height: 220px;
        border-radius: 50%;
        background: var(--color-accent);
        filter: blur(40px);
        opacity: 0.2;
        animation: glow 5s ease-in-out infinite;
    }
    .banner p {
        margin: 6px 0 0;
        opacity: 0.8;
    }
    .banner .btn {
        transition: transform 0.25s var(--ease);
    }
    .banner .btn:hover {
        transform: translateY(-3px);
    }
    @keyframes banner-shift {
        to {
            background-position: 100% 0;
        }
    }
    @keyframes glow {
        50% {
            transform: scale(1.12);
            opacity: 0.32;
        }
    }

    /* ───────── Responsive ───────── */
    @media (max-width: 850px) {
        .split,
        .split.editorial,
        .sk {
            grid-template-columns: minmax(0, 1fr);
        }
        /* En una columna la foto va primero y deja de ser sticky */
        .media-col {
            position: static;
        }
        .split.editorial .media-col {
            order: -1;
        }
        .technical-data {
            grid-template-columns: repeat(2, minmax(0, 1fr));
        }
        .technical-data div + div {
            border-left: 0;
            border-top: 1px solid var(--color-border);
        }
        .mosaic-gallery {
            grid-auto-rows: 140px;
        }
        .technical-head {
            align-items: flex-start;
            flex-direction: column;
        }
        .sk-photo {
            min-height: 240px;
        }
        .sk-info {
            padding: 24px;
        }
    }
    @media (max-width: 520px) {
        .specs {
            grid-template-columns: 1fr;
        }
        .mosaic-gallery.m2,
        .mosaic-gallery.m3,
        .mosaic-gallery.m4,
        .mosaic-gallery.m5,
        .mosaic-gallery.m6 {
            grid-template-columns: repeat(2, minmax(0, 1fr));
            grid-auto-rows: 130px;
        }
        .mosaic-gallery.m3 .ph:first-child,
        .mosaic-gallery.m5 .ph:first-child,
        .mosaic-gallery.m6 .ph:first-child {
            grid-column: 1 / -1;
            grid-row: span 2;
        }
        .mosaic-gallery.m5 .ph:last-child {
            grid-column: auto;
        }
        .technical-gallery {
            grid-template-columns: repeat(2, minmax(0, 1fr));
        }
        .technical-head,
        .mosaic-head,
        .mosaic-specs {
            padding-inline: 18px;
        }
        .metric {
            padding: 14px 18px;
        }
        .banner {
            display: block;
        }
        .banner .btn {
            margin-top: 18px;
        }
    }

    /* ───────── Accesibilidad: reduce el movimiento ───────── */
    @media (prefers-reduced-motion: reduce) {
        .rise,
        .word-in,
        .sk-block,
        .banner,
        .banner::after {
            animation: none;
        }
        .rv {
            opacity: 1;
            transform: none;
            filter: none;
            transition: none;
        }
        .project-card,
        .ph img,
        .specs div,
        .chip,
        .arrow,
        .project-description,
        .more-btn .chev {
            transition: none;
        }
        .ph img {
            transform: none;
        }
        .specs div {
            opacity: 1;
            transform: none;
        }
    }
</style>