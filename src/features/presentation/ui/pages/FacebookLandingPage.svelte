<script lang="ts">
  import { onMount } from 'svelte';
  import Ambient from '$infrastructure/ui/component/Ambient.svelte';
  import { ms, reveal, scrollDepth } from '$infrastructure/ui/util/motion';
  import { fade } from 'svelte/transition';

  /** Landing para anuncios Facebook: siempre source=facebook en CTAs. */
  const paths = [
    {
      href: '/catalogo?intent=buy&source=facebook',
      icon: '🛒',
      title: 'Quiero un kit o equipo',
      text: 'Consulta precios y disponibilidad. Te orientamos sin compromiso.',
      cta: 'Ver catálogo',
      primary: false
    },
    {
      href: '/reservas?intent=install&source=facebook',
      icon: '⚡',
      title: 'Quiero instalar',
      text: 'Visita técnica, montaje y puesta en marcha con SOLUX en Guantánamo.',
      cta: 'Reservar visita',
      primary: true
    },
    {
      href: '/soporte?intent=maintain&source=facebook',
      icon: '🛠️',
      title: 'Ya tengo sistema',
      text: 'Mantenimiento, revisión o reparación de tu instalación actual.',
      cta: 'Abrir soporte',
      primary: false
    }
  ] as const;

  const bullets = [
    'Dimensionamiento según tu consumo real',
    'Equipos con alcance claro (solo equipo o kit + instalación)',
    'Soporte local en Guantánamo',
    'Seguimiento con código SLX'
  ];

  let ready = $state(false);
  onMount(() => {
    ready = true;
  });
</script>

<svelte:head>
  <title>Energía solar en Guantánamo | SOLUX</title>
  <meta
    name="description"
    content="Kits solares, instalación y mantenimiento en Guantánamo. Solicita visita técnica o consulta el catálogo SOLUX."
  />
  <meta name="robots" content="index, follow" />
</svelte:head>

