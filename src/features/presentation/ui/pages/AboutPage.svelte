<section class="page">
  <div class="about-hero">
    <div>
      <div class="eyebrow" style="color: var(--color-accent)">Nosotros</div>
      <h2>Ingeniería, experiencia y pasión por la energía.</h2>
      <p class="lead" style="color: rgba(255, 255, 255, 0.8)">
        En SOLUX creemos en el poder de la energía limpia para transformar hogares y negocios. Combinamos criterio
        técnico, instalación profesional y atención cercana.
      </p>
    </div>
  </div>

  <div class="section-head values">
    <div>
      <div class="eyebrow">Nuestros valores</div>
      <h2>Hecho con criterio.</h2>
    </div>
  </div>

  <div class="grid grid-4">
    {#each [['♻', 'Sostenibilidad', 'Cuidamos el planeta'], ['◈', 'Calidad', 'Cuidamos cada detalle'], ['♥', 'Compromiso', 'Construimos confianza'], ['✦', 'Innovación', 'Pensamos para el futuro']] as [icon, title, text]}
      <div class="card">
        <div class="icon">{icon}</div>
        <h3>{title}</h3>
        <p>{text}</p>
      </div>
    {/each}
  </div>
</section>

<style>
  .about-hero {
    border-radius: 30px;
    min-height: 460px;
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
  .values {
    margin-top: 35px;
  }
  @media (max-width: 600px) {
    .about-hero {
      padding: 30px;
      min-height: 400px;
    }
  }
</style>
