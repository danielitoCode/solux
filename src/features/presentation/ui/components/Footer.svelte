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
  <div class="footer-inner">
    <div class="footer-company">
      <a class="brand footer-brand" href="/" aria-label={`${companyName} inicio`}>
        {#if logoUrl}
          <img class="company-logo" src={logoUrl} alt={`Logo de ${companyName}`} />
        {:else}
          <span class="brand-mark" aria-hidden="true"><span></span></span>
        {/if}
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
  </div>
</footer>

<style>
  .footer {
    border-top: 1px solid var(--color-border);
    background: var(--color-surface);
  }

  .footer-inner {
    max-width: var(--max-width);
    margin: 0 auto;
    padding: 36px var(--space-page-x) 48px;
    display: grid;
    grid-template-columns: minmax(160px, 1fr) minmax(280px, 1.6fr) auto;
    justify-content: space-between;
    gap: 28px;
    align-items: center;
    color: var(--color-muted);
  }

  .footer-company {
    min-width: 0;
  }
  .footer-brand {
    display: inline-flex;
    align-items: center;
    gap: 9px;
    font-weight: var(--font-weight-extrabold);
    color: var(--color-text);
    margin-bottom: 6px;
    letter-spacing: var(--tracking-tight);
  }
  .company-logo {
    width: 26px;
    height: 26px;
    object-fit: contain;
    border-radius: var(--radius-sm);
  }
  .brand-mark {
    width: 24px;
    height: 24px;
    display: grid;
    place-items: center;
    border-radius: var(--radius-sm);
    background: linear-gradient(145deg, var(--color-primary), var(--color-primary-2));
    position: relative;
    overflow: hidden;
  }
  .brand-mark::before {
    content: '';
    width: 9px;
    height: 9px;
    border-radius: 50%;
    background: var(--color-accent);
    position: absolute;
    top: 2px;
    right: 2px;
  }
  .brand-mark span {
    width: 11px;
    height: 5px;
    border: 2px solid white;
    border-top: 0;
    border-radius: 0 0 7px 7px;
    position: relative;
    z-index: 1;
  }
  .footer p {
    margin: 0;
    font-size: var(--text-sm);
    line-height: var(--leading-normal);
  }

  .footer-links {
    display: flex;
    flex-wrap: wrap;
    gap: 6px 18px;
    justify-content: center;
  }
  .footer-links a {
    padding: 4px 0;
    font-size: var(--text-sm);
    font-weight: var(--font-weight-semibold);
    color: var(--color-muted);
    transition: color var(--duration-fast) var(--ease-out);
  }
  .footer-links a:hover {
    color: var(--color-primary);
  }

  .footer-meta {
    white-space: nowrap;
    font-size: var(--text-xs);
    color: var(--color-muted);
  }

  @media (max-width: 900px) {
    .footer-inner {
      grid-template-columns: 1fr 1fr;
      align-items: start;
      gap: 24px;
    }
    .footer-links {
      justify-content: flex-start;
    }
    .footer-meta {
      grid-column: 1 / -1;
    }
  }

  @media (max-width: 600px) {
    .footer-inner {
      grid-template-columns: 1fr;
      padding: 28px var(--space-page-x) 40px;
      gap: 20px;
    }
    .footer-links {
      gap: 4px 16px;
    }
    .footer-meta {
      grid-column: auto;
      white-space: normal;
    }
  }
</style>
