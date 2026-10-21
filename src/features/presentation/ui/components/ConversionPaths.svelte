<script lang="ts">
  /** Tres rutas comerciales: comprar / instalar / mantener */
  const paths = [
    {
      href: '/catalogo?intent=buy&source=home',
      icon: '🛒',
      title: 'Quiero comprar un kit o equipo',
      text: 'Compara ofertas de proveedores y consulta disponibilidad sin compromiso.',
      cta: 'Ver catálogo →',
      featured: false
    },
    {
      href: '/reservas?intent=install&source=home',
      icon: '⚡',
      title: 'Ya tengo equipos o quiero instalar',
      text: 'Solicita visita técnica: montaje, inversor, baterías o puesta a tierra.',
      cta: 'Solicitar instalación →',
      featured: true
    },
    {
      href: '/soporte?intent=maintain&source=home',
      icon: '🛠️',
      title: 'Necesito mantenimiento o reparación',
      text: 'Reporta una incidencia o agenda revisión de un sistema ya instalado.',
      cta: 'Abrir soporte →',
      featured: false
    }
  ] as const;
</script>

<div class="section-head">
  <div>
    <div class="eyebrow">¿Qué necesitas?</div>
    <h2>Elige tu camino.</h2>
  </div>
  <p>
    Tres formas claras de empezar. Cada una te lleva al formulario o catálogo adecuado, sin pasos de más.
  </p>
</div>

<div class="paths-grid">
  {#each paths as p}
    <a class="path-card" class:featured={p.featured} href={p.href}>
      <span class="path-icon" aria-hidden="true">{p.icon}</span>
      <strong>{p.title}</strong>
      <p>{p.text}</p>
      <span class="path-cta">{p.cta}</span>
    </a>
  {/each}
</div>

<style>
  .section-head {
    display: flex;
    justify-content: space-between;
    gap: 24px;
    align-items: end;
    margin-bottom: 22px;
  }
  .section-head p {
    max-width: 360px;
    margin: 0;
    color: var(--color-muted);
    font-size: 14px;
    line-height: 1.5;
  }
  .paths-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 16px;
    margin-bottom: 48px;
  }
  .path-card {
    display: flex;
    flex-direction: column;
    gap: 10px;
    padding: 22px 20px;
    border-radius: 18px;
    border: 1px solid var(--color-border);
    background: var(--color-surface);
    color: inherit;
    text-decoration: none;
    transition: border-color 0.2s, box-shadow 0.2s, transform 0.2s;
  }
  .path-card:hover {
    border-color: color-mix(in srgb, var(--color-primary) 55%, var(--color-border));
    box-shadow: 0 12px 28px color-mix(in srgb, var(--color-primary) 12%, transparent);
    transform: translateY(-2px);
  }
  .path-card.featured {
    border-color: color-mix(in srgb, var(--color-primary) 40%, var(--color-border));
    background: color-mix(in srgb, var(--color-primary) 8%, var(--color-surface));
  }
  .path-icon {
    font-size: 28px;
    line-height: 1;
  }
  .path-card strong {
    font-size: 16px;
    line-height: 1.3;
  }
  .path-card p {
    margin: 0;
    flex: 1;
    font-size: 13px;
    color: var(--color-muted);
    line-height: 1.45;
  }
  .path-cta {
    font-size: 13px;
    font-weight: 700;
    color: var(--color-primary);
  }
  @media (max-width: 900px) {
    .section-head {
      flex-direction: column;
      align-items: start;
    }
    .paths-grid {
      grid-template-columns: 1fr;
    }
  }
</style>
