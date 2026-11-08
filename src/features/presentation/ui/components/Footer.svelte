<script lang="ts">
  /** Brand inyectado desde +layout.ts load (sin fetch en cliente). */
  let {
    companyName = 'SOLUX',
    logoUrl = ''
  }: {
    companyName?: string;
    logoUrl?: string;
  } = $props();

  const year = new Date().getFullYear();

  const socials = [
    {
      label: 'Facebook',
      href: 'https://www.facebook.com/profile.php?id=61595682627758',
      icon: 'facebook'
    },
    {
      label: 'Instagram',
      href: 'https://www.instagram.com/soluxelectricalgtmo',
      icon: 'instagram'
    },
    {
      label: 'LinkedIn',
      href: 'https://www.linkedin.com/company/solux-electrical',
      icon: 'linkedin'
    }
  ] as const;

  const navGroups = [
    {
      title: 'Empresa',
      links: [
        { href: '/nosotros', label: 'Nosotros' },
        { href: '/proyectos', label: 'Proyectos' },
        { href: '/servicios', label: 'Servicios' }
      ]
    },
    {
      title: 'Soluciones',
      links: [
        { href: '/catalogo', label: 'Catálogo' },
        { href: '/reservas', label: 'Reservas' },
        { href: '/seguimiento', label: 'Seguimiento' }
      ]
    },
    {
      title: 'Soporte',
      links: [
        { href: '/soporte', label: 'Soporte técnico' },
        { href: '/contacto', label: 'Contacto' }
      ]
    }
  ];
</script>

