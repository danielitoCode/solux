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

<section class="page" use:scrollDepth>
  <Ambient />

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

  <ol class="chain rv" use:reveal aria-label="Recorrido de la energía">
    {#each chain as step, i (step.label)}
      <li class="link" style="--i: {i}">
        <span class="node" aria-hidden="true">{step.icon}</span>
        <strong>{step.label}</strong>
        <small>{step.text}</small>
      </li>
    {/each}
  </ol>

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
.page{--ease:cubic-bezier(0.22,1,0.36,1);isolation:isolate;}.rise{animation:rise 0.8s var(--ease) both;animation-delay:calc(var(--i,0) * 90ms);}@keyframes rise{from{opacity:0;transform:translateY(18px);}}.intro .eyebrow{display:inline-block;margin-bottom:18px;}.headline{margin-block:inherit;}.word{display:inline-block;overflow:hidden;vertical-align:top;padding-block:0.12em;margin-block:-0.12em;}.word-in{display:inline-block;animation:word-up 0.95s var(--ease) both;animation-delay:calc(0.2s + var(--w) * 80ms);}@keyframes word-up{from{transform:translateY(115%) rotate(4deg);}}.rv{opacity:0;transform:translateY(28px) scale(0.98);filter:blur(6px);transition:opacity 0.7s var(--ease),transform 0.7s var(--ease),filter 0.7s var(--ease);transition-delay:var(--delay,0ms);}.rv:global(.in){opacity:1;transform:none;filter:none;}.arrow{display:inline-block;transition:transform 0.25s var(--ease);}a:hover > .arrow,a:focus-visible > .arrow{transform:translateX(5px);}.chain{position:relative;list-style:none;margin:48px 0 56px;padding:0;display:grid;grid-template-columns:repeat(4,1fr);}.chain::before{content:'';position:absolute;top:21px;left:12.5%;right:12.5%;height:2px;border-radius:2px;background:linear-gradient(90deg,transparent,var(--color-accent),transparent) -40% 0 / 30% 100% no-repeat,var(--color-border);transform:scaleX(0);transform-origin:left;transition:transform 1.2s var(--ease) 0.2s;animation:pulse-travel 3.6s linear 1.4s infinite;}.chain:global(.in)::before{transform:scaleX(1);}@keyframes pulse-travel{to{background-position:140% 0,0 0;}}.link{position:relative;display:grid;justify-items:center;gap:4px;text-align:center;}.node{display:grid;place-items:center;width:44px;height:44px;border-radius:50%;background:var(--color-surface);border:2px solid var(--color-border);font-size:18px;transition:border-color 0.3s var(--ease),transform 0.3s var(--ease);}.link:hover .node{border-color:var(--color-accent);transform:scale(1.08);}.stage{font-size:11px;font-weight:600;letter-spacing:0.06em;text-transform:uppercase;color:var(--color-accent);}.bento{display:grid;grid-template-columns:repeat(4,1fr);gap:16px;}.service{position:relative;display:grid;gap:12px;padding:24px;border-radius:22px;border:1px solid var(--color-border);background:var(--color-surface);min-height:180px;transition:transform 0.35s var(--ease),box-shadow 0.35s var(--ease),border-color 0.35s var(--ease);}.service.wide{grid-column:span 2;}.service.full{grid-column:1 / -1;grid-template-columns:auto 1fr auto;align-items:center;gap:24px;min-height:0;}.service:hover{transform:translateY(-4px);box-shadow:var(--color-shadow);border-color:var(--color-primary);}.service .icon{display:grid;place-items:center;width:48px;height:48px;border-radius:14px;background:color-mix(in srgb,var(--color-primary) 12%,transparent);font-size:22px;transition:transform 0.4s var(--ease);}.service:hover .icon{transform:scale(1.12) rotate(-4deg);}.service h3{margin:0;font-size:17px;}.service p{margin:0;font-size:14px;opacity:0.8;line-height:1.45;}.service .cta,.service .card-link{display:inline-flex;align-items:center;gap:6px;margin-top:auto;font-size:13px;font-weight:600;color:var(--color-primary);}.service.full .cta{margin-top:0;}.feature{display:grid;grid-template-columns:1.4fr 1fr;gap:18px;margin-top:48px;}.panel{position:relative;overflow:hidden;min-height:420px;border-radius:26px;padding:40px;display:flex;flex-direction:column;justify-content:flex-end;color:white;}.panel-img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;transform:scale(1.08);transition:transform 1.2s var(--ease);}.panel:global(.in) .panel-img{transform:scale(1.02);}.panel::before{content:'';position:absolute;inset:0;z-index:1;background:linear-gradient(180deg,transparent 30%,rgba(0,30,15,0.85));}.panel-body{position:relative;z-index:2;}.panel h2{margin:8px 0 12px;}.panel .lead{color:rgba(255,255,255,0.85);max-width:420px;}.criteria{list-style:none;margin:20px 0 0;padding:0;display:grid;gap:8px;}.criteria li{opacity:0;transform:translateX(-12px);transition:opacity 0.5s var(--ease),transform 0.5s var(--ease);transition-delay:calc(0.15s + var(--i,0) * 70ms);padding-left:18px;position:relative;font-size:14px;}.criteria li::before{content:'';position:absolute;left:0;top:0.55em;width:8px;height:8px;border-radius:50%;background:var(--color-accent);}.panel:global(.in) .criteria li{opacity:1;transform:none;}.why{padding:28px;display:grid;gap:16px;align-content:start;}.why h3{margin:0;}.check-list{list-style:none;margin:0;padding:0;display:grid;gap:10px;}.check-list li{opacity:0;transform:translateY(10px);transition:opacity 0.45s var(--ease),transform 0.45s var(--ease);transition-delay:calc(0.1s + var(--i,0) * 60ms);padding-left:28px;position:relative;font-size:14px;line-height:1.4;}.check-list li::before{content:'✓';position:absolute;left:0;top:0;width:20px;height:20px;display:grid;place-items:center;border-radius:50%;background:color-mix(in srgb,var(--color-primary) 15%,transparent);color:var(--color-primary);font-size:11px;font-weight:700;}.why:global(.in) .check-list li{opacity:1;transform:none;}.banner{position:relative;overflow:hidden;margin-top:45px;border-radius:26px;padding:30px;background:linear-gradient(115deg,var(--color-primary),#07572f,var(--color-primary));background-size:200% 100%;color:white;display:flex;justify-content:space-between;align-items:center;gap:20px;animation:banner-shift 10s ease-in-out infinite alternate;}.banner > *{position:relative;z-index:1;}.banner::after{content:'';position:absolute;right:-40px;top:-60px;width:220px;height:220px;border-radius:50%;background:var(--color-accent);filter:blur(40px);opacity:0.2;animation:glow 5s ease-in-out infinite;}.banner p{margin:6px 0 0;opacity:0.8;}.banner .btn{transition:transform 0.25s var(--ease);}.banner .btn:hover{transform:translateY(-3px);}@keyframes banner-shift{to{background-position:100% 0;}}@keyframes glow{50%{transform:scale(1.12);opacity:0.36;}}@media (max-width:900px){.bento{grid-template-columns:repeat(2,1fr);}.service,.service.wide{grid-column:span 1;min-height:0;}.service.full{grid-column:1 / -1;}.feature{grid-template-columns:1fr;}.panel{min-height:380px;padding:36px;}}@media (max-width:700px){.chain{grid-template-columns:repeat(2,1fr);row-gap:28px;}.chain::before{display:none;}}@media (max-width:600px){.bento{grid-template-columns:1fr;}.service.full{grid-template-columns:1fr;gap:16px;}.banner{display:block;}.banner .btn{margin-top:18px;}}@media (prefers-reduced-motion:reduce){.rise,.word-in,.chain::before,.node,.panel::after,.banner,.banner::after{animation:none;}.rv{opacity:1;transform:none;filter:none;transition:none;}.chain::before{transform:scaleX(1);}.panel-img{transform:scale(1.04);transition:none;}.criteria li,.check-list li{opacity:1;transform:none;transition:none;}.service,.service .icon,.arrow{transition:none;}}
</style>
