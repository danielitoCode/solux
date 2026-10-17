<script lang="ts">
  import { onMount } from 'svelte';
  import { Tween } from 'svelte/motion';
  import { fade, fly } from 'svelte/transition';
  import { cubicOut } from 'svelte/easing';
  import { getPresentationUseCases } from '$features/presentation/di';
  import type { PageContent } from '$features/presentation/domain/entities/page-content';

  const presentation = getPresentationUseCases();

  /* ─────────── Tipos y valores por defecto ─────────── */
  type Company = {
    name: string;
    tagline: string;
    about: string;
    years_of_experience: number;
    completed_projects: number;
  };

  const FALLBACK_COMPANY: Company = {
    name: 'SOLUX',
    tagline: 'Energía limpia para un mejor mañana.',
    about:
            'Diseñamos e instalamos soluciones solares y eléctricas para hogares, negocios e industrias. Ingeniería cercana, tecnología y resultados medibles.',
    years_of_experience: 5,
    completed_projects: 120
  };

  const DEFAULT_IMAGE =
          'https://images.unsplash.com/photo-1508514177221-188b1cf16e9d?auto=format&fit=crop&w=1100&q=85';

  /* ─────────── Preferencias de movimiento ─────────── */
  const reduced =
          typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches;
  const finePointer = typeof matchMedia !== 'undefined' && matchMedia('(pointer: fine)').matches;
  const ms = (value: number) => (reduced ? 0 : value);

  /* ─────────── Estado ─────────── */
  let company = $state<Company>({ ...FALLBACK_COMPANY });
  let pageContent = $state<Partial<PageContent>>({});
  let ready = $state(false);

  const eyebrow = $derived(pageContent.eyebrow || company.name);
  const headline = $derived(pageContent.title || company.tagline);
  const words = $derived(headline.split(/\s+/).filter(Boolean));
  const lead = $derived(pageContent.description || company.about);
  const heroImage = $derived(pageContent.image_1 || DEFAULT_IMAGE);
  const bannerTitle = $derived(
          pageContent.secondary_title || 'Más que energía, construimos confianza.'
  );
  const bannerText = $derived(
          pageContent.secondary_description || 'Cuéntanos qué necesitas y diseñamos el siguiente paso.'
  );

  const projects = new Tween(0, { duration: ms(1400), easing: cubicOut });
  const years = new Tween(0, { duration: ms(1100), easing: cubicOut });

  const stats = $derived([
    { value: `${Math.round(projects.current)}+`, label: 'proyectos realizados' },
    { value: `${Math.round(years.current)}+`, label: 'años de experiencia' },
    { value: '24/7', label: 'energía pensada para ti' }
  ]);

  $effect(() => {
    if (!ready) return;
    projects.target = company.completed_projects;
    years.target = company.years_of_experience;
  });

  /* ─────────── Carga de datos ─────────── */
  onMount(async () => {
    try {
      const [profile, savedContent] = await Promise.all([
        presentation.getCompanyProfile.execute(),
        presentation.getPageContent.execute('inicio')
      ]);
      if (profile) {
        company = {
          name: profile.name,
          tagline: profile.tagline,
          about: profile.about,
          years_of_experience: profile.yearsOfExperience,
          completed_projects: profile.completedProjects
        };
      }
      pageContent = {
        eyebrow: savedContent.eyebrow,
        title: savedContent.title,
        description: savedContent.description,
        secondary_title: savedContent.secondaryTitle,
        secondary_description: savedContent.secondaryDescription,
        image_1: savedContent.image1
      };
    } catch (err) {
      console.error('No se pudo cargar el contenido de inicio', err);
    } finally {
      ready = true;
    }
  });

  /* ─────────── Contenido estático ─────────── */
  const services = [
    { icon: '☀', title: 'Kits solares', text: 'Sistemas completos listos para instalar en tu hogar o negocio.', cta: 'Cotizar kit' },
    { icon: '◈', title: 'Paneles e inversores', text: 'Generación fotovoltaica a medida y conversión eficiente de la energía.', cta: 'Pedir presupuesto' },
    { icon: '▣', title: 'Baterías', text: 'Almacenamiento para mayor autonomía y respaldo.', cta: 'Pedir presupuesto' },
    { icon: '⌁', title: 'Instalaciones eléctricas', text: 'Diseño e instalación residencial, comercial e industrial.', cta: 'Solicitar instalación' },
    { icon: '✓', title: 'Mantenimiento', text: 'Revisión, diagnóstico y soporte técnico especializado.', cta: 'Agendar revisión' },
    { icon: '✦', title: 'Asesoría', text: 'Evaluación y presupuesto según tus necesidades reales.', cta: 'Reservar visita' }
  ];

  const steps = [
    { title: 'Evaluación técnica', text: 'Visitamos el sitio y medimos tu consumo real.' },
    { title: 'Diseño y presupuesto', text: 'Dimensionamos el sistema y te damos un costo claro.' },
    { title: 'Instalación', text: 'Montaje y conexión a cargo de nuestro equipo técnico.' },
    { title: 'Mantenimiento', text: 'Seguimiento y soporte para que rinda a lo largo del tiempo.' }
  ];

  const flow = ['Sol', 'Paneles', 'Inversor', 'Hogar'];

  const marquee = [
    'Paneles solares',
    'Inversores',
    'Baterías',
    'Kits solares',
    'Instalaciones eléctricas',
    'Mantenimiento',
    'Asesoría'
  ];

  /* Chispas de luz de la atmósfera (valores deterministas, sin Math.random) */
  const sparks = Array.from({ length: 14 }, (_, i) => ({
    x: (i * 37 + 11) % 100,
    size: 2 + (i % 3),
    dur: 14 + ((i * 7) % 10),
    delay: -((i * 23) % 20)
  }));

  /* ─────────── Actions ─────────── */

  /** Revela el elemento al entrar en pantalla. */
  function reveal(node: HTMLElement, delay = 0) {
    if (reduced || typeof IntersectionObserver === 'undefined') {
      node.classList.add('in');
      return;
    }
    node.style.setProperty('--delay', `${delay}ms`);
    const io = new IntersectionObserver(
            ([entry]) => {
              if (!entry.isIntersecting) return;
              node.classList.add('in');
              io.disconnect();
            },
            { threshold: 0.15, rootMargin: '0px 0px -8% 0px' }
    );
    io.observe(node);
    return { destroy: () => io.disconnect() };
  }

  /** Inclinación 3D + parallax por capas según el puntero (--mx, --my en -0.5…0.5). */
  function tilt(node: HTMLElement) {
    if (reduced || !finePointer) return;
    let raf = 0;
    const set = (x: number, y: number) => {
      node.style.setProperty('--rx', `${(-y * 7).toFixed(2)}deg`);
      node.style.setProperty('--ry', `${(x * 9).toFixed(2)}deg`);
      node.style.setProperty('--mx', x.toFixed(3));
      node.style.setProperty('--my', y.toFixed(3));
    };
    const move = (e: PointerEvent) => {
      const r = node.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width - 0.5;
      const y = (e.clientY - r.top) / r.height - 0.5;
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => set(x, y));
    };
    const leave = () => {
      cancelAnimationFrame(raf);
      set(0, 0);
    };
    node.addEventListener('pointermove', move);
    node.addEventListener('pointerleave', leave);
    return {
      destroy() {
        cancelAnimationFrame(raf);
        node.removeEventListener('pointermove', move);
        node.removeEventListener('pointerleave', leave);
      }
    };
  }

  /** Profundidad de scroll: expone --py (px, parallax de la imagen) y --scroll (0…1, atenúa la atmósfera). */
  function scrollDepth(node: HTMLElement) {
    if (reduced) return;
    let raf = 0;
    const update = () => {
      raf = 0;
      const y = Math.min(window.scrollY, 700);
      node.style.setProperty('--py', (y * 0.1).toFixed(1));
      node.style.setProperty('--scroll', (y / 700).toFixed(3));
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return {
      destroy() {
        cancelAnimationFrame(raf);
        window.removeEventListener('scroll', onScroll);
      }
    };
  }

  /** Foco de luz que sigue al cursor dentro de la tarjeta (--sx, --sy). */
  function spotlight(node: HTMLElement) {
    if (reduced || !finePointer) return;
    const move = (e: PointerEvent) => {
      const r = node.getBoundingClientRect();
      node.style.setProperty('--sx', `${e.clientX - r.left}px`);
      node.style.setProperty('--sy', `${e.clientY - r.top}px`);
    };
    node.addEventListener('pointermove', move);
    return { destroy: () => node.removeEventListener('pointermove', move) };
  }
</script>

<section class="page" use:scrollDepth>
  <!-- ───────── Atmósfera inmersiva (fija, a ancho completo del viewport) ───────── -->
  <div class="ambient" aria-hidden="true">
    <div class="glow glow-green"></div>
    <div class="glow glow-sun"></div>
    <div class="glow glow-deep"></div>
    <div class="grid-lines"></div>
    <div class="beam"></div>
    {#each sparks as spark, i (i)}
      <i
              class="spark"
              style="--x: {spark.x}%; --s: {spark.size}px; --d: {spark.dur}s; --delay: {spark.delay}s"
      ></i>
    {/each}
  </div>

  <!-- ───────── Hero ───────── -->
  <div class="hero">
    <div class="hero-copy">
      <div class="eyebrow rise" style="--i: 0">{eyebrow} · Guantánamo, Cuba</div>

      {#key headline}
        <h1 class="headline" aria-label={headline}>
          {#each words as word, i}
            <span class="word" aria-hidden="true"
            ><span class="word-in" style="--w: {i}">{word}</span></span
            >{' '}
          {/each}
        </h1>
      {/key}

      {#key lead}
        <p class="lead rise" style="--i: 5" in:fade={{ duration: ms(300) }}>{lead}</p>
      {/key}

      <div class="hero-actions rise" style="--i: 6">
        <a class="btn btn-accent" href="/reservas">
          Solicitar presupuesto <span class="arrow" aria-hidden="true">→</span>
        </a>
        <a class="btn btn-ghost" href="/servicios">Ver nuestros servicios</a>
      </div>

      <div class="stats rise" style="--i: 7">
        {#each stats as stat, i (stat.label)}
          {#if ready}
            <div
                    class="stat"
                    in:fly={{ y: 16, duration: ms(550), delay: ms(i * 110), easing: cubicOut }}
            >
              <strong>{stat.value}</strong>
              <span>{stat.label}</span>
            </div>
          {:else}
            <div class="stat stat-skeleton" aria-hidden="true">
              <strong>&nbsp;</strong>
              <span>&nbsp;</span>
            </div>
          {/if}
        {/each}
      </div>
    </div>

    <div class="hero-stage" use:tilt>
      <div class="hero-frame">
        <div class="hero-visual">
          <img class="hero-img" src={heroImage} alt="" fetchpriority="high" decoding="async" />
          <div class="sun" aria-hidden="true"></div>

          <div class="chip chip-a" aria-hidden="true">
            <span class="dot"></span>Paneles solares
          </div>
          <div class="chip chip-b" aria-hidden="true">Respaldo con baterías</div>

          <div class="hero-badge">
            <strong>Tu independencia energética</strong>
            <small>Empieza con una evaluación técnica.</small>

            <svg
                    class="flow"
                    viewBox="0 0 320 64"
                    role="img"
                    aria-label="Flujo de energía: del sol a los paneles, el inversor y tu hogar"
            >
              <path class="flow-line" d="M20 24 H300" pathLength="280" />
              <path class="flow-pulse" d="M20 24 H300" pathLength="280" />
              <path class="flow-pulse flow-pulse-2" d="M20 24 H300" pathLength="280" />
              {#each flow as label, i}
                {@const x = 20 + i * (280 / (flow.length - 1))}
                <circle class="flow-node" cx={x} cy="24" r="6" style="--i: {i}" />
                <text class="flow-label" {x} y="52" text-anchor="middle">{label}</text>
              {/each}
            </svg>
          </div>
        </div>
      </div>
    </div>
  </div>

  <!-- ───────── Cinta de servicios ───────── -->
  <div class="marquee" aria-hidden="true">
    <div class="marquee-track">
      {#each [0, 1] as copy (copy)}
        {#each marquee as item (item)}
          <span class="marquee-item">{item}</span>
          <span class="marquee-sep">✦</span>
        {/each}
      {/each}
    </div>
  </div>

  <!-- ───────── Servicios ───────── -->
  <div class="section-head rv" use:reveal>
    <div>
      <div class="eyebrow">Lo que hacemos</div>
      <h2>Soluciones completas.</h2>
    </div>
    <p>
      Desde el diseño hasta la instalación y el mantenimiento, acompañamos cada proyecto con criterio
      de ingeniería.
    </p>
  </div>

  <div class="grid grid-3">
    {#each services as s, i (s.title)}
      <article class="card service rv" use:reveal={i * 80} use:spotlight>
        <div class="icon" aria-hidden="true">{s.icon}</div>
        <h3>{s.title}</h3>
        <p>{s.text}</p>
        <a class="card-link" href="/reservas">
          {s.cta} <span class="arrow" aria-hidden="true">→</span>
        </a>
      </article>
    {/each}
  </div>

  <!-- ───────── Proceso ───────── -->
  <div class="section-head rv" use:reveal>
    <div>
      <h2>Así trabajamos.</h2>
    </div>
    <p>Un proceso claro, de la primera visita al soporte posterior a la instalación.</p>
  </div>

  <ol class="steps">
    {#each steps as step, i (step.title)}
      <li class="step rv" use:reveal={i * 110}>
        <span class="step-n" aria-hidden="true">{i + 1}</span>
        <h3>{step.title}</h3>
        <p>{step.text}</p>
      </li>
    {/each}
  </ol>

  <!-- ───────── CTA final ───────── -->
  <div class="banner rv" use:reveal>
    <div>
      {#key bannerTitle}
        <strong in:fade={{ duration: ms(300) }}>{bannerTitle}</strong>
      {/key}
      {#key bannerText}
        <p in:fade={{ duration: ms(300) }}>{bannerText}</p>
      {/key}
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

  /* ───────── Atmósfera: una sola capa fija, coherente con todo el fondo ───────── */
  .ambient {
    position: fixed;
    inset: 0;
    z-index: -1;
    overflow: hidden;
    pointer-events: none;
    opacity: calc(1 - var(--scroll, 0) * 0.6);
  }
  .glow {
    position: absolute;
    border-radius: 50%;
    will-change: transform;
  }
  .glow-green {
    width: 62vw;
    height: 62vw;
    left: -20vw;
    top: 6vh;
    background: radial-gradient(circle, var(--color-primary), transparent 65%);
    opacity: 0.28;
    animation: ambient-drift 18s ease-in-out infinite alternate;
  }
  .glow-sun {
    width: 46vw;
    height: 46vw;
    max-width: 760px;
    max-height: 760px;
    right: -6vw;
    top: -8vw;
    background: radial-gradient(circle, var(--color-accent), transparent 65%);
    opacity: 0.16;
    animation: ambient-drift 14s ease-in-out infinite alternate-reverse;
  }
  .glow-deep {
    width: 50vw;
    height: 50vw;
    left: 34vw;
    bottom: -26vw;
    background: radial-gradient(circle, var(--color-primary), transparent 65%);
    opacity: 0.2;
    animation: ambient-drift 22s ease-in-out infinite alternate;
  }
  @keyframes ambient-drift {
    to {
      transform: translate(5vw, 4vh) scale(1.12);
    }
  }
  /* Malla técnica que se desvanece hacia los bordes */
  .grid-lines {
    position: absolute;
    inset: 0;
    background-image:
            linear-gradient(var(--color-border) 1px, transparent 1px),
            linear-gradient(90deg, var(--color-border) 1px, transparent 1px);
    background-size: 64px 64px;
    opacity: 0.35;
    -webkit-mask-image: radial-gradient(ellipse 70% 60% at 68% 30%, #000, transparent 75%);
    mask-image: radial-gradient(ellipse 70% 60% at 68% 30%, #000, transparent 75%);
  }
  /* Haz de luz solar que barre lentamente */
  .beam {
    position: absolute;
    top: -20%;
    right: 12%;
    width: 24vw;
    height: 140%;
    background: linear-gradient(180deg, rgba(255, 191, 25, 0.22), transparent 70%);
    transform-origin: top center;
    transform: rotate(16deg);
    filter: blur(28px);
    opacity: 0.55;
    mix-blend-mode: screen;
    animation: beam 10s ease-in-out infinite alternate;
  }
  @keyframes beam {
    to {
      transform: rotate(26deg);
      opacity: 0.85;
    }
  }
  /* Chispas de energía que ascienden despacio */
  .spark {
    position: absolute;
    bottom: -12px;
    left: var(--x);
    width: var(--s);
    height: var(--s);
    border-radius: 50%;
    background: var(--color-accent);
    box-shadow: 0 0 10px rgba(255, 191, 25, 0.8);
    opacity: 0;
    animation: spark-up var(--d) linear var(--delay) infinite;
  }
  @keyframes spark-up {
    0% {
      transform: translate(0, 0);
      opacity: 0;
    }
    10% {
      opacity: 0.7;
    }
    90% {
      opacity: 0.45;
    }
    100% {
      transform: translate(30px, -108vh);
      opacity: 0;
    }
  }

  /* ───────── Entrada orquestada del hero ───────── */
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

  /* Titular: cada palabra sube desde una máscara */
  .headline {
    /* conserva el tamaño y la fuente globales de h1 */
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

  /* ───────── Hero ───────── */
  .hero {
    position: relative;
    min-height: 650px;
    display: grid;
    grid-template-columns: 1.08fr 0.92fr;
    gap: 34px;
    align-items: center;
  }
  .hero-copy .eyebrow {
    display: inline-block;
    margin-bottom: 22px;
  }

  .hero-actions {
    display: flex;
    gap: 12px;
    flex-wrap: wrap;
    margin-top: 28px;
  }

  /* Botones: elevación, brillo y pulso en el CTA principal */
  .hero-actions :global(.btn),
  .banner :global(.btn) {
    transition:
            transform 0.25s var(--ease),
            box-shadow 0.25s var(--ease);
  }
  .hero-actions :global(.btn):hover,
  .banner :global(.btn):hover {
    transform: translateY(-3px);
  }
  .hero-actions :global(.btn):active,
  .banner :global(.btn):active {
    transform: translateY(0) scale(0.97);
  }
  .hero-actions :global(.btn-accent) {
    position: relative;
    overflow: hidden;
    animation: ring 2.8s ease-out 1.8s infinite;
  }
  .hero-actions :global(.btn-accent):hover {
    animation: none;
  }
  .hero-actions :global(.btn-accent)::after {
    content: '';
    position: absolute;
    inset: 0;
    background: linear-gradient(105deg, transparent 35%, rgba(255, 255, 255, 0.45) 50%, transparent 65%);
    transform: translateX(-120%);
    animation: shine 4.5s ease-in-out 2s infinite;
    pointer-events: none;
  }
  @keyframes ring {
    0% {
      box-shadow: 0 0 0 0 rgba(255, 191, 25, 0.35);
    }
    70%,
    100% {
      box-shadow: 0 0 0 12px rgba(255, 191, 25, 0);
    }
  }
  @keyframes shine {
    0% {
      transform: translateX(-120%);
    }
    35%,
    100% {
      transform: translateX(120%);
    }
  }
  .arrow {
    display: inline-block;
    transition: transform 0.25s var(--ease);
  }
  a:hover > .arrow,
  a:focus-visible > .arrow {
    transform: translateX(5px);
  }

  /* ───────── Escenario visual (inclinación 3D + capas) ───────── */
  .hero-stage {
    perspective: 1200px;
    animation: stage-in 1.1s var(--ease) 0.2s both;
  }
  @keyframes stage-in {
    from {
      opacity: 0;
      transform: translateY(30px) scale(0.95);
    }
  }
  /* Marco con borde de luz que recorre el contorno */
  .hero-frame {
    position: relative;
    padding: 1.5px;
    border-radius: var(--radius-2xl);
    overflow: hidden;
    background: var(--color-border);
    box-shadow: var(--color-shadow);
    transform: rotateX(var(--rx, 0deg)) rotateY(var(--ry, 0deg));
    transition: transform 0.35s ease-out;
    will-change: transform;
  }
  .hero-frame::before {
    content: '';
    position: absolute;
    inset: -60%;
    background: conic-gradient(
            from 0deg,
            transparent 0 55%,
            var(--color-accent) 72%,
            transparent 82%,
            var(--color-primary) 92%,
            transparent
    );
    animation: spin 9s linear infinite;
  }
  .hero-visual {
    min-height: 500px;
    border-radius: calc(var(--radius-2xl) - 1.5px);
    overflow: hidden;
    position: relative;
  }
  .hero-img {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    object-fit: cover;
    transform: scale(1.1);
    translate: calc(var(--mx, 0) * -14px) calc(var(--my, 0) * -14px + var(--py, 0) * 1px);
    transition: translate 0.35s ease-out;
    animation: kenburns 22s ease-out both;
  }
  @keyframes kenburns {
    from {
      transform: scale(1.3);
    }
    to {
      transform: scale(1.1);
    }
  }
  .hero-visual::before {
    content: '';
    position: absolute;
    inset: 0;
    background: linear-gradient(145deg, rgba(0, 30, 15, 0.25), rgba(0, 0, 0, 0.55));
  }
  .hero-visual::after {
    content: '';
    position: absolute;
    inset: auto 0 0;
    height: 48%;
    background: linear-gradient(transparent, rgba(0, 0, 0, 0.65));
  }

  /* Sol con rayos giratorios */
  .sun {
    position: absolute;
    width: 110px;
    height: 110px;
    border-radius: 50%;
    background: var(--color-accent);
    right: 12%;
    top: 12%;
    box-shadow: 0 0 90px rgba(255, 191, 25, 0.45);
    translate: calc(var(--mx, 0) * 26px) calc(var(--my, 0) * 26px);
    transition: translate 0.35s ease-out;
    animation: sun-glow 5s ease-in-out infinite;
  }
  .sun::before {
    content: '';
    position: absolute;
    inset: -80px;
    border-radius: 50%;
    background: repeating-conic-gradient(rgba(255, 191, 25, 0.32) 0 3deg, transparent 3deg 12deg);
    -webkit-mask-image: radial-gradient(circle, transparent 36%, #000 40%, transparent 70%);
    mask-image: radial-gradient(circle, transparent 36%, #000 40%, transparent 70%);
    animation: spin 40s linear infinite;
  }
  @keyframes sun-glow {
    50% {
      transform: scale(1.08);
      box-shadow: 0 0 120px rgba(255, 191, 25, 0.6);
    }
  }
  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }

  /* Chips flotantes */
  .chip {
    position: absolute;
    z-index: 2;
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 8px 14px;
    border-radius: 999px;
    color: white;
    font-size: 12px;
    font-weight: 700;
    background: rgba(255, 255, 255, 0.14);
    border: 1px solid rgba(255, 255, 255, 0.28);
    backdrop-filter: blur(10px);
    translate: calc(var(--mx, 0) * 34px) calc(var(--my, 0) * 34px);
    transition: translate 0.35s ease-out;
    animation: float 6s ease-in-out infinite alternate;
  }
  .chip-a {
    left: 22px;
    top: 16%;
  }
  .chip-b {
    right: 22px;
    top: 52%;
    animation-duration: 7.5s;
    animation-delay: -2s;
  }
  .dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: var(--color-accent);
    animation: ping 1.8s ease-out infinite;
  }
  @keyframes float {
    from {
      transform: translateY(-6px);
    }
    to {
      transform: translateY(8px);
    }
  }
  @keyframes ping {
    0% {
      box-shadow: 0 0 0 0 rgba(255, 191, 25, 0.7);
    }
    100% {
      box-shadow: 0 0 0 9px rgba(255, 191, 25, 0);
    }
  }

  .hero-badge {
    position: absolute;
    left: 24px;
    right: 24px;
    bottom: 24px;
    z-index: 2;
    display: grid;
    gap: 4px;
    padding: 16px 18px 12px;
    border-radius: 17px;
    color: white;
    background: rgba(8, 120, 62, 0.78);
    backdrop-filter: blur(12px);
    translate: calc(var(--mx, 0) * 12px) calc(var(--my, 0) * 12px);
    transition: translate 0.35s ease-out;
  }

  /* Flujo de energía (SVG animado) */
  .flow {
    width: 100%;
    height: auto;
    margin-top: 10px;
    overflow: visible;
  }
  .flow-line,
  .flow-pulse {
    fill: none;
    stroke-linecap: round;
  }
  .flow-line {
    stroke: rgba(255, 255, 255, 0.35);
    stroke-width: 2;
  }
  .flow-pulse {
    stroke: var(--color-accent);
    stroke-width: 3.5;
    stroke-dasharray: 18 262;
    filter: drop-shadow(0 0 5px rgba(255, 191, 25, 0.9));
    animation: flow 2.8s linear infinite;
  }
  .flow-pulse-2 {
    animation-delay: -1.4s;
  }
  .flow-node {
    fill: white;
    stroke: var(--color-accent);
    stroke-width: 2;
    transform-box: fill-box;
    transform-origin: center;
    animation: node 2.8s ease-in-out infinite;
    animation-delay: calc(var(--i) * 0.93s);
  }
  .flow-label {
    fill: white;
    font-size: 11px;
    font-family: inherit;
    opacity: 0.9;
  }
  @keyframes flow {
    from {
      stroke-dashoffset: 0;
    }
    to {
      stroke-dashoffset: -280;
    }
  }
  @keyframes node {
    0%,
    100% {
      transform: scale(1);
    }
    12% {
      transform: scale(1.45);
    }
  }

  /* Estadísticas */
  .stats {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    margin-top: 40px;
    border: 1px solid var(--color-border);
    border-radius: 20px;
    background: rgba(255, 255, 255, 0.03);
    backdrop-filter: blur(10px);
  }
  .stat {
    padding: 18px 20px;
  }
  .stat + .stat {
    border-left: 1px solid var(--color-border);
  }
  .stat strong {
    display: block;
    font-size: 23px;
    font-variant-numeric: tabular-nums;
  }
  .stat span {
    color: var(--color-muted);
    font-size: 12px;
  }
  .stat-skeleton strong,
  .stat-skeleton span {
    display: block;
    border-radius: 6px;
    background: var(--color-border);
    animation: skeleton 1.4s ease-in-out infinite;
  }
  .stat-skeleton strong {
    width: 60%;
    margin-bottom: 6px;
  }
  .stat-skeleton span {
    width: 85%;
  }
  @keyframes skeleton {
    50% {
      opacity: 0.45;
    }
  }

  /* ───────── Cinta de servicios ───────── */
  .marquee {
    margin: 10px 0 70px;
    overflow: hidden;
    border-block: 1px solid var(--color-border);
    -webkit-mask-image: linear-gradient(90deg, transparent, #000 10%, #000 90%, transparent);
    mask-image: linear-gradient(90deg, transparent, #000 10%, #000 90%, transparent);
  }
  .marquee-track {
    display: flex;
    align-items: center;
    width: max-content;
    animation: marquee 38s linear infinite;
  }
  .marquee:hover .marquee-track {
    animation-play-state: paused;
  }
  .marquee-item {
    flex: none;
    padding: 18px 0;
    color: var(--color-muted);
    font-size: 14px;
    font-weight: 700;
    white-space: nowrap;
  }
  .marquee-sep {
    flex: none;
    padding: 0 28px;
    color: var(--color-accent);
  }
  @keyframes marquee {
    to {
      transform: translateX(-50%);
    }
  }

  /* ───────── Tarjetas de servicio ───────── */
  .service {
    position: relative;
    display: flex;
    flex-direction: column;
    transition:
            transform 0.35s var(--ease),
            box-shadow 0.35s var(--ease),
            border-color 0.35s var(--ease),
            opacity 0.7s var(--ease),
            filter 0.7s var(--ease);
  }
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
    color: var(--color-primary);
    font-size: 12px;
    font-weight: 800;
    display: inline-block;
    margin-top: auto;
    padding-top: 20px;
  }
  .card-link:focus-visible {
    outline: none;
  }
  .card-link::after {
    content: '';
    position: absolute;
    inset: 0;
    border-radius: inherit;
  }
  .service:hover .arrow {
    transform: translateX(5px);
  }

  /* ───────── Proceso ───────── */
  .steps {
    list-style: none;
    margin: 0;
    padding: 0;
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 24px;
  }
  .step {
    position: relative;
    padding-top: 18px;
    border-top: 1px solid var(--color-border);
  }
  /* Línea de progreso que se dibuja al aparecer */
  .step::before {
    content: '';
    position: absolute;
    top: -1px;
    left: 0;
    width: 100%;
    height: 2px;
    background: var(--color-primary);
    transform: scaleX(0);
    transform-origin: left;
    transition: transform 1s var(--ease);
    transition-delay: calc(var(--delay, 0ms) + 250ms);
  }
  .step:global(.in)::before {
    transform: scaleX(1);
  }
  .step-n {
    display: inline-grid;
    place-items: center;
    width: 30px;
    height: 30px;
    margin-bottom: 14px;
    border-radius: 50%;
    border: 1px solid var(--color-primary);
    color: var(--color-primary);
    font-size: 13px;
    font-weight: 800;
    transition:
            background 0.3s var(--ease),
            color 0.3s var(--ease),
            transform 0.3s var(--ease);
  }
  .step:hover .step-n {
    background: var(--color-primary);
    color: white;
    transform: scale(1.12);
  }
  .step h3 {
    margin: 0 0 6px;
  }
  .step p {
    margin: 0;
    color: var(--color-muted);
    font-size: 14px;
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
    animation: sun-glow 5s ease-in-out infinite;
  }
  .banner p {
    margin: 6px 0 0;
    opacity: 0.8;
  }
  @keyframes banner-shift {
    to {
      background-position: 100% 0;
    }
  }

  /* ───────── Responsive ───────── */
  @media (max-width: 900px) {
    .hero {
      grid-template-columns: 1fr;
      min-height: auto;
      padding-top: 45px;
    }
    .hero-visual {
      min-height: 420px;
    }
    .steps {
      grid-template-columns: repeat(2, 1fr);
    }
  }
  @media (max-width: 600px) {
    .hero-visual {
      min-height: 380px;
    }
    .chip-b {
      display: none;
    }
    .stats {
      grid-template-columns: 1fr;
    }
    .stat + .stat {
      border-left: 0;
      border-top: 1px solid var(--color-border);
    }
    .steps {
      grid-template-columns: 1fr;
    }
    .banner {
      display: block;
    }
    .banner :global(.btn) {
      margin-top: 18px;
    }
  }

  /* ───────── Accesibilidad: reduce el movimiento ───────── */
  @media (prefers-reduced-motion: reduce) {
    .rise,
    .word-in,
    .hero-stage,
    .glow,
    .beam,
    .spark,
    .hero-frame::before,
    .hero-img,
    .sun,
    .sun::before,
    .chip,
    .dot,
    .flow-pulse,
    .flow-node,
    .marquee-track,
    .banner,
    .banner::after,
    .hero-actions :global(.btn-accent),
    .hero-actions :global(.btn-accent)::after,
    .stat-skeleton strong,
    .stat-skeleton span {
      animation: none;
    }
    .rv {
      opacity: 1;
      transform: none;
      filter: none;
      transition: none;
    }
    .hero-frame,
    .hero-img,
    .sun,
    .chip,
    .hero-badge,
    .service,
    .service .icon,
    .arrow,
    .step::before,
    .step-n {
      transition: none;
    }
    .step::before {
      transform: scaleX(1);
    }
  }
</style>