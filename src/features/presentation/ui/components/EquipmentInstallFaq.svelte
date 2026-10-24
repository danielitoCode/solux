<script lang="ts">
  /**
   * FAQ: equipo vs instalación — aclara la decisión comercial.
   * Reutilizable en catálogo, servicios y home.
   */
  type Item = { q: string; a: string };

  const items: Item[] = [
    {
      q: '¿Solo compro el equipo o también instalan?',
      a: 'Las dos opciones. Puedes consultar un equipo (solo compra o cotización) o solicitar “instalar con kit”: visita técnica, montaje, puesta en marcha y configuración. En el catálogo cada oferta indica su alcance.'
    },
    {
      q: '¿Qué incluye “instalar con kit”?',
      a: 'Dimensionamiento según tu consumo, suministro de equipos del kit, estructura, cableado, inversor/batería si aplica, puesta a tierra y pruebas. El precio orientativo del catálogo no sustituye el presupuesto tras la visita.'
    },
    {
      q: '¿Puedo traer equipos de otro proveedor?',
      a: 'Sí. Reserva una visita con intención de instalación y indícalo en las notas. Evaluamos compatibilidad, normas y seguridad antes de montar. El alcance y el costo se confirman en la cotización.'
    },
    {
      q: '¿Cómo se diferencia el precio “desde” del presupuesto final?',
      a: 'El “desde” del catálogo es referencial por equipo o paquete típico. El presupuesto final considera techo o terreno, consumo real, distancia de cableado, protecciones y permisos locales en Guantánamo.'
    },
    {
      q: '¿Cuánto tarda una instalación residencial típica?',
      a: 'Tras la visita y la aprobación del presupuesto, una instalación residencial estándar suele resolverse en pocos días de obra, según stock y complejidad. Te confirmamos calendario al cerrar el alcance.'
    },
    {
      q: '¿Qué pasa después de instalar?',
      a: 'Entregamos el sistema operativo y orientaciones de uso. Puedes abrir un ticket de soporte o agendar mantenimiento preventivo cuando lo necesites.'
    }
  ];

  let open = $state<number | null>(0);

  function toggle(i: number) {
    open = open === i ? null : i;
  }
</script>

<section class="faq" aria-labelledby="faq-title">
  <div class="faq-head">
    <div>
      <p class="eyebrow">Antes de decidir</p>
      <h2 id="faq-title">Equipo vs instalación</h2>
    </div>
    <p>
      Respuestas claras para elegir si solo necesitas el equipo, un kit completo o que SOLUX se encargue del montaje.
    </p>
  </div>

  <div class="faq-list">
    {#each items as item, i (item.q)}
      <div class="faq-item" class:open={open === i}>
        <button
          type="button"
          class="faq-q"
          aria-expanded={open === i}
          aria-controls={`faq-a-${i}`}
          id={`faq-q-${i}`}
          onclick={() => toggle(i)}
        >
          <span>{item.q}</span>
          <span class="chev" aria-hidden="true">{open === i ? '−' : '+'}</span>
        </button>
        {#if open === i}
          <div class="faq-a" id={`faq-a-${i}`} role="region" aria-labelledby={`faq-q-${i}`}>
            <p>{item.a}</p>
          </div>
        {/if}
      </div>
    {/each}
  </div>

  <div class="faq-ctas">
    <a class="btn btn-ghost btn-small" href="/catalogo?source=faq">Ver catálogo</a>
    <a class="btn btn-primary btn-small" href="/reservas?intent=install&source=faq">
      Solicitar visita técnica <span class="arrow" aria-hidden="true">→</span>
    </a>
  </div>
</section>

<style>
  .faq {
    --ease: cubic-bezier(0.22, 1, 0.36, 1);
    margin: 40px 0 8px;
    padding: 28px 24px;
    border: 1px solid var(--color-border);
    border-radius: 20px;
    background: color-mix(in srgb, var(--color-surface) 92%, transparent);
  }
  .faq-head {
    display: flex;
    flex-wrap: wrap;
    justify-content: space-between;
    gap: 16px 28px;
    align-items: end;
    margin-bottom: 22px;
  }
  .faq-head .eyebrow {
    margin: 0 0 8px;
    color: var(--color-primary);
    font-size: 10px;
    font-weight: 800;
    letter-spacing: 0.14em;
    text-transform: uppercase;
  }
  .faq-head h2 {
    margin: 0;
    font-size: clamp(22px, 3vw, 28px);
    letter-spacing: -0.03em;
  }
  .faq-head p {
    margin: 0;
    max-width: 340px;
    color: var(--color-muted);
    font-size: 14px;
    line-height: 1.5;
  }
  .faq-list {
    display: grid;
    gap: 8px;
  }
  .faq-item {
    border: 1px solid var(--color-border);
    border-radius: 14px;
    background: var(--color-bg, var(--color-surface));
    overflow: hidden;
    transition: border-color 0.25s var(--ease);
  }
  .faq-item.open {
    border-color: color-mix(in srgb, var(--color-primary) 40%, var(--color-border));
  }
  .faq-q {
    width: 100%;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
    padding: 14px 16px;
    border: 0;
    background: transparent;
    color: var(--color-text);
    font: inherit;
    font-size: 14px;
    font-weight: 700;
    text-align: left;
    cursor: pointer;
  }
  .faq-q:focus-visible {
    outline: 2px solid var(--color-primary);
    outline-offset: -2px;
  }
  .chev {
    flex: none;
    width: 28px;
    height: 28px;
    display: grid;
    place-items: center;
    border-radius: 8px;
    background: var(--color-surface-2, var(--color-border));
    color: var(--color-primary);
    font-size: 16px;
    font-weight: 800;
  }
  .faq-a {
    padding: 0 16px 16px;
  }
  .faq-a p {
    margin: 0;
    color: var(--color-muted);
    font-size: 13.5px;
    line-height: 1.55;
  }
  .faq-ctas {
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
    margin-top: 20px;
  }
  .arrow {
    display: inline-block;
    transition: transform 0.25s var(--ease);
  }
  a:hover > .arrow {
    transform: translateX(3px);
  }
  @media (max-width: 640px) {
    .faq {
      padding: 20px 16px;
    }
    .faq-head {
      align-items: start;
    }
  }
</style>
