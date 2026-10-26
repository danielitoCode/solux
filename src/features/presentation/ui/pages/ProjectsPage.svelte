<script lang="ts">
    import { invalidateAll } from '$app/navigation';
    import { flip } from 'svelte/animate';
    import { Tween } from 'svelte/motion';
    import { fade } from 'svelte/transition';
    import { cubicOut } from 'svelte/easing';
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

    type Header = {
        eyebrow: string;
        title: string;
        description: string;
    };

    const DEFAULT_HEADER: Header = {
        eyebrow: 'Proyectos',
        title: 'Instalaciones reales. Soluciones diseñadas para cada necesidad.',
        description: 'Equipos, características y resultados de instalaciones solares ejecutadas por SOLUX.'
    };

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

    function normalizeProjects(list: any[]): Project[] {
        return sortByCapacity(
            list.map((p) => ({
                id: p.id,
                title: p.title,
                location: p.location ?? '',
                category: p.category ?? '',
                system_name: p.system_name ?? '',
                capacity_kw: p.capacity_kw ?? null,
                inverter: p.inverter ?? '',
                panels: p.panels ?? '',
                battery: p.battery ?? '',
                description: p.description ?? '',
                gallery: p.gallery ?? [],
                specifications: p.specifications ?? [],
                layout: (p.layout ?? 'hero-left') as Layout
            }))
        );
    }

    /** Datos desde /proyectos/+page.ts load (prerender). */
    let {
        header = DEFAULT_HEADER,
        projects: projectsIn = [],
        loadError = false
    }: {
        header?: Header;
        projects?: any[];
        loadError?: boolean;
    } = $props();

    const projects = $derived(normalizeProjects(projectsIn ?? []));
    const loading = false;
    const words = $derived(header.title.split(/\s+/).filter(Boolean));

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

    const MOSAIC_MAX = 6;
    function mosaicClass(n: number) {
        if (n <= 2) return 'cols-2';
        if (n === 3) return 'cols-3';
        if (n === 4) return 'cols-4';
        return 'cols-many';
    }

    /* ─────────── Lightbox ─────────── */
    let lightbox = $state<{ images: string[]; index: number } | null>(null);
    function openLightbox(images: string[], index: number) {
        lightbox = { images, index };
    }
    function closeLightbox() {
        lightbox = null;
    }
    function focusOnMount(node: HTMLElement) {
        node.focus();
    }
</script>

<section class="page projects-page" use:scrollDepth>
    <Ambient />

    <div class="intro">
        <div class="eyebrow rise" style="--i: 0">{header.eyebrow}</div>
        {#key header.title}
            <h1 class="headline" aria-label={header.title}>
                {#each words as word, i (i)}
                    <span class="word" aria-hidden="true"
                        ><span class="word-in" style="--w: {i}">{word}</span></span
                    >{' '}
                {/each}
            </h1>
        {/key}
        <p class="lead rise" style="--i: 4">{header.description}</p>

        {#if !loading && !loadError && projects.length}
            <div class="metrics rise" style="--i: 5">
                <div class="metric">
                    <strong>{Math.round(countTween.current)}</strong>
                    <span>proyectos</span>
                </div>
                <div class="metric">
                    <strong>{formatKw(kwTween.current)} kW</strong>
                    <span>capacidad instalada</span>
                </div>
            </div>

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
    </div>

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
            <button type="button" class="btn btn-ghost btn-small" onclick={() => invalidateAll()}>Reintentar</button>
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
                            {#if p.gallery.length}
                                <div class="media">
                                    <img src={p.gallery[0]} alt="" loading="lazy" decoding="async" onclick={() => openLightbox(p.gallery, 0)} />
                                </div>
                            {/if}
                            <div class="info">
                                <div class="eyebrow">{p.category}{#if p.location} · {p.location}{/if}</div>
                                <h2>{p.title}</h2>
                                {#if p.system_name}<p class="system">{p.system_name}</p>{/if}
                                {#if p.capacity_kw != null}<p class="capacity">{formatKw(p.capacity_kw)} kW</p>{/if}
                                <p class="desc">{p.description}</p>
                            </div>
                        </div>
                    {:else}
                        <div class="info">
                            <div class="eyebrow">{p.category}{#if p.location} · {p.location}{/if}</div>
                            <h2>{p.title}</h2>
                            <p class="desc">{p.description}</p>
                        </div>
                    {/if}
                </article>
            {/each}
        </div>
    {/if}
</section>

{#if lightbox}
    <div class="lightbox" role="dialog" aria-modal="true" onclick={closeLightbox}>
        <div class="lb-inner" onclick={(e) => e.stopPropagation()}>
            <img src={lightbox.images[lightbox.index]} alt="" />
            <button type="button" class="lb-close" aria-label="Cerrar" onclick={closeLightbox} use:focusOnMount>✕</button>
        </div>
    </div>
{/if}
