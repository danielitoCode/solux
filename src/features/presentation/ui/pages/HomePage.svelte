<script lang="ts">
  import { onMount } from 'svelte';
  import { Tween } from 'svelte/motion';
  import { fade, fly } from 'svelte/transition';
  import { cubicOut } from 'svelte/easing';
  import { getPresentationUseCases } from '$features/presentation/di';
  import type { PageContent } from '$features/presentation/domain/entities/page-content';
  import ConversionPaths from '$features/presentation/ui/components/ConversionPaths.svelte';

  const presentation = getPresentationUseCases();

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

  const reduced =
    typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches;
  const finePointer = typeof matchMedia !== 'undefined' && matchMedia('(pointer: fine)').matches;
  const ms = (value: number) => (reduced ? 0 : value);

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
    'Paneles solares', 'Inversores', 'Baterías', 'Kits solares',
    'Instalaciones eléctricas', 'Mantenimiento', 'Asesoría'
  ];

  const sparks = Array.from({ length: 14 }, (_, i) => ({
    x: (i * 37 + 11) % 100,
    size: 2 + (i % 3),
    dur: 14 + ((i * 7) % 10),
    delay: -((i * 23) % 20)
  }));

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
  <div class="ambient" aria-hidden="true">
    <div class="glow glow-green"></div>
    <div class="glow glow-sun"></div>
    <div class="glow glow-deep"></div>
    <div class="grid-lines"></div>
    <div class="beam"></div>
    {#each sparks as spark, i (i)}
      <i class="spark" style="--x: {spark.x}%; --s: {spark.size}px; --d: {spark.dur}s; --delay: {spark.delay}s"></i>
    {/each}
  </div>

  <div class="hero">
    <div class="hero-copy">
      <div class="eyebrow rise" style="--i: 0">{eyebrow} · Guantánamo, Cuba</div>
      {#key headline}
        <h1 class="headline" aria-label={headline}>
          {#each words as word, i}
            <span class="word" aria-hidden="true"><span class="word-in" style="--w: {i}">{word}</span></span>{' '}
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
            <div class="stat" in:fly={{ y: 16, duration: ms(550), delay: ms(i * 110), easing: cubicOut }}>
              <strong>{stat.value}</strong>
              <span>{stat.label}</span>
            </div>
          {:else}
            <div class="stat stat-skeleton" aria-hidden="true"><strong>&nbsp;</strong><span>&nbsp;</span></div>
          {/if}
        {/each}
      </div>
    </div>
    <div class="hero-stage" use:tilt>
      <div class="hero-frame">
        <div class="hero-visual">
          <img class="hero-img" src={heroImage} alt="" fetchpriority="high" decoding="async" />
          <div class="sun" aria-hidden="true"></div>
          <div class="chip chip-a" aria-hidden="true"><span class="dot"></span>Paneles solares</div>
          <div class="chip chip-b" aria-hidden="true">Respaldo con baterías</div>
          <div class="hero-badge">
            <strong>Tu independencia energética</strong>
            <small>Empieza con una evaluación técnica.</small>
            <svg class="flow" viewBox="0 0 320 64" role="img" aria-label="Flujo de energía">
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

  <div class="section-head rv" use:reveal>
    <div>
      <div class="eyebrow">Lo que hacemos</div>
      <h2>Soluciones completas.</h2>
    </div>
    <p>Desde el diseño hasta la instalación y el mantenimiento, acompañamos cada proyecto con criterio de ingeniería.</p>
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

  <div class="section-head rv" use:reveal>
    <div><h2>Así trabajamos.</h2></div>
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

  <div class="banner rv" use:reveal>
    <div>
      {#key bannerTitle}<strong in:fade={{ duration: ms(300) }}>{bannerTitle}</strong>{/key}
      {#key bannerText}<p in:fade={{ duration: ms(300) }}>{bannerText}</p>{/key}
    </div>
    <a class="btn btn-accent" href="/reservas?intent=install&source=home">
      Reservar visita técnica <span class="arrow" aria-hidden="true">→</span>
    </a>
  </div>
</section>

<style>
  .page { --ease: cubic-bezier(0.22, 1, 0.36, 1); isolation: isolate; }
  .ambient { position: fixed; inset: 0; z-index: -1; overflow: hidden; pointer-events: none; opacity: calc(1 - var(--scroll, 0) * 0.6); }
  .glow { position: absolute; border-radius: 50%; will-change: transform; }
  .glow-green { width: 62vw; height: 62vw; left: -20vw; top: 6vh; background: radial-gradient(circle, var(--color-primary), transparent 65%); opacity: 0.28; animation: ambient-drift 18s ease-in-out infinite alternate; }
  .glow-sun { width: 46vw; height: 46vw; max-width: 760px; max-height: 760px; right: -6vw; top: -8vw; background: radial-gradient(circle, var(--color-accent), transparent 65%); opacity: 0.16; animation: ambient-drift 14s ease-in-out infinite alternate-reverse; }
  .glow-deep { width: 50vw; height: 50vw; left: 34vw; bottom: -26vw; background: radial-gradient(circle, var(--color-primary), transparent 65%); opacity: 0.2; animation: ambient-drift 22s ease-in-out infinite alternate; }
  @keyframes ambient-drift { to { transform: translate(5vw, 4vh) scale(1.12); } }
  .grid-lines { position: absolute; inset: 0; background-image: linear-gradient(var(--color-border) 1px, transparent 1px), linear-gradient(90deg, var(--color-border) 1px, transparent 1px); background-size: 64px 64px; opacity: 0.35; -webkit-mask-image: radial-gradient(ellipse 70% 60% at 68% 30%, #000, transparent 75%); mask-image: radial-gradient(ellipse 70% 60% at 68% 30%, #000, transparent 75%); }
  .beam { position: absolute; top: -20%; right: 12%; width: 24vw; height: 140%; background: linear-gradient(180deg, rgba(255, 191, 25, 0.22), transparent 70%); transform-origin: top center; transform: rotate(16deg); filter: blur(28px); opacity: 0.55; mix-blend-mode: screen; animation: beam 10s ease-in-out infinite alternate; }
  @keyframes beam { to { transform: rotate(26deg); opacity: 0.85; } }
  .spark { position: absolute; bottom: -12px; left: var(--x); width: var(--s); height: var(--s); border-radius: 50%; background: var(--color-accent); box-shadow: 0 0 10px rgba(255, 191, 25, 0.8); opacity: 0; animation: spark-up var(--d) linear var(--delay) infinite; }
  @keyframes spark-up { 0% { transform: translate(0, 0); opacity: 0; } 10% { opacity: 0.7; } 90% { opacity: 0.45; } 100% { transform: translate(30px, -108vh); opacity: 0; } }
  .rise { animation: rise 0.8s var(--ease) both; animation-delay: calc(var(--i, 0) * 90ms); }
  @keyframes rise { from { opacity: 0; transform: translateY(18px); } }
  .word { display: inline-block; overflow: hidden; vertical-align: top; padding-block: 0.12em; margin-block: -0.12em; }
  .word-in { display: inline-block; animation: word-up 0.7s var(--ease) both; animation-delay: calc(var(--w) * 70ms + 120ms); }
  @keyframes word-up { from { transform: translateY(110%); } }
  .hero { display: grid; grid-template-columns: 1.05fr 0.95fr; gap: 36px; align-items: center; margin-bottom: 28px; }
  .hero-actions { display: flex; flex-wrap: wrap; gap: 12px; margin: 22px 0 20px; }
  .hero-stage { perspective: 1000px; }
  .hero-frame { transform: rotateX(var(--rx, 0deg)) rotateY(var(--ry, 0deg)); transition: transform 0.25s var(--ease); }
  .hero-visual { position: relative; border-radius: 24px; overflow: hidden; aspect-ratio: 4/3; background: var(--color-surface-2); }
  .hero-img { width: 100%; height: 100%; object-fit: cover; transform: translateY(calc(var(--py, 0) * 1px)); }
  .stats { display: flex; gap: 18px; flex-wrap: wrap; }
  .stat strong { display: block; font-size: 22px; }
  .stat span { font-size: 12px; color: var(--color-muted); }
  .marquee { overflow: hidden; margin: 8px 0 36px; mask-image: linear-gradient(90deg, transparent, #000 8%, #000 92%, transparent); }
  .marquee-track { display: flex; gap: 18px; width: max-content; animation: marquee 28s linear infinite; }
  .marquee-item { white-space: nowrap; font-size: 13px; font-weight: 700; color: var(--color-muted); }
  @keyframes marquee { to { transform: translateX(-50%); } }
  .grid-3 { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; margin-bottom: 40px; }
  .service { padding: 20px; }
  .service .icon { font-size: 22px; margin-bottom: 10px; }
  .card-link { font-size: 13px; font-weight: 700; color: var(--color-primary); text-decoration: none; }
  .steps { display: grid; grid-template-columns: repeat(4, 1fr); gap: 14px; list-style: none; padding: 0; margin: 0 0 40px; }
  .step { padding: 18px; border-radius: 16px; background: var(--color-surface); border: 1px solid var(--color-border); }
  .step-n { display: inline-grid; place-items: center; width: 28px; height: 28px; border-radius: 50%; background: var(--color-primary); color: #fff; font-size: 12px; font-weight: 800; margin-bottom: 10px; }
  .banner { display: flex; justify-content: space-between; gap: 20px; align-items: center; padding: 28px; border-radius: 20px; background: color-mix(in srgb, var(--color-primary) 10%, var(--color-surface)); border: 1px solid color-mix(in srgb, var(--color-primary) 25%, var(--color-border)); }
  .rv { opacity: 0; transform: translateY(16px); transition: 0.6s var(--ease); transition-delay: var(--delay, 0ms); }
  .rv.in { opacity: 1; transform: none; }
  @media (max-width: 900px) {
    .hero { grid-template-columns: 1fr; }
    .grid-3, .steps { grid-template-columns: 1fr; }
    .banner { flex-direction: column; align-items: start; }
  }
</style>
