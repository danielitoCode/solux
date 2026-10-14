<script lang="ts">
  const services = [
    { icon: '☀', title: 'Paneles solares', text: 'Generación fotovoltaica a medida para hogares y negocios.' },
    { icon: '◈', title: 'Inversores', text: 'Conversión eficiente y gestión inteligente de la energía.' },
    { icon: '▣', title: 'Baterías', text: 'Almacenamiento para mayor autonomía y respaldo.' },
    { icon: '⌁', title: 'Instalaciones eléctricas', text: 'Diseño e instalación residencial, comercial e industrial.' },
    { icon: '✓', title: 'Mantenimiento', text: 'Revisión, diagnóstico y soporte técnico especializado.' },
    { icon: '✦', title: 'Asesoría', text: 'Evaluación y presupuesto según tus necesidades reales.' }
  ];
</script>

<section class="page">
  <div class="section-head">
    <div>
      <div class="eyebrow">Servicios</div>
      <h2>Todo lo necesario en un solo lugar.</h2>
    </div>
    <p>Soluciones integrales para producir, almacenar, convertir y distribuir energía con seguridad.</p>
  </div>

  <div class="grid grid-3">
    {#each services as s}
      <article class="card">
        <div class="icon">{s.icon}</div>
        <h3>{s.title}</h3>
        <p>{s.text}</p>
        <a class="card-link" href="/reservas">Solicitar →</a>
      </article>
    {/each}
  </div>

  <div class="project-feature" style="margin-top: 45px">
    <div class="about-hero" style="min-height: 390px">
      <div>
        <div class="eyebrow" style="color: var(--color-accent)">Ingeniería SOLUX</div>
        <h2>Diseñado para tu realidad.</h2>
        <p class="lead" style="color: rgba(255, 255, 255, 0.8)">
          No vendemos una solución estándar. Evaluamos consumo, espacio, respaldo y crecimiento antes de recomendar un sistema.
        </p>
      </div>
    </div>
    <div class="card">
      <h3>¿Por qué SOLUX?</h3>
      <ul class="check-list">
        <li>Evaluación técnica personalizada</li>
        <li>Dimensionamiento de sistemas</li>
        <li>Instalación profesional</li>
        <li>Configuración de inversores y baterías</li>
        <li>Soporte y mantenimiento</li>
      </ul>
    </div>
  </div>
</section>

<style>
  .card-link {
    color: var(--color-primary);
    font-size: 12px;
    font-weight: 800;
    display: inline-block;
    margin-top: 20px;
  }
  .project-feature {
    display: grid;
    grid-template-columns: 1.25fr 0.75fr;
    gap: 18px;
  }
  .about-hero {
    border-radius: 30px;
    padding: 55px;
    display: flex;
    align-items: end;
    color: white;
    overflow: hidden;
    position: relative;
    background:
      linear-gradient(110deg, rgba(0, 55, 30, 0.92), rgba(0, 55, 30, 0.25)),
      url('https://images.unsplash.com/photo-1497435334941-8c899ee9e8e9?auto=format&fit=crop&w=1400&q=85')
        center / cover;
  }
  .check-list {
    list-style: none;
    padding: 0;
    margin: 20px 0 0;
  }
  .check-list li {
    margin: 12px 0;
    color: var(--color-muted);
    font-size: 13px;
  }
  .check-list li::before {
    content: '✓';
    color: var(--color-primary-2);
    font-weight: 800;
    margin-right: 9px;
  }
  @media (max-width: 900px) {
    .project-feature {
      grid-template-columns: 1fr;
    }
  }
</style>
