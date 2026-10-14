<section class="page">
  <div class="section-head">
    <div>
      <div class="eyebrow">Proyectos</div>
      <h2>Casos reales, resultados que iluminan.</h2>
    </div>
    <p>Cada proyecto cuenta una historia de eficiencia, confianza y compromiso con el medio ambiente.</p>
  </div>

  <div class="project-feature">
    <article class="project-main">
      <div class="project-caption">
        <div class="eyebrow" style="color: var(--color-accent)">Proyecto destacado</div>
        <h2>Vivienda familiar</h2>
        <p>Guantánamo · Sistema fotovoltaico con respaldo</p>
      </div>
    </article>
    <div class="project-side">
      <div
        class="project-thumb"
        style="background-image: url('https://images.unsplash.com/photo-1509391366360-2e959784a276?auto=format&fit=crop&w=700&q=80')"
      ></div>
      <div
        class="project-thumb"
        style="background-image: url('https://images.unsplash.com/photo-1545208942-e1c9c8c6a6d1?auto=format&fit=crop&w=700&q=80')"
      ></div>
      <div
        class="project-thumb"
        style="background-image: url('https://images.unsplash.com/photo-1508514177221-188b1cf16e9d?auto=format&fit=crop&w=700&q=80')"
      ></div>
    </div>
  </div>

  <div class="grid grid-3" style="margin-top: 20px">
    <div class="card"><h3>120+</h3><p>proyectos completados</p></div>
    <div class="card"><h3>98%</h3><p>satisfacción de clientes</p></div>
    <div class="card"><h3>5+ MW</h3><p>capacidad instalada estimada</p></div>
  </div>
</section>

<style>
  .project-feature {
    display: grid;
    grid-template-columns: 1.25fr 0.75fr;
    gap: 18px;
  }
  .project-main {
    min-height: 520px;
    border-radius: 28px;
    overflow: hidden;
    position: relative;
    background: url('https://images.unsplash.com/photo-1497435334941-8c899ee9e8e9?auto=format&fit=crop&w=1300&q=85')
      center / cover;
  }
  .project-main::after {
    content: '';
    position: absolute;
    inset: 0;
    background: linear-gradient(transparent 45%, rgba(0, 30, 15, 0.85));
  }
  .project-caption {
    position: absolute;
    z-index: 1;
    bottom: 28px;
    left: 28px;
    color: white;
  }
  .project-side {
    display: grid;
    grid-template-rows: repeat(3, 1fr);
    gap: 18px;
  }
  .project-thumb {
    border-radius: 22px;
    overflow: hidden;
    min-height: 155px;
    position: relative;
    background: center / cover;
  }
  .project-thumb::after {
    content: '';
    position: absolute;
    inset: 0;
    background: rgba(0, 0, 0, 0.18);
  }
  @media (max-width: 900px) {
    .project-feature {
      grid-template-columns: 1fr;
    }
  }
</style>
