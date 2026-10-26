<script lang="ts">
  import { page } from '$app/stores';
  import { navIcon } from '$infrastructure/ui/animate-icons-registry';

  /** Brand inyectado desde +layout.ts load (sin fetch en cliente). */
  let {
    companyName = 'SOLUX',
    logoUrl = ''
  }: {
    companyName?: string;
    logoUrl?: string;
  } = $props();

  const links = [
    { href: '/', label: 'Inicio', icon: 'house', route: '/' },
    { href: '/servicios', label: 'Servicios', icon: 'zap', route: '/servicios' },
    { href: '/catalogo', label: 'Catálogo', icon: 'package', route: '/catalogo' },
    { href: '/proyectos', label: 'Proyectos', icon: 'image', route: '/proyectos' },
    { href: '/nosotros', label: 'Nosotros', icon: 'users', route: '/nosotros' },
    { href: '/seguimiento', label: 'Seguimiento', icon: 'search', route: '/seguimiento' },
    { href: '/soporte', label: 'Soporte', icon: 'wrench', route: '/soporte' },
    { href: '/contacto', label: 'Contacto', icon: 'mail', route: '/contacto' }
  ];

  let open = $state(false);

  const currentPath = $derived($page.url.pathname);

  function isActive(route: string) {
    if (route === '/') return currentPath === '/';
    return currentPath === route || currentPath.startsWith(route + '/');
  }

  function close() {
    open = false;
  }
</script>

<header class="site-header">
  <a class="brand" href="/" aria-label={`${companyName} inicio`} onclick={close}>
    {#if logoUrl}<img class="company-logo" src={logoUrl} alt={`Logo de ${companyName}`} />{:else}<span class="brand-mark"><span></span></span>{/if}
    <span>{companyName}</span>
  </a>

  <nav class="desktop-nav" aria-label="Principal">
    {#each links as link}
      <a
        class="nav-link"
        class:active={isActive(link.route)}
        href={link.href}
        aria-current={isActive(link.route) ? 'page' : undefined}
      >
        <span class="nav-icon" use:navIcon={link.icon}></span>
        <span>{link.label}</span>
      </a>
    {/each}
  </nav>

  <a class="cta" href="/reservas">Reservar visita</a>

  <button
    type="button"
    class="menu-btn"
    aria-label={open ? 'Cerrar menú' : 'Abrir menú'}
    aria-expanded={open}
    aria-controls="mobile-nav"
    onclick={() => (open = !open)}
  >
    <span class="nav-icon" use:navIcon={'menu'}></span>
  </button>
</header>

{#if open}
  <div class="mobile-backdrop" onclick={close} role="presentation"></div>
  <nav id="mobile-nav" class="mobile-nav" aria-label="Móvil">
    {#each links as link}
      <a
        class="nav-link"
        class:active={isActive(link.route)}
        href={link.href}
        aria-current={isActive(link.route) ? 'page' : undefined}
        onclick={close}
      >
        <span class="nav-icon" use:navIcon={link.icon}></span>
        <span>{link.label}</span>
      </a>
    {/each}
    <a class="cta mobile-cta" href="/reservas" onclick={close}>Reservar visita</a>
  </nav>
{/if}

<style>
  .site-header {
    position: sticky;
    top: 0;
    z-index: 40;
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 12px 20px;
    background: color-mix(in oklab, var(--color-bg) 88%, transparent);
    backdrop-filter: blur(12px);
    border-bottom: 1px solid color-mix(in oklab, var(--color-border) 70%, transparent);
  }

  .brand {
    display: inline-flex;
    align-items: center;
    gap: 10px;
    font-weight: 800;
    letter-spacing: -0.02em;
    color: var(--color-text);
    text-decoration: none;
    margin-right: auto;
  }

  .brand-mark {
    width: 28px;
    height: 28px;
    border-radius: 9px;
    background: linear-gradient(135deg, var(--color-primary), color-mix(in oklab, var(--color-primary) 40%, #0f172a));
    display: grid;
    place-items: center;
  }

  .brand-mark span {
    width: 10px;
    height: 10px;
    border-radius: 999px;
    background: #fff;
    opacity: 0.9;
  }

  .company-logo {
    width: 28px;
    height: 28px;
    object-fit: contain;
    border-radius: 6px;
  }

  .desktop-nav {
    display: none;
    flex: 1;
    justify-content: center;
    align-items: center;
    gap: 4px;
    flex-wrap: nowrap;
  }

  .nav-link {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 8px 10px;
    border-radius: 10px;
    font-size: 12.5px;
    font-weight: 600;
    color: var(--color-text-muted);
    text-decoration: none;
    white-space: nowrap;
  }

  .nav-link:hover,
  .nav-link.active {
    color: var(--color-text);
    background: color-mix(in oklab, var(--color-primary) 12%, transparent);
  }

  .nav-icon {
    width: 18px;
    height: 18px;
    display: inline-grid;
    place-items: center;
    flex-shrink: 0;
  }

  .cta {
    display: none;
    padding: 9px 14px;
    border-radius: 12px;
    background: var(--color-primary);
    color: #fff;
    font-weight: 700;
    font-size: 13px;
    text-decoration: none;
    white-space: nowrap;
  }

  .menu-btn {
    display: inline-grid;
    place-items: center;
    width: 40px;
    height: 40px;
    border: 1px solid var(--color-border);
    border-radius: 12px;
    background: var(--color-surface);
    color: var(--color-text);
    cursor: pointer;
  }

  .mobile-backdrop {
    position: fixed;
    inset: 0;
    z-index: 45;
    background: rgba(15, 23, 42, 0.35);
  }

  .mobile-nav {
    position: fixed;
    top: 64px;
    right: 12px;
    left: 12px;
    z-index: 50;
    display: flex;
    flex-direction: column;
    gap: 4px;
    padding: 12px;
    border-radius: 16px;
    background: var(--color-surface);
    border: 1px solid var(--color-border);
    box-shadow: 0 18px 50px rgba(15, 23, 42, 0.18);
  }

  .mobile-cta {
    display: block;
    text-align: center;
    margin-top: 8px;
  }

  @media (min-width: 960px) {
    .desktop-nav {
      display: flex;
    }
    .cta {
      display: inline-flex;
    }
    .menu-btn {
      display: none;
    }
  }

  @media (max-width: 959px) {
    .site-header {
      padding: 10px 14px;
    }
  }
</style>
