<script lang="ts">
  import { fade } from 'svelte/transition';
  import type { SitePageContent } from '$infrastructure/data/site-content';
  import { ms, reveal, scrollDepth, spotlight } from '$infrastructure/ui/util/motion';
  import Ambient from "$infrastructure/ui/component/Ambient.svelte";

  /* ─────────── Contenido por defecto ─────────── */
  const DEFAULTS = {
    eyebrow: 'Servicios',
    title: 'Todo lo necesario en un solo lugar.',
    description:
            'Soluciones integrales para producir, almacenar, convertir y distribuir energía con seguridad.',
    secondary_title: 'Diseñado para tu realidad.',
    secondary_description:
            'No vendemos una solución estándar. Evaluamos consumo, espacio, respaldo y crecimiento antes de recomendar un sistema.',
    image_1:
            'https://images.unsplash.com/photo-1497435334941-8c899ee9e8e9?auto=format&fit=crop&w=1400&q=85'
  };

  /** Datos desde /servicios/+page.ts load (prerender). */
  let {
    pageContent = {} as SitePageContent
  }: {
    pageContent?: SitePageContent;
  } = $props();

  const eyebrow = $derived(pageContent.eyebrow || DEFAULTS.eyebrow);
  const title = $derived(pageContent.title || DEFAULTS.title);
  const words = $derived(title.split(/\s+/).filter(Boolean));
  const description = $derived(pageContent.description || DEFAULTS.description);
  const secondaryTitle = $derived(pageContent.secondary_title || DEFAULTS.secondary_title);
  const secondaryText = $derived(pageContent.secondary_description || DEFAULTS.secondary_description);
  const image = $derived(pageContent.image_1 || DEFAULTS.image_1);

  /* ─────────── Contenido estático ─────────── */
  type Size = '' | 'wide' | 'full';
  const services: { icon: string; title: string; text: string; stage: string; cta: string; size: Size }[] = [
    { icon: '☀', title: 'Paneles solares', text: 'Generación fotovoltaica a medida para hogares y negocios.', stage: 'Produce', cta: 'Cotizar paneles', size: 'wide' },
    { icon: '◈', title: 'Inversores', text: 'Conversión eficiente y gestión inteligente de la energía.', stage: 'Convierte', cta: 'Cotizar inversores', size: 'wide' },
    { icon: '▣', title: 'Baterías', text: 'Almacenamiento para mayor autonomía y respaldo.', stage: 'Almacena', cta: 'Cotizar baterías', size: '' },
    { icon: '⌁', title: 'Instalaciones eléctricas', text: 'Diseño e instalación residencial, comercial e industrial.', stage: 'Distribuye', cta: 'Solicitar instalación', size: '' },
    { icon: '✓', title: 'Mantenimiento', text: 'Revisión, diagnóstico y soporte técnico especializado.', stage: 'Cuida', cta: 'Agendar revisión', size: '' },
    { icon: '✦', title: 'Asesoría', text: 'Evaluación y presupuesto según tus necesidades reales.', stage: 'Planifica', cta: 'Reservar visita técnica', size: 'full' }
  ];

  const chain = [
    { icon: '☀', label: 'Produce', text: 'Paneles solares' },
    { icon: '◈', label: 'Convierte', text: 'Inversores' },
    { icon: '▣', label: 'Almacena', text: 'Baterías' },
    { icon: '⌁', label: 'Distribuye', text: 'Instalaciones eléctricas' }
  ];

  const criteria = ['Consumo', 'Espacio', 'Respaldo', 'Crecimiento'];

  const reasons = [
    'Evaluación técnica personalizada',
    'Dimensionamiento de sistemas',
    'Instalación profesional',
    'Configuración de inversores y baterías',
    'Soporte y mantenimiento'
  ];
</script>
