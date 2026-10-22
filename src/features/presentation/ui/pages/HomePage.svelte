<script lang="ts">
  import { onMount } from 'svelte';
  import { Tween } from 'svelte/motion';
  import { fade, fly } from 'svelte/transition';
  import { cubicOut } from 'svelte/easing';
  import { getPresentationUseCases } from '$features/presentation/di';
  import type { PageContent } from '$features/presentation/domain/entities/page-content';
  import ConversionPaths from '$features/presentation/ui/components/ConversionPaths.svelte';
  import './HomePage.css';

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
  const heroImage = $derived(pageContent.image1 || DEFAULT_IMAGE);
  const bannerTitle = $derived(
          pageContent.secondaryTitle || 'Más que energía, construimos confianza.'
  );
  const bannerText = $derived(
          pageContent.secondaryDescription || 'Cuéntanos qué necesitas y diseñamos el siguiente paso.'
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
        secondaryTitle: savedContent.secondaryTitle,
        secondaryDescription: savedContent.secondaryDescription,
        image1: savedContent.image1
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
        <a class="btn btn-accent" href="/reservas?intent=install&source=home">
          Solicitar instalación <span class="arrow" aria-hidden="true">→</span>
        </a>
        <a class="btn btn-ghost" href="/catalogo?intent=buy&source=home">Ver kits y equipos</a>
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

  <ConversionPaths />

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
        <a class="card-link" href="/reservas?intent=install&source=home">
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
    <a class="btn btn-accent" href="/reservas?intent=install&source=home">
      Reservar visita técnica <span class="arrow" aria-hidden="true">→</span>
    </a>
  </div>
</section>
