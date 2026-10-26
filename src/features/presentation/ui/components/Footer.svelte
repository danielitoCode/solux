<script lang="ts">
  /** Brand inyectado desde +layout.ts load (sin fetch en cliente). */
  let {
    companyName = 'SOLUX',
    logoUrl = ''
  }: {
    companyName?: string;
    logoUrl?: string;
  } = $props();
</script>

<footer class="footer">
  <div class="footer-company">
    <a class="brand footer-brand" href="/" aria-label={`${companyName} inicio`}>
      {#if logoUrl}<img class="company-logo" src={logoUrl} alt={`Logo de ${companyName}`} />{:else}<span class="brand-mark"><span></span></span>{/if}
      <span>{companyName}</span>
    </a>
    <p>Energía solar · Ingeniería eléctrica</p>
  </div>
  <nav class="footer-links" aria-label="Enlaces del sitio">
    <a href="/servicios">Servicios</a>
    <a href="/catalogo">Catálogo</a>
    <a href="/proyectos">Proyectos</a>
    <a href="/reservas">Reservas</a>
    <a href="/seguimiento">Seguimiento</a>
    <a href="/soporte">Soporte</a>
    <a href="/contacto">Contacto</a>
  </nav>
  <small class="footer-meta">© {new Date().getFullYear()} {companyName} · Guantánamo, Cuba</small>
</footer>

<style>
  .footer {
    max-width: var(--max-width);
    margin: 0 auto;
    padding: 34px 28px 50px;
    border-top: 1px solid var(--color-border);
    display: grid;
    grid-template-columns: minmax(180px, 1fr) minmax(300px, 1.5fr) auto;
    justify-content: space-between;
    gap: 24px;
    align-items: center;
    color: var(--color-muted);
  }
  .footer-company {
    min-width: 0;
  }
  .footer-brand {
    display: inline-flex;
    align-items: center;
    gap: 10px;
    font-weight: 800;
    color: var(--color-text);
    margin-bottom: 6px;
  }
  .company-logo {
    width: 28px;
    height: 28px;
    object-fit: contain;
    border-radius: 8px;
  }
  .brand-mark {
    width: 26px;
    height: 26px;
    display: grid;
    place-items: center;
    border-radius: 8px;
    background: linear-gradient(145deg, var(--color-primary), var(--color-primary-2));
    position: relative;
    overflow: hidden;
  }
  .brand-mark::before {
    content: '';
    width: 10px;
    height: 10px;
    border-radius: 50%;
    background: var(--color-accent);
    position: absolute;
    top: 2px;
    right: 2px;
  }
  .brand-mark span {
    width: 12px;
    height: 6px;
    border: 2px solid white;
    border-top: 0;
    border-radius: 0 0 8px 8px;
    position: relative;
    z-index: 1;
  }
  .footer p {
    margin: 0;
    font-size: 13px;
  }
  .footer-links {
    display: flex;
    flex-wrap: wrap;
    gap: 8px 16px;
    justify-content: center;
  }
  .footer-links a {
    padding: 5px 0;
    font-size: 13px;
    font-weight: 600;
    color: var(--color-muted);
  }
  .footer-links a:hover {
    color: var(--color-primary);
  }
  .footer-meta {
    white-space: nowrap;
    font-size: 12px;
  }
  @media (max-width: 900px) {
    .footer {
      grid-template-columns: 1fr 1fr;
      align-items: start;
    }
    .footer-links {
      justify-content: flex-start;
    }
    .footer-meta {
      grid-column: 1 / -1;
    }
  }
  @media (max-width: 600px) {
    .footer {
      grid-template-columns: 1fr;
      padding: 28px 18px 38px;
    }
    .footer-links {
      gap: 6px 18px;
    }
    .footer-meta {
      grid-column: auto;
      white-space: normal;
    }
  }
</style>
