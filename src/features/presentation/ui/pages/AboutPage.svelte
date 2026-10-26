<script lang="ts">
  import { fade } from 'svelte/transition';
  import type { SitePageContent } from '$infrastructure/data/site-content';
  import { ms, reveal, scrollDepth, spotlight, tilt } from '$infrastructure/ui/util/motion';
  import Ambient from "$infrastructure/ui/component/Ambient.svelte";
  import './AboutPage.css';

  /* ─────────── Contenido por defecto ─────────── */
  const DEFAULTS = {
    eyebrow: 'Nosotros',
    title: 'Ingeniería, experiencia y pasión por la energía.',
    description:
            'En SOLUX creemos en el poder de la energía limpia para transformar hogares y negocios. Combinamos criterio técnico, instalación profesional y atención cercana.',
    secondary_title: 'Nuestros valores',
    secondary_description: 'Hecho con criterio.',
    image_1:
            'https://images.unsplash.com/photo-1497435334941-8c899ee9e8e9?auto=format&fit=crop&w=1400&q=85'
  };

  /** Datos desde /nosotros/+page.ts load (prerender). */
  let {
    pageContent = {} as SitePageContent
  }: {
    pageContent?: SitePageContent;
  } = $props();

  const eyebrow = $derived(pageContent.eyebrow || DEFAULTS.eyebrow);
  const title = $derived(pageContent.title || DEFAULTS.title);
  const words = $derived(title.split(/\s+/).filter(Boolean));
  const description = $derived(pageContent.description || DEFAULTS.description);
  const valuesEyebrow = $derived(pageContent.secondary_title || DEFAULTS.secondary_title);
  const valuesTitle = $derived(pageContent.secondary_description || DEFAULTS.secondary_description);
  const image = $derived(pageContent.image_1 || DEFAULTS.image_1);

  /* ─────────── Contenido estático ─────────── */
  const pillars = [
    { title: 'Criterio técnico', text: 'Dimensionamos cada sistema según tu consumo real.' },
    { title: 'Instalación profesional', text: 'Montaje y puesta en marcha a cargo de técnicos.' },
    { title: 'Atención cercana', text: 'Te acompañamos antes, durante y después del proyecto.' }
  ];

  const values = [
    { icon: '♻', title: 'Sostenibilidad', text: 'Cuidamos el planeta' },
    { icon: '◈', title: 'Calidad', text: 'Cuidamos cada detalle' },
    { icon: '♥', title: 'Compromiso', text: 'Construimos confianza' },
    { icon: '✦', title: 'Innovación', text: 'Pensamos para el futuro' }
  ];
</script>

<section class="page" use:scrollDepth>
  <Ambient />

  <!-- ───────── Presentación ───────── -->
  <div class="hero" use:tilt>
    <img class="hero-img" src={image} alt="" fetchpriority="high" decoding="async" />
    <div class="hero-glow" aria-hidden="true"></div>

    <div class="hero-body">
      <div class="eyebrow rise" style="--i: 0; color: var(--color-accent)">{eyebrow}</div>

      {#key title}
        <h2 class="headline" aria-label={title}>
          {#each words as word, i}
            <span class="word" aria-hidden="true"
            ><span class="word-in" style="--w: {i}">{word}</span></span
            >{' '}
          {/each}
        </h2>
      {/key}

      {#key description}
        <p class="lead rise" style="--i: 6" in:fade={{ duration: ms(300) }}>{description}</p>
      {/key}
    </div>

    <ul class="pillars">
      {#each pillars as pillar, i (pillar.title)}
        <li class="pillar rise" style="--i: {8 + i}">
          <strong>{pillar.title}</strong>
          <span>{pillar.text}</span>
        </li>
      {/each}
    </ul>
  </div>

  <!-- ───────── Valores ───────── -->
  <div class="section-head values rv" use:reveal>
    <div>
      <div class="eyebrow">{valuesEyebrow}</div>
      <h2>{valuesTitle}</h2>
    </div>
  </div>

  <div class="values-grid">
    {#each values as v, i (v.title)}
      <article class="card value rv" use:reveal={i * 90} use:spotlight>
        <div class="icon" aria-hidden="true">{v.icon}</div>
        <h3>{v.title}</h3>
        <p>{v.text}</p>
      </article>
    {/each}
  </div>

  <!-- ───────── CTA final ───────── -->
  <div class="banner rv" use:reveal>
    <div>
      <strong>¿Hablamos de tu proyecto?</strong>
      <p>Cuéntanos qué necesitas y te acompañamos desde la evaluación hasta el mantenimiento.</p>
    </div>
    <a class="btn btn-accent" href="/reservas">
      Reservar visita técnica <span class="arrow" aria-hidden="true">→</span>
    </a>
  </div>
</section>
