<script lang="ts">
  import { onMount } from 'svelte';
  import { page } from '$app/stores';
  import { publicContactUseCases } from '$features/contact/di/public-contact';
  import { iconHover, registerAnimateIcons } from '$infrastructure/ui/animate-icons-registry';

  let companyName = $state('SOLUX');
  let logoUrl = $state('');

  onMount(async () => {
    registerAnimateIcons();
    const data = await publicContactUseCases.getCompanyProfile.execute();
    if (data) { companyName = data.name || 'SOLUX'; logoUrl = data.logo_url || ''; }
  });

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

  let menuOpen = $state(false);

  function toggleTheme() {
    const next = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
    document.documentElement.dataset.theme = next;
    localStorage.setItem('solux-theme', next);
  }

  function closeMenu() {
    menuOpen = false;
  }

  function isActive(href: string) {
    const path = $page.url.pathname;
    return href === '/' ? path === '/' : path.startsWith(href);
  }
</script>

<header class="site-header">
  <a class="brand" href="/" aria-label="SOLUX inicio" onclick={closeMenu}>
    {#if logoUrl}<img class="company-logo" src={logoUrl} alt={`Logo de ${companyName}`} />{:else}<span class="brand-mark"><span></span></span>{/if}
    <span>{companyName}</span>
  </a>

  <nav id="primary-navigation" class="desktop-nav" class:open={menuOpen} aria-label="Navegación principal">
    {#each links as link}
      <a
        href={link.href}
        class:active={isActive(link.href)}
        aria-current={isActive(link.href) ? 'page' : undefined}
        onclick={closeMenu}
        use:iconHover
      >
        <span class="nav-icon" aria-hidden="true">
          <animate-icons name={link.icon} size="16" color="currentColor" is-animated="false"></animate-icons>
        </span>
        <span>{link.label}</span>
      </a>
    {/each}
  </nav>

  <div class="header-actions">
    <button class="theme-toggle" type="button" onclick={toggleTheme} aria-label="Cambiar tema" use:iconHover>
      <span aria-hidden="true"><animate-icons name="sun" size="18" color="currentColor" is-animated="false"></animate-icons></span>
    </button>
    <a class="btn btn-small btn-primary reserve" href="/reservas" onclick={closeMenu}>Reservar</a>
    <button
      class="menu-toggle"
      type="button"
      onclick={() => (menuOpen = !menuOpen)}
      aria-label={menuOpen ? 'Cerrar menú' : 'Abrir menú'}
      aria-expanded={menuOpen}
      aria-controls="primary-navigation"
      use:iconHover
    >
      <span aria-hidden="true"><animate-icons name="menu" size="18" color="currentColor" is-animated="false"></animate-icons></span>
    </button>
  </div>
</header>

<style>
  .site-header {
    position: relative;
    max-width: var(--max-width);
    margin: 0 auto;
    padding: 18px 28px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
    z-index: 30;
  }
  .brand {
    display: inline-flex;
    align-items: center;
    gap: 10px;
    min-width: 0;
    font-weight: 800;
    letter-spacing: -0.03em;
    color: var(--color-text);
  }
  .brand > span:last-child {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .company-logo {
    width: 32px;
    height: 32px;
    object-fit: contain;
    border-radius: 8px;
    flex: 0 0 auto;
  }
  .brand-mark {
    width: 28px;
    height: 28px;
    display: grid;
    place-items: center;
    border-radius: 9px;
    background: linear-gradient(145deg, var(--color-primary), var(--color-primary-2));
    position: relative;
    overflow: hidden;
    transform: rotate(-5deg);
    flex: 0 0 auto;
  }
  .brand-mark::before {
    content: '';
    width: 12px;
    height: 12px;
    border-radius: 50%;
    background: var(--color-accent);
    position: absolute;
    top: 2px;
    right: 2px;
  }
  .brand-mark span {
    width: 14px;
    height: 7px;
    border: 2.5px solid white;
    border-top: 0;
    border-radius: 0 0 9px 9px;
    position: relative;
    z-index: 1;
  }
  .desktop-nav {
    display: flex;
    gap: 6px;
    flex-wrap: wrap;
    justify-content: center;
  }
  .desktop-nav a {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 8px 12px;
    border-radius: 10px;
    font-size: 13px;
    font-weight: 600;
    color: var(--color-muted);
  }
  .desktop-nav .nav-icon {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 16px;
    height: 16px;
    line-height: 1;
    opacity: 0.85;
    flex-shrink: 0;
  }
  .desktop-nav .nav-icon :global(svg) {
    display: block;
  }
  .desktop-nav a.active .nav-icon,
  .desktop-nav a:hover .nav-icon {
    opacity: 1;
  }
  .desktop-nav a:hover,
  .desktop-nav a.active {
    color: var(--color-primary);
    background: color-mix(in srgb, var(--color-primary) 10%, transparent);
  }
  .header-actions {
    display: flex;
    align-items: center;
    gap: 8px;
    flex: 0 0 auto;
  }
  .theme-toggle,
  .menu-toggle {
    border: 1px solid var(--color-border);
    background: var(--color-surface);
    color: var(--color-text);
    width: 38px;
    height: 38px;
    border-radius: 10px;
  }
  .theme-toggle:hover,
  .menu-toggle:hover {
    border-color: var(--color-primary);
    color: var(--color-primary);
  }
  .menu-toggle {
    display: none;
  }
  @media (max-width: 1100px) {
    .desktop-nav a {
      padding-inline: 9px;
    }
    .site-header {
      gap: 10px;
    }
  }
  @media (max-width: 900px) {
    .site-header {
      padding: 14px 18px;
    }
    .desktop-nav {
      display: none;
      position: absolute;
      top: calc(100% + 8px);
      left: 18px;
      right: 18px;
      background: var(--color-surface);
      border: 1px solid var(--color-border);
      border-radius: 14px;
      padding: 8px;
      flex-direction: column;
      align-items: stretch;
      box-shadow: var(--color-shadow);
      z-index: 40;
    }
    .desktop-nav.open {
      display: flex;
    }
    .desktop-nav a {
      padding: 11px 12px;
    }
    .menu-toggle {
      display: inline-grid;
      place-items: center;
    }
    .reserve {
      min-height: 38px;
      padding-inline: 13px;
    }
  }
  @media (max-width: 520px) {
    .site-header {
      padding-inline: 14px;
    }
    .brand {
      gap: 8px;
    }
    .brand-mark,
    .company-logo {
      width: 30px;
      height: 30px;
    }
    .reserve {
      display: none;
    }
  }
</style>
