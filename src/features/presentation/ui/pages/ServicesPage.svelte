<script lang="ts">
  import { onMount } from 'svelte';
  import { fade } from 'svelte/transition';
  import { loadSiteContent, type SitePageContent } from '$infrastructure/data/site-content';
  import { ms, reveal, scrollDepth, spotlight } from '../util/motion';
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

  /* ─────────── Estado ─────────── */
  let pageContent = $state<SitePageContent>({});

  const eyebrow = $derived(pageContent.eyebrow || DEFAULTS.eyebrow);
  const title = $derived(pageContent.title || DEFAULTS.title);
  const words = $derived(title.split(/\s+/).filter(Boolean));
  const description = $derived(pageContent.description || DEFAULTS.description);
  const secondaryTitle = $derived(pageContent.secondary_title || DEFAULTS.secondary_title);
  const secondaryText = $derived(pageContent.secondary_description || DEFAULTS.secondary_description);
  const image = $derived(pageContent.image_1 || DEFAULTS.image_1);

  onMount(async () => {
    try {
      pageContent = await loadSiteContent('servicios', DEFAULTS);
    } catch (err) {
      // Sin datos remotos la vista sigue funcionando con el contenido por defecto
      console.error('No se pudo cargar el contenido de servicios', err);
    }
  });

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

