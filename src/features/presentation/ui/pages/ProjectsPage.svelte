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

    /* ─────────── Filtro por categoría ─────────── */
    let category = $state('all');

    const categories = $derived.by(() => {
        const counts = new Map<string, number>();
        for (const p of projects) if (p.category) counts.set(p.category, (counts.get(p.category) ?? 0) + 1);
        return [...counts];
    });
    const visible = $derived(
        sortByCapacity(category === 'all' ? projects : projects.filter((p) => p.category === category))
    );

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