<footer class="footer">
  <div class="footer-main">
    <div class="footer-brand-block">
      <a class="brand" href="/" aria-label={`${companyName} inicio`}>
        {#if logoUrl}
          <img class="company-logo" src={logoUrl} alt={`Logo de ${companyName}`} width="32" height="32" />
        {:else}
          <span class="brand-mark" aria-hidden="true"><span></span></span>
        {/if}
        <span class="brand-name">{companyName}</span>
      </a>
      <p class="tagline">
        Energía solar e ingeniería eléctrica para hogares, negocios e industrias en Guantánamo.
      </p>

      <div class="socials" aria-label="Redes sociales">
        {#each socials as social}
          <a
            class="social-link"
            href={social.href}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={social.label}
          >
            {#if social.icon === 'facebook'}
              <svg viewBox="0 0 24 24" aria-hidden="true" fill="currentColor">
                <path
                  d="M22 12.06C22 6.5 17.52 2 12 2S2 6.5 2 12.06c0 5.02 3.66 9.18 8.44 9.94v-7.03H7.9v-2.91h2.54V9.84c0-2.5 1.49-3.89 3.77-3.89 1.09 0 2.24.2 2.24.2v2.46h-1.26c-1.24 0-1.63.77-1.63 1.56v1.88h2.78l-.44 2.91h-2.34V22c4.78-.76 8.44-4.92 8.44-9.94Z"
                />
              </svg>
            {:else if social.icon === 'instagram'}
              <svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.8">
                <rect x="3" y="3" width="18" height="18" rx="5" />
                <circle cx="12" cy="12" r="4" />
                <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
              </svg>
            {:else}
              <svg viewBox="0 0 24 24" aria-hidden="true" fill="currentColor">
                <path
                  d="M20.45 20.45h-3.56v-5.57c0-1.33-.02-3.04-1.85-3.04-1.85 0-2.14 1.45-2.14 2.94v5.67H9.34V9h3.41v1.56h.05c.47-.9 1.64-1.85 3.37-1.85 3.6 0 4.27 2.37 4.27 5.46v6.28ZM5.34 7.43a2.07 2.07 0 1 1 0-4.13 2.07 2.07 0 0 1 0 4.13ZM7.12 20.45H3.56V9h3.56v11.45ZM22 0H2C.9 0 0 .9 0 2v20c0 1.1.9 2 2 2h20c1.1 0 2-.9 2-2V2c0-1.1-.9-2-2-2Z"
                />
              </svg>
            {/if}
          </a>
        {/each}
      </div>
    </div>

    <div class="footer-nav">
      {#each navGroups as group}
        <div class="nav-group">
          <h3 class="nav-title">{group.title}</h3>
          <ul>
            {#each group.links as link}
              <li>
                <a href={link.href}>{link.label}</a>
              </li>
            {/each}
          </ul>
        </div>
      {/each}
    </div>
  </div>

  <div class="footer-bottom">
    <small>© {year} {companyName}. Todos los derechos reservados.</small>
    <small class="location">Guantánamo, Cuba</small>
  </div>
</footer>

<style>
  .footer {
    border-top: 1px solid var(--color-border);
    background: var(--color-surface);
    color: var(--color-muted);
  }

  .footer-main {
    max-width: var(--max-width);
    margin: 0 auto;
    padding: 48px var(--space-page-x, 24px) 36px;
    display: grid;
    grid-template-columns: minmax(240px, 1.1fr) minmax(320px, 1.6fr);
    gap: 40px 48px;
    align-items: start;
  }

  /* Brand block */
  .footer-brand-block {
    min-width: 0;
  }

  .brand {
    display: inline-flex;
    align-items: center;
    gap: 10px;
    margin-bottom: 12px;
    color: var(--color-text);
    text-decoration: none;
  }

  .brand-name {
    font-weight: 800;
    font-size: 1.125rem;
    letter-spacing: -0.03em;
  }

  .company-logo {
    width: 32px;
    height: 32px;
    object-fit: contain;
    border-radius: 8px;
  }

  .brand-mark {
    width: 28px;
    height: 28px;
    display: grid;
    place-items: center;
    border-radius: 8px;
    background: linear-gradient(145deg, var(--color-primary), var(--color-primary-2));
    position: relative;
    overflow: hidden;
    flex-shrink: 0;
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
    border-radius: 0 0 7px 7px;
    position: relative;
    z-index: 1;
  }

  .tagline {
    margin: 0 0 20px;
    font-size: 0.875rem;
    line-height: 1.55;
    max-width: 32ch;
    color: var(--color-muted);
  }

  /* Social icons */
  .socials {
    display: flex;
    gap: 10px;
  }

  .social-link {
    width: 38px;
    height: 38px;
    display: grid;
    place-items: center;
    border-radius: 10px;
    border: 1px solid var(--color-border);
    background: var(--color-bg);
    color: var(--color-muted);
    transition:
      color 0.15s ease,
      border-color 0.15s ease,
      background 0.15s ease,
      transform 0.15s ease;
  }

  .social-link:hover {
    color: var(--color-primary);
    border-color: color-mix(in srgb, var(--color-primary) 40%, var(--color-border));
    background: color-mix(in srgb, var(--color-primary) 8%, var(--color-bg));
    transform: translateY(-1px);
  }

  .social-link svg {
    width: 18px;
    height: 18px;
  }

  /* Navigation groups */
  .footer-nav {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 28px 24px;
  }

  .nav-title {
    margin: 0 0 14px;
    font-size: 0.75rem;
    font-weight: 700;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    color: var(--color-text);
  }

  .nav-group ul {
    list-style: none;
    margin: 0;
    padding: 0;
    display: grid;
    gap: 8px;
  }

  .nav-group a {
    font-size: 0.875rem;
    font-weight: 500;
    color: var(--color-muted);
    text-decoration: none;
    transition: color 0.15s ease;
  }

  .nav-group a:hover {
    color: var(--color-primary);
  }

  /* Bottom bar */
  .footer-bottom {
    max-width: var(--max-width);
    margin: 0 auto;
    padding: 18px var(--space-page-x, 24px) 28px;
    border-top: 1px solid var(--color-border);
    display: flex;
    flex-wrap: wrap;
    justify-content: space-between;
    gap: 8px 16px;
    font-size: 0.75rem;
    color: var(--color-muted);
  }

  .footer-bottom small {
    font-size: inherit;
  }

  /* Responsive */
  @media (max-width: 860px) {
    .footer-main {
      grid-template-columns: 1fr;
      gap: 36px;
      padding-top: 40px;
    }

    .footer-nav {
      grid-template-columns: repeat(3, minmax(0, 1fr));
    }
  }

  @media (max-width: 560px) {
    .footer-main {
      padding: 32px var(--space-page-x, 18px) 28px;
    }

    .footer-nav {
      grid-template-columns: 1fr 1fr;
      gap: 24px 20px;
    }

    .tagline {
      max-width: none;
    }

    .footer-bottom {
      padding: 16px var(--space-page-x, 18px) 24px;
      flex-direction: column;
      align-items: flex-start;
    }
  }
</style>
