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

  // Recorrido de la energía: ordena los servicios como una cadena real
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

<section class="page" use:scrollDepth>
  <Ambient />

  <!-- ───────── Encabezado ───────── -->
  <div class="section-head intro">
    <div>
      <div class="eyebrow rise" style="--i: 0">{eyebrow}</div>
      {#key title}
        <h2 class="headline" aria-label={title}>
          {#each words as word, i}
            <span class="word" aria-hidden="true"
            ><span class="word-in" style="--w: {i}">{word}</span></span
            >{' '}
          {/each}
        </h2>
      {/key}
    </div>
    {#key description}
      <p class="rise" style="--i: 3" in:fade={{ duration: ms(300) }}>{description}</p>
    {/key}
  </div>

  <!-- ───────── Recorrido de la energía ───────── -->
  <ol class="chain rv" use:reveal aria-label="Recorrido de la energía">
    {#each chain as step, i (step.label)}
      <li class="link" style="--i: {i}">
        <span class="node" aria-hidden="true">{step.icon}</span>
        <strong>{step.label}</strong>
        <small>{step.text}</small>
      </li>
    {/each}
  </ol>

  <!-- ───────── Servicios (bento) ───────── -->
  <div class="bento">
    {#each services as s, i (s.title)}
      <article class="card service {s.size} rv" use:reveal={i * 80} use:spotlight>
        <div class="top">
          <div class="icon" aria-hidden="true">{s.icon}</div>
          <span class="stage">{s.stage}</span>
        </div>
        <div class="body">
          <h3>{s.title}</h3>
          <p>{s.text}</p>
        </div>
        <a class={s.size === 'full' ? 'btn btn-accent' : 'card-link'} href="/reservas">
          {s.cta} <span class="arrow" aria-hidden="true">→</span>
        </a>
      </article>
    {/each}
  </div>

  <!-- ───────── Ingeniería a medida ───────── -->
  <div class="feature">
    <div class="panel rv" use:reveal>
      <img class="panel-img" src={image} alt="" loading="lazy" decoding="async" />
      <div class="panel-body">
        <div class="eyebrow" style="color: var(--color-accent)">Ingeniería SOLUX</div>
        {#key secondaryTitle}
          <h2 in:fade={{ duration: ms(300) }}>{secondaryTitle}</h2>
        {/key}
        {#key secondaryText}
          <p class="lead" in:fade={{ duration: ms(300) }}>{secondaryText}</p>
        {/key}
        <ul class="criteria" aria-label="Qué evaluamos">
          {#each criteria as item, i (item)}
            <li style="--i: {i}">{item}</li>
          {/each}
        </ul>
      </div>
    </div>

    <div class="card why rv" use:reveal={140} use:spotlight>
      <h3>¿Por qué SOLUX?</h3>
      <ul class="check-list">
        {#each reasons as reason, i (reason)}
          <li style="--i: {i}">{reason}</li>
        {/each}
      </ul>
      <a class="btn btn-accent" href="/reservas">
        Solicitar evaluación <span class="arrow" aria-hidden="true">→</span>
      </a>
    </div>
  </div>

  <!-- ───────── CTA final ───────── -->
  <div class="banner rv" use:reveal>
    <div>
      <strong>Empecemos con una evaluación técnica.</strong>
      <p>Medimos tu consumo y te entregamos un presupuesto claro, sin compromiso de compra.</p>
    </div>
    <a class="btn btn-accent" href="/reservas">
      Reservar visita técnica <span class="arrow" aria-hidden="true">→</span>
    </a>
  </div>
</section>
