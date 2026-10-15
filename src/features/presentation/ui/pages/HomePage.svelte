<script lang="ts">
  import { onMount } from 'svelte';
  import { supabase } from '$infrastructure/data/supabase-client';
  import { loadSiteContent, type SitePageContent } from '$infrastructure/data/site-content';

  let company = $state({ name: 'SOLUX', tagline: 'Energía limpia para un mejor mañana.', about: 'Diseñamos e instalamos soluciones solares y eléctricas para hogares, negocios e industrias. Ingeniería cercana, tecnología y resultados medibles.', years_of_experience: 5, completed_projects: 120 });

  let pageContent = $state<SitePageContent>({});
  onMount(async () => {
    const [{ data }, savedContent] = await Promise.all([
      supabase.from('company_profile').select('name,tagline,about,years_of_experience,completed_projects').limit(1).maybeSingle(),
      loadSiteContent('inicio', { eyebrow: 'Lo que hacemos', title: company.tagline, description: company.about, secondary_title: 'Más que energía, construimos confianza.', secondary_description: 'Cuéntanos qué necesitas y diseñamos el siguiente paso.', image_1: 'https://images.unsplash.com/photo-1508514177221-188b1cf16e9d?auto=format&fit=crop&w=1100&q=85' })
    ]);
    if (data) company = { ...company, ...data };
    pageContent = savedContent;
  });

  const services = [
    { icon: '☀', title: 'Paneles solares', text: 'Generación fotovoltaica a medida para hogares y negocios.' },
    { icon: '◈', title: 'Inversores', text: 'Conversión eficiente y gestión inteligente de la energía.' },
    { icon: '▣', title: 'Baterías', text: 'Almacenamiento para mayor autonomía y respaldo.' },
    { icon: '⌁', title: 'Instalaciones eléctricas', text: 'Diseño e instalación residencial, comercial e industrial.' },
    { icon: '✓', title: 'Mantenimiento', text: 'Revisión, diagnóstico y soporte técnico especializado.' },
    { icon: '✦', title: 'Asesoría', text: 'Evaluación y presupuesto según tus necesidades reales.' }
  ];

  onMount(() => {
    requestAnimationFrame(() => {
      document.querySelectorAll('.reveal').forEach((el, i) => {
        setTimeout(() => el.classList.add('visible'), i * 55);
      });
    });
  });
</script>

<section class="page">
  <div class="hero">
    <div>
      <div class="eyebrow">{company.name} · Guantánamo, Cuba</div>
      <h1>{pageContent.title || company.tagline}</h1>
      <p class="lead">
        {pageContent.description || company.about}
      </p>
      <div class="hero-actions">
        <a class="btn btn-accent" href="/reservas">Solicitar una instalación →</a>
        <a class="btn btn-ghost" href="/servicios">Ver nuestros servicios</a>
      </div>
      <div class="stats">
        <div class="stat"><strong>{company.completed_projects}+</strong><span>proyectos realizados</span></div>
        <div class="stat"><strong>{company.years_of_experience}+</strong><span>años de experiencia</span></div>
        <div class="stat"><strong>24/7</strong><span>energía pensada para ti</span></div>
      </div>
    </div>
    <div class="hero-visual" style={`background: linear-gradient(145deg, rgba(0, 30, 15, 0.25), rgba(0, 0, 0, 0.55)), url("${pageContent.image_1}") center / cover;`}>
      <div class="sun"></div>
      <div class="hero-badge">
        <strong>Tu independencia energética</strong><br />
        <small>Empieza con una evaluación técnica.</small>
      </div>
    </div>
  </div>

  <div class="section-head reveal">
    <div>
      <div class="eyebrow">Lo que hacemos</div>
      <h2>Soluciones completas.</h2>
    </div>
    <p>Desde el diseño hasta la instalación y el mantenimiento, acompañamos cada proyecto con criterio de ingeniería.</p>
  </div>

  <div class="grid grid-3">
    {#each services as s}
      <article class="card reveal">
        <div class="icon">{s.icon}</div>
        <h3>{s.title}</h3>
        <p>{s.text}</p>
        <a class="card-link" href="/reservas">Solicitar →</a>
      </article>
    {/each}
  </div>

  <div class="banner reveal">
    <div>
      <strong>{pageContent.secondary_title || 'Más que energía, construimos confianza.'}</strong>
      <p>{pageContent.secondary_description || 'Cuéntanos qué necesitas y diseñamos el siguiente paso.'}</p>
    </div>
    <a class="btn btn-accent" href="/reservas">Reservar visita técnica</a>
  </div>
</section>

<style>
  .hero {
    min-height: 650px;
    display: grid;
    grid-template-columns: 1.08fr 0.92fr;
    gap: 34px;
    align-items: center;
  }
  .hero-actions {
    display: flex;
    gap: 12px;
    flex-wrap: wrap;
    margin-top: 28px;
  }
  .hero-visual {
    min-height: 500px;
    border-radius: var(--radius-2xl);
    overflow: hidden;
    position: relative;
    background:
      linear-gradient(145deg, rgba(0, 30, 15, 0.25), rgba(0, 0, 0, 0.55)),
      url('https://images.unsplash.com/photo-1508514177221-188b1cf16e9d?auto=format&fit=crop&w=1100&q=85')
        center / cover;
    box-shadow: var(--color-shadow);
  }
  .hero-visual::after {
    content: '';
    position: absolute;
    inset: auto 0 0;
    height: 48%;
    background: linear-gradient(transparent, rgba(0, 0, 0, 0.65));
  }
  .sun {
    position: absolute;
    width: 110px;
    height: 110px;
    border-radius: 50%;
    background: var(--color-accent);
    right: 12%;
    top: 12%;
    box-shadow: 0 0 90px rgba(255, 191, 25, 0.45);
  }
  .hero-badge {
    position: absolute;
    left: 24px;
    bottom: 24px;
    z-index: 2;
    padding: 16px 18px;
    border-radius: 17px;
    color: white;
    background: rgba(8, 120, 62, 0.78);
    backdrop-filter: blur(12px);
  }
  .stats {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 10px;
    margin-top: 38px;
  }
  .stat {
    padding: 16px;
    border-top: 1px solid var(--color-border);
  }
  .stat strong {
    display: block;
    font-size: 23px;
  }
  .stat span {
    color: var(--color-muted);
    font-size: 12px;
  }
  .card-link {
    color: var(--color-primary);
    font-size: 12px;
    font-weight: 800;
    display: inline-block;
    margin-top: 20px;
  }
  .banner {
    margin-top: 45px;
    border-radius: 26px;
    padding: 30px;
    background: linear-gradient(115deg, var(--color-primary), #07572f);
    color: white;
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 20px;
  }
  .banner p {
    margin: 6px 0 0;
    opacity: 0.8;
  }
  @media (max-width: 900px) {
    .hero {
      grid-template-columns: 1fr;
      min-height: auto;
      padding-top: 45px;
    }
    .hero-visual {
      min-height: 420px;
    }
  }
  @media (max-width: 600px) {
    .hero-visual {
      min-height: 350px;
    }
    .stats {
      grid-template-columns: 1fr;
    }
    .banner {
      display: block;
    }
    .banner .btn {
      margin-top: 18px;
    }
  }
</style>
