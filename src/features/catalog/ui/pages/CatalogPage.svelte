<script lang="ts">
  import type { CatalogItem } from '$features/catalog/domain/entities';

  /** Mock data — will come from Supabase via repository */
  const items: CatalogItem[] = [
    {
      id: '1',
      type: 'product',
      category: 'solar_panels',
      name: 'Panel Monocristalino 550W',
      shortDescription: 'Alta eficiencia para residencial y comercial.',
      description: 'Módulo fotovoltaico monocristalino de 550W con garantía de rendimiento.',
      price: 180,
      currency: 'USD',
      features: ['Eficiencia >21%', 'Garantía 25 años', 'Resistente a salinidad'],
      isActive: true,
      isFeatured: true,
      sortOrder: 1,
      createdAt: '',
      updatedAt: ''
    },
    {
      id: '2',
      type: 'product',
      category: 'inverters',
      name: 'Inversor Híbrido 5kW',
      shortDescription: 'Gestión inteligente de red + batería.',
      description: 'Inversor híbrido con monitoreo remoto y priorización de cargas.',
      price: 890,
      currency: 'USD',
      features: ['MPPT dual', 'App de monitoreo', 'Respaldo automático'],
      isActive: true,
      isFeatured: true,
      sortOrder: 2,
      createdAt: '',
      updatedAt: ''
    },
    {
      id: '3',
      type: 'product',
      category: 'batteries',
      name: 'Batería LiFePO4 5kWh',
      shortDescription: 'Almacenamiento seguro y de larga vida.',
      description: 'Batería de litio hierro fosfato para uso diario y respaldo.',
      price: 1200,
      currency: 'USD',
      features: ['6000+ ciclos', 'BMS integrado', 'Expandible'],
      isActive: true,
      isFeatured: false,
      sortOrder: 3,
      createdAt: '',
      updatedAt: ''
    },
    {
      id: '4',
      type: 'service',
      category: 'solar_kits',
      name: 'Kit solar residencial 3kW',
      shortDescription: 'Paquete completo listo para instalar.',
      description: 'Incluye paneles, inversor, estructura y cableado dimensionado.',
      price: 2800,
      currency: 'USD',
      features: ['Instalación incluida', 'Visita técnica', 'Garantía de obra'],
      isActive: true,
      isFeatured: true,
      sortOrder: 4,
      createdAt: '',
      updatedAt: ''
    },
    {
      id: '5',
      type: 'service',
      category: 'electrical_installation',
      name: 'Instalación eléctrica completa',
      shortDescription: 'Residencial, comercial e industrial.',
      description: 'Diseño, materiales e instalación según normas vigentes.',
      features: ['Diseño certificado', 'Materiales de calidad', 'Pruebas finales'],
      currency: 'USD',
      isActive: true,
      isFeatured: false,
      sortOrder: 5,
      createdAt: '',
      updatedAt: ''
    },
    {
      id: '6',
      type: 'service',
      category: 'maintenance',
      name: 'Mantenimiento preventivo',
      shortDescription: 'Revisión y limpieza de sistemas solares.',
      description: 'Diagnóstico, limpieza de paneles y reporte de estado.',
      price: 80,
      currency: 'USD',
      features: ['Inspección térmica', 'Limpieza', 'Informe'],
      isActive: true,
      isFeatured: false,
      sortOrder: 6,
      createdAt: '',
      updatedAt: ''
    }
  ];

  const categoryLabel: Record<string, string> = {
    solar_panels: 'Paneles',
    inverters: 'Inversores',
    batteries: 'Baterías',
    solar_kits: 'Kits solares',
    power_stations: 'Estaciones',
    grounding: 'Tierra',
    electrical_installation: 'Instalación eléctrica',
    electrical_repair: 'Reparaciones',
    maintenance: 'Mantenimiento',
    advisory: 'Asesoría'
  };
</script>

<section class="page">
  <div class="section-head">
    <div>
      <div class="eyebrow">Catálogo</div>
      <h2>Productos y servicios.</h2>
    </div>
    <p>Carta de equipos y servicios que instalamos y mantenemos. Precios orientativos; cada proyecto se dimensiona a medida.</p>
  </div>

  <div class="grid grid-3">
    {#each items as item}
      <article class="card catalog-card">
        <div class="catalog-badge">{item.type === 'product' ? 'Producto' : 'Servicio'}</div>
        <div class="icon">
          {#if item.category === 'solar_panels'}☀
          {:else if item.category === 'inverters'}◈
          {:else if item.category === 'batteries'}▣
          {:else if item.category === 'solar_kits'}✦
          {:else if item.category === 'maintenance'}✓
          {:else}⌁
          {/if}
        </div>
        <p class="cat-label">{categoryLabel[item.category] ?? item.category}</p>
        <h3>{item.name}</h3>
        <p>{item.shortDescription}</p>
        {#if item.features?.length}
          <ul class="feat-list">
            {#each item.features.slice(0, 3) as f}
              <li>{f}</li>
            {/each}
          </ul>
        {/if}
        <div class="catalog-footer">
          {#if item.price}
            <strong class="price">desde {item.price} {item.currency}</strong>
          {:else}
            <strong class="price">A consultar</strong>
          {/if}
          <a class="btn btn-small btn-primary" href="/reservas">Solicitar</a>
        </div>
      </article>
    {/each}
  </div>

  <div class="banner" style="margin-top: 45px">
    <div>
      <strong>¿No encuentras lo que buscas?</strong>
      <p>Diseñamos soluciones a medida. Solicita una visita técnica.</p>
    </div>
    <a class="btn btn-accent" href="/reservas">Reservar visita</a>
  </div>
</section>

<style>
  .catalog-card {
    display: flex;
    flex-direction: column;
    position: relative;
  }
  .catalog-badge {
    position: absolute;
    top: 16px;
    right: 16px;
    font-size: 10px;
    font-weight: 800;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    padding: 4px 10px;
    border-radius: 999px;
    background: color-mix(in srgb, var(--color-primary) 12%, transparent);
    color: var(--color-primary);
  }
  .cat-label {
    font-size: 11px;
    font-weight: 700;
    color: var(--color-primary);
    text-transform: uppercase;
    letter-spacing: 0.06em;
    margin-bottom: 6px !important;
  }
  .feat-list {
    list-style: none;
    padding: 0;
    margin: 14px 0 0;
    flex: 1;
  }
  .feat-list li {
    font-size: 12px;
    color: var(--color-muted);
    margin: 6px 0;
  }
  .feat-list li::before {
    content: '·';
    color: var(--color-primary-2);
    font-weight: 800;
    margin-right: 6px;
  }
  .catalog-footer {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-top: 20px;
    padding-top: 16px;
    border-top: 1px solid var(--color-border);
  }
  .price {
    font-size: 15px;
    color: var(--color-text);
  }
  .banner {
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
  @media (max-width: 600px) {
    .banner {
      display: block;
    }
    .banner .btn {
      margin-top: 18px;
    }
  }
</style>