<style>
  .page {
    --ease: cubic-bezier(0.22, 1, 0.36, 1);
    isolation: isolate;
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

  /* ───────── Recorrido de la energía ───────── */
  .chain {
    position: relative;
    list-style: none;
    margin: 48px 0 56px;
    padding: 0;
    display: grid;
    grid-template-columns: repeat(4, 1fr);
  }
  /* Línea que se dibuja y por la que viaja un pulso de luz */
  .chain::before {
    content: '';
    position: absolute;
    top: 21px;
    left: 12.5%;
    right: 12.5%;
    height: 2px;
    border-radius: 2px;
    background:
            linear-gradient(90deg, transparent, var(--color-accent), transparent) -40% 0 / 30% 100% no-repeat,
            var(--color-border);
    transform: scaleX(0);
    transform-origin: left;
    transition: transform 1.2s var(--ease) 0.2s;
    animation: pulse-travel 3.6s linear 1.4s infinite;
  }
  .chain:global(.in)::before {
    transform: scaleX(1);
  }
  @keyframes pulse-travel {
    to {
      background-position:
              140% 0,
              0 0;
    }
  }
  .link {
    position: relative;
    display: grid;
    justify-items: center;
    gap: 4px;
    text-align: center;
  }
  .node {
    display: grid;
    place-items: center;
    width: 44px;
    height: 44px;
    margin-bottom: 10px;
    border-radius: 50%;
    background: var(--color-primary);
    color: white;
    font-size: 18px;
    animation: node-ring 3.6s ease-out infinite;
    animation-delay: calc(1.4s + var(--i) * 0.9s);
  }
  @keyframes node-ring {
    0% {
      box-shadow: 0 0 0 0 rgba(8, 120, 62, 0.55);
    }
    30%,
    100% {
      box-shadow: 0 0 0 14px rgba(8, 120, 62, 0);
    }
  }
  .link strong {
    font-size: 15px;
  }
  .link small {
    color: var(--color-muted);
    font-size: 12px;
  }

  /* ───────── Bento de servicios ───────── */
  .bento {
    display: grid;
    grid-template-columns: repeat(6, 1fr);
    gap: 18px;
  }
  .service {
    position: relative;
    grid-column: span 2;
    display: flex;
    flex-direction: column;
    transition:
            transform 0.35s var(--ease),
            box-shadow 0.35s var(--ease),
            border-color 0.35s var(--ease),
            opacity 0.7s var(--ease),
            filter 0.7s var(--ease);
  }
  .service.wide {
    grid-column: span 3;
    min-height: 250px;
  }
  .service.full {
    grid-column: 1 / -1;
    display: grid;
    grid-template-columns: auto 1fr auto;
    align-items: center;
    gap: 24px;
  }
  .top {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    margin-bottom: 18px;
  }
  .full .top {
    margin-bottom: 0;
  }
  .full .stage {
    display: none;
  }
  .stage {
    padding: 4px 11px;
    border: 1px solid var(--color-border);
    border-radius: 999px;
    color: var(--color-muted);
    font-size: 12px;
    font-weight: 700;
  }
  .body h3 {
    margin: 0 0 6px;
  }
  .body p {
    margin: 0;
  }
  /* Resplandor que sigue al cursor */
  .service::before {
    content: '';
    position: absolute;
    inset: 0;
    border-radius: inherit;
    pointer-events: none;
    background: radial-gradient(
            280px circle at var(--sx, 50%) var(--sy, 50%),
            rgba(255, 191, 25, 0.16),
            transparent 65%
    );
    opacity: 0;
    transition: opacity 0.3s;
  }
  .service:hover::before {
    opacity: 1;
  }
  .service:hover {
    transform: translateY(-6px);
    box-shadow: var(--color-shadow);
    border-color: var(--color-primary);
  }
  .service:focus-within {
    outline: 2px solid var(--color-primary);
    outline-offset: 3px;
  }
  .service .icon {
    transition: transform 0.4s var(--ease);
  }
  .service:hover .icon {
    transform: scale(1.18) rotate(-6deg);
  }
  .card-link {
    margin-top: auto;
    padding-top: 20px;
    color: var(--color-primary);
    font-size: 12px;
    font-weight: 800;
    display: inline-block;
  }
  .card-link:focus-visible {
    outline: none;
  }
  /* Área de clic: toda la tarjeta */
  .service a::after {
    content: '';
    position: absolute;
    inset: 0;
    border-radius: inherit;
  }
  .service:hover .arrow {
    transform: translateX(5px);
  }

  /* ───────── Ingeniería a medida ───────── */
  .feature {
    display: grid;
    grid-template-columns: 1.25fr 0.75fr;
    gap: 18px;
    margin-top: 45px;
  }
  .panel {
    position: relative;
    display: flex;
    align-items: flex-end;
    min-height: 430px;
    padding: 55px;
    border-radius: 30px;
    overflow: hidden;
    color: white;
  }
  .panel-img {
    position: absolute;
    inset: 0;
    z-index: 0;
    width: 100%;
    height: 100%;
    object-fit: cover;
    transform: scale(1.18);
    transition: transform 2.6s var(--ease);
  }
  .panel:global(.in) .panel-img {
    transform: scale(1.04);
  }
  .panel::before {
    content: '';
    position: absolute;
    inset: 0;
    z-index: 1;
    background: linear-gradient(110deg, rgba(0, 55, 30, 0.92), rgba(0, 55, 30, 0.25));
  }
  /* Calidez solar en la esquina, coherente con el resto de la atmósfera */
  .panel::after {
    content: '';
    position: absolute;
    z-index: 1;
    width: 340px;
    height: 340px;
    right: -90px;
    top: -110px;
    border-radius: 50%;
    background: radial-gradient(circle, var(--color-accent), transparent 65%);
    opacity: 0.22;
    animation: glow 6s ease-in-out infinite;
  }
  @keyframes glow {
    50% {
      transform: scale(1.12);
      opacity: 0.32;
    }
  }
  .panel-body {
    position: relative;
    z-index: 2;
    max-width: 560px;
  }
  .panel .lead {
    color: rgba(255, 255, 255, 0.8);
  }
  .criteria {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    list-style: none;
    margin: 22px 0 0;
    padding: 0;
  }
  .criteria li {
    padding: 7px 14px;
    border-radius: 999px;
    border: 1px solid rgba(255, 255, 255, 0.22);
    background: rgba(255, 255, 255, 0.12);
    backdrop-filter: blur(8px);
    font-size: 12px;
    font-weight: 700;
    opacity: 0;
    transform: translateY(8px);
    transition:
            opacity 0.5s var(--ease),
            transform 0.5s var(--ease);
  }
  .panel:global(.in) .criteria li {
    opacity: 1;
    transform: none;
    transition-delay: calc(600ms + var(--i) * 90ms);
  }

  /* Tarjeta "¿Por qué SOLUX?" */
  .why {
    position: relative;
    display: flex;
    flex-direction: column;
  }
  .why::before {
    content: '';
    position: absolute;
    inset: 0;
    border-radius: inherit;
    pointer-events: none;
    background: radial-gradient(
            280px circle at var(--sx, 50%) var(--sy, 50%),
            rgba(255, 191, 25, 0.14),
            transparent 65%
    );
    opacity: 0;
    transition: opacity 0.3s;
  }
  .why:hover::before {
    opacity: 1;
  }
  .check-list {
    list-style: none;
    padding: 0;
    margin: 20px 0 26px;
  }
  .check-list li {
    margin: 12px 0;
    color: var(--color-muted);
    font-size: 13px;
    opacity: 0;
    transform: translateX(-10px);
    transition:
            opacity 0.5s var(--ease),
            transform 0.5s var(--ease);
  }
  .why:global(.in) .check-list li {
    opacity: 1;
    transform: none;
    transition-delay: calc(350ms + var(--i) * 100ms);
  }
  .check-list li::before {
    content: '✓';
    color: var(--color-primary-2);
    font-weight: 800;
    margin-right: 9px;
  }
  .why .btn {
    margin-top: auto;
    align-self: flex-start;
    transition:
            transform 0.25s var(--ease),
            box-shadow 0.25s var(--ease);
  }
  .why .btn:hover {
    transform: translateY(-3px);
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
    .bento {
      grid-template-columns: repeat(2, 1fr);
    }
    .service,
    .service.wide {
      grid-column: span 1;
      min-height: 0;
    }
    .service.full {
      grid-column: 1 / -1;
    }
    .feature {
      grid-template-columns: 1fr;
    }
    .panel {
      min-height: 380px;
      padding: 36px;
    }
  }
  @media (max-width: 700px) {
    .chain {
      grid-template-columns: repeat(2, 1fr);
      row-gap: 28px;
    }
    .chain::before {
      display: none;
    }
  }
  @media (max-width: 600px) {
    .bento {
      grid-template-columns: 1fr;
    }
    .service.full {
      grid-template-columns: 1fr;
      gap: 16px;
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
    .chain::before,
    .node,
    .panel::after,
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
    .chain::before {
      transform: scaleX(1);
    }
    .panel-img {
      transform: scale(1.04);
      transition: none;
    }
    .criteria li,
    .check-list li {
      opacity: 1;
      transform: none;
      transition: none;
    }
    .service,
    .service .icon,
    .arrow {
      transition: none;
    }
  }
</style>
