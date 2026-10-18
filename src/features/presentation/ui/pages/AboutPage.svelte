<script lang="ts">
  import { onMount } from 'svelte';
  import { fade } from 'svelte/transition';
  import { loadSiteContent, type SitePageContent } from '$infrastructure/data/site-content';
  import { ms, reveal, scrollDepth, spotlight, tilt } from '$infrastructure/ui/util/motion';
  import Ambient from "$infrastructure/ui/component/Ambient.svelte";

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

  /* ─────────── Estado ─────────── */
  let pageContent = $state<SitePageContent>({});

  const eyebrow = $derived(pageContent.eyebrow || DEFAULTS.eyebrow);
  const title = $derived(pageContent.title || DEFAULTS.title);
  const words = $derived(title.split(/\s+/).filter(Boolean));
  const description = $derived(pageContent.description || DEFAULTS.description);
  const valuesEyebrow = $derived(pageContent.secondary_title || DEFAULTS.secondary_title);
  const valuesTitle = $derived(pageContent.secondary_description || DEFAULTS.secondary_description);
  const image = $derived(pageContent.image_1 || DEFAULTS.image_1);

  onMount(async () => {
    try {
      pageContent = await loadSiteContent('nosotros', DEFAULTS);
    } catch (err) {
      // Sin datos remotos la vista sigue funcionando con el contenido por defecto
      console.error('No se pudo cargar el contenido de nosotros', err);
    }
  });

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

<style>
  .page {
    --ease: cubic-bezier(0.22, 1, 0.36, 1);
    isolation: isolate;
  }

  /* ───────── Entrada orquestada ───────── */
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
  .hero-body .eyebrow {
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
    transform: translateX(5px);
  }

  /* ───────── Presentación inmersiva ───────── */
  .hero {
    position: relative;
    display: flex;
    flex-direction: column;
    justify-content: flex-end;
    min-height: 540px;
    padding: 55px;
    border-radius: 30px;
    overflow: hidden;
    color: white;
    box-shadow: var(--color-shadow);
  }
  .hero-img {
    position: absolute;
    inset: 0;
    z-index: 0;
    width: 100%;
    height: 100%;
    object-fit: cover;
    transform: scale(1.12);
    translate: calc(var(--mx, 0) * -14px) calc(var(--my, 0) * -14px + var(--py, 0) * 1px);
    transition: translate 0.35s ease-out;
    animation: kenburns 22s ease-out both;
  }
  @keyframes kenburns {
    from {
      transform: scale(1.3);
    }
    to {
      transform: scale(1.12);
    }
  }
  .hero::before {
    content: '';
    position: absolute;
    inset: 0;
    z-index: 1;
    background:
            linear-gradient(180deg, transparent 40%, rgba(0, 30, 15, 0.55)),
            linear-gradient(110deg, rgba(0, 55, 30, 0.92), rgba(0, 55, 30, 0.25));
  }
  /* Luz solar en la esquina, la misma que recorre el resto de la atmósfera */
  .hero-glow {
    position: absolute;
    z-index: 1;
    width: 420px;
    height: 420px;
    right: -120px;
    top: -150px;
    border-radius: 50%;
    background: radial-gradient(circle, var(--color-accent), transparent 65%);
    opacity: 0.26;
    translate: calc(var(--mx, 0) * 30px) calc(var(--my, 0) * 30px);
    transition: translate 0.35s ease-out;
    animation: glow 6s ease-in-out infinite;
  }
  @keyframes glow {
    50% {
      transform: scale(1.12);
      opacity: 0.36;
    }
  }
  .hero-body {
    position: relative;
    z-index: 2;
    max-width: 640px;
  }
  .hero .lead {
    color: rgba(255, 255, 255, 0.8);
  }

  /* Pilares en cristal sobre la imagen */
  .pillars {
    position: relative;
    z-index: 2;
    list-style: none;
    margin: 36px 0 0;
    padding: 0;
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 12px;
  }
  .pillar {
    display: grid;
    gap: 4px;
    padding: 16px 18px;
    border-radius: 18px;
    border: 1px solid rgba(255, 255, 255, 0.22);
    background: rgba(255, 255, 255, 0.1);
    backdrop-filter: blur(12px);
    transition:
            transform 0.35s var(--ease),
            background 0.35s var(--ease),
            border-color 0.35s var(--ease);
  }
  .pillar:hover {
    transform: translateY(-4px);
    background: rgba(255, 255, 255, 0.16);
    border-color: var(--color-accent);
  }
  .pillar strong {
    font-size: 14px;
  }
  .pillar span {
    font-size: 12px;
    opacity: 0.8;
  }

  /* ───────── Valores ───────── */
  .values {
    margin-top: 56px;
  }
  .values-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
    gap: 18px;
  }
  .value {
    position: relative;
    transition:
            transform 0.35s var(--ease),
            box-shadow 0.35s var(--ease),
            border-color 0.35s var(--ease),
            opacity 0.7s var(--ease),
            filter 0.7s var(--ease);
  }
  .value::before {
    content: '';
    position: absolute;
    inset: 0;
    border-radius: inherit;
    pointer-events: none;
    background: radial-gradient(
            260px circle at var(--sx, 50%) var(--sy, 50%),
            rgba(255, 191, 25, 0.16),
            transparent 65%
    );
    opacity: 0;
    transition: opacity 0.3s;
  }
  /* Línea de acento que crece al pasar el cursor */
  .value::after {
    content: '';
    position: absolute;
    left: 24px;
    right: 24px;
    bottom: 0;
    height: 2px;
    border-radius: 2px;
    background: linear-gradient(90deg, var(--color-primary), var(--color-accent));
    transform: scaleX(0);
    transform-origin: left;
    transition: transform 0.5s var(--ease);
  }
  .value:hover {
    transform: translateY(-6px);
    box-shadow: var(--color-shadow);
    border-color: var(--color-primary);
  }
  .value:hover::before {
    opacity: 1;
  }
  .value:hover::after {
    transform: scaleX(1);
  }
  .value .icon {
    transition: transform 0.4s var(--ease);
  }
  .value:hover .icon {
    transform: scale(1.18) rotate(-6deg);
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

  /* ───────── Responsive ───────── */
  @media (max-width: 900px) {
    .pillars {
      grid-template-columns: 1fr;
    }
  }
  @media (max-width: 600px) {
    .hero {
      padding: 30px;
      min-height: 480px;
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
    .hero-img,
    .hero-glow,
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
    .hero-img,
    .hero-glow,
    .pillar,
    .value,
    .value .icon,
    .value::after,
    .arrow {
      transition: none;
    }
  }
</style>