<section class="fb-page" use:scrollDepth data-source="facebook">
  <Ambient />

  <div class="hero">
    <div class="hero-copy" class:in={ready}>
      <p class="eyebrow">SOLUX · Guantánamo</p>
      <h1>Energía solar clara.<br /><span class="accent">Sin pasos de más.</span></h1>
      <p class="lead">
        Desde Facebook llegas directo a lo que necesitas: comprar equipo, instalar un kit o
        mantener tu sistema. Elige tu camino.
      </p>
      <ul class="bullets">
        {#each bullets as b}
          <li>{b}</li>
        {/each}
      </ul>
      <div class="hero-ctas">
        <a class="btn btn-primary" href="/reservas?intent=install&source=facebook">
          Reservar visita técnica <span class="arrow" aria-hidden="true">→</span>
        </a>
        <a class="btn btn-ghost" href="/catalogo?intent=buy&source=facebook">Ver catálogo</a>
      </div>
    </div>
  </div>

  <div class="paths rv" use:reveal>
    <div class="section-head">
      <div>
        <p class="eyebrow">Elige en un toque</p>
        <h2>¿Qué necesitas hoy?</h2>
      </div>
    </div>
    <div class="path-grid">
      {#each paths as p}
        <a class="path-card" class:primary={p.primary} href={p.href}>
          <span class="icon" aria-hidden="true">{p.icon}</span>
          <strong>{p.title}</strong>
          <p>{p.text}</p>
          <span class="cta">{p.cta} <span class="arrow" aria-hidden="true">→</span></span>
        </a>
      {/each}
    </div>
  </div>

  <div class="trust rv" use:reveal>
    <p>
      Al continuar, tu consulta queda marcada como origen <strong>Facebook</strong> para que el
      equipo SOLUX te atienda con contexto.
    </p>
    <a class="link" href="/?source=facebook">Ir al sitio completo</a>
  </div>
</section>

<style>
  .fb-page {
    --ease: cubic-bezier(0.22, 1, 0.36, 1);
    isolation: isolate;
    max-width: 1100px;
    margin: 0 auto;
    padding: 12px 20px 48px;
  }
  .hero {
    padding: 36px 0 28px;
  }
  .hero-copy {
    max-width: 640px;
    opacity: 0;
    transform: translateY(16px);
    transition:
      opacity 0.7s var(--ease),
      transform 0.7s var(--ease);
  }
  .hero-copy.in {
    opacity: 1;
    transform: none;
  }
  .eyebrow {
    margin: 0 0 12px;
    color: var(--color-primary);
    font-size: 11px;
    font-weight: 800;
    letter-spacing: 0.14em;
    text-transform: uppercase;
  }
  h1 {
    margin: 0 0 16px;
    font-size: clamp(32px, 6vw, 48px);
    letter-spacing: -0.04em;
    line-height: 1.08;
  }
  .accent {
    color: var(--color-primary);
  }
  .lead {
    margin: 0 0 18px;
    color: var(--color-muted);
    font-size: 16px;
    line-height: 1.55;
    max-width: 52ch;
  }
  .bullets {
    margin: 0 0 24px;
    padding: 0;
    list-style: none;
    display: grid;
    gap: 8px;
  }
  .bullets li {
    position: relative;
    padding-left: 22px;
    font-size: 14px;
    color: var(--color-text);
  }
  .bullets li::before {
    content: '✓';
    position: absolute;
    left: 0;
    color: var(--color-primary);
    font-weight: 800;
  }
  .hero-ctas {
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
  }
  .arrow {
    display: inline-block;
    transition: transform 0.25s var(--ease);
  }
  a:hover > .arrow {
    transform: translateX(3px);
  }
  .section-head {
    margin-bottom: 18px;
  }
  .section-head h2 {
    margin: 0;
    font-size: clamp(22px, 3vw, 28px);
    letter-spacing: -0.03em;
  }
  .path-grid {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 14px;
  }
  .path-card {
    display: flex;
    flex-direction: column;
    gap: 8px;
    padding: 20px 18px;
    border: 1px solid var(--color-border);
    border-radius: 18px;
    background: var(--color-surface);
    color: inherit;
    text-decoration: none;
    transition:
      transform 0.3s var(--ease),
      border-color 0.3s var(--ease),
      box-shadow 0.3s var(--ease);
  }
  .path-card:hover {
    transform: translateY(-4px);
    border-color: var(--color-primary);
    box-shadow: var(--color-shadow, 0 12px 40px rgba(0, 0, 0, 0.08));
  }
  .path-card.primary {
    border-color: color-mix(in srgb, var(--color-primary) 45%, var(--color-border));
    background: color-mix(in srgb, var(--color-primary) 8%, var(--color-surface));
  }
  .path-card .icon {
    font-size: 22px;
  }
  .path-card strong {
    font-size: 16px;
  }
  .path-card p {
    margin: 0;
    flex: 1;
    color: var(--color-muted);
    font-size: 13.5px;
    line-height: 1.45;
  }
  .path-card .cta {
    margin-top: 8px;
    color: var(--color-primary);
    font-size: 13px;
    font-weight: 800;
  }
  .trust {
    margin-top: 32px;
    padding: 18px 20px;
    border-radius: 14px;
    border: 1px dashed var(--color-border);
    text-align: center;
  }
  .trust p {
    margin: 0 0 10px;
    color: var(--color-muted);
    font-size: 13px;
  }
  .trust .link {
    color: var(--color-primary);
    font-size: 13px;
    font-weight: 700;
  }
  .rv {
    opacity: 0;
    transform: translateY(20px);
    transition:
      opacity 0.65s var(--ease),
      transform 0.65s var(--ease);
  }
  .rv:global(.in) {
    opacity: 1;
    transform: none;
  }
  @media (max-width: 800px) {
    .path-grid {
      grid-template-columns: 1fr;
    }
  }
</style>
