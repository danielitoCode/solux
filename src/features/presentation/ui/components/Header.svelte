<script lang="ts">
  import { page } from '$app/stores';
  import { navIcon } from '$infrastructure/ui/animate-icons-registry';
  import { onMount } from 'svelte';

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

  let menuOpen = $state(false);
  let scrolled = $state(false);

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

  onMount(() => {
    const onScroll = () => {
      scrolled = window.scrollY > 12;
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  });

  // Close menu on escape
  $effect(() => {
    if (!menuOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeMenu();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });
</script>

<header class="site-header" class:scrolled class:menu-open={menuOpen}>
  <div class="header-inner">
    <a class="brand" href="/" aria-label="SOLUX inicio" onclick={closeMenu}>
      {#if logoUrl}
        <img class="company-logo" src={logoUrl} alt={`Logo de ${companyName}`} />
      {:else}
        <span class="brand-mark" aria-hidden="true"><span></span></span>
      {/if}
      <span class="brand-name">{companyName}</span>
    </a>

    <nav id="primary-navigation" class="desktop-nav" class:open={menuOpen} aria-label="Navegación principal">
      {#each links as link}
        <a
          href={link.href}
          class:active={isActive(link.href)}
          aria-current={isActive(link.href) ? 'page' : undefined}
          onclick={closeMenu}
        >
          <span class="nav-icon" aria-hidden="true" data-size="15" use:navIcon={link.icon}></span>
          <span>{link.label}</span>
        </a>
      {/each}
    </nav>

    <div class="header-actions">
      <button class="theme-toggle" type="button" onclick={toggleTheme} aria-label="Cambiar tema">
        <span class="nav-icon" aria-hidden="true" data-size="17" use:navIcon={'sun'}></span>
      </button>
      <a class="btn btn-small btn-primary reserve" href="/reservas" onclick={closeMenu}>Reservar</a>
      <button
        class="menu-toggle"
        type="button"
        onclick={() => (menuOpen = !menuOpen)}
        aria-label={menuOpen ? 'Cerrar menú' : 'Abrir menú'}
        aria-expanded={menuOpen}
        aria-controls="primary-navigation"
      >
        <span class="nav-icon" aria-hidden="true" data-size="18" use:navIcon={menuOpen ? 'x' : 'menu'}></span>
      </button>
    </div>
  </div>

  {#if menuOpen}
    <!-- svelte-ignore a11y_click_events_have_key_events a11y_no_static_element_interactions -->
    <div class="menu-backdrop" onclick={closeMenu} aria-hidden="true"></div>
  {/if}
</header>

<style>
  .site-header {
    position: sticky;
    top: 0;
    z-index: 50;
    transition:
      background var(--duration-base) var(--ease-out),
      box-shadow var(--duration-base) var(--ease-out),
      border-color var(--duration-base) var(--ease-out);
    background: color-mix(in srgb, var(--color-bg) 78%, transparent);
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
    border-bottom: 1px solid transparent;
  }

  .site-header.scrolled {
    background: color-mix(in srgb, var(--color-surface) 92%, transparent);
    border-bottom-color: var(--color-border);
    box-shadow: var(--elevation-1);
  }

  .header-inner {
    max-width: var(--max-width);
    margin: 0 auto;
    padding: 12px var(--space-page-x);
    display: flex;
    align-items: center;
    gap: 10px;
    min-height: var(--header-height);
  }

  .brand {
    display: inline-flex;
    align-items: center;
    gap: 9px;
    min-width: 0;
    flex: 0 0 auto;
    max-width: 132px;
    font-weight: var(--font-weight-extrabold);
    letter-spacing: var(--tracking-tight);
    color: var(--color-text);
  }
  .brand-name {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    font-size: var(--text-md);
  }
  .company-logo {
    width: 30px;
    height: 30px;
    object-fit: contain;
    border-radius: var(--radius-sm);
    flex: 0 0 auto;
  }
  .brand-mark {
    width: 28px;
    height: 28px;
    display: grid;
    place-items: center;
    border-radius: var(--radius-sm);
    background: linear-gradient(145deg, var(--color-primary), var(--color-primary-2));
    position: relative;
    overflow: hidden;
    flex: 0 0 auto;
  }
  .brand-mark::before {
    content: '';
    width: 11px;
    height: 11px;
    border-radius: 50%;
    background: var(--color-accent);
    position: absolute;
    top: 2px;
    right: 2px;
  }
  .brand-mark span {
    width: 13px;
    height: 6px;
    border: 2.2px solid white;
    border-top: 0;
    border-radius: 0 0 8px 8px;
    position: relative;
    z-index: 1;
  }

  .desktop-nav {
    display: flex;
    flex: 1 1 auto;
    min-width: 0;
    align-items: center;
    justify-content: center;
    gap: 1px;
    flex-wrap: nowrap;
    overflow: hidden;
  }
  .desktop-nav a {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    padding: 7px 8px;
    border-radius: var(--radius-sm);
    font-size: 12.5px;
    font-weight: var(--font-weight-semibold);
    color: var(--color-muted);
    white-space: nowrap;
    flex: 0 0 auto;
    transition:
      color var(--duration-fast) var(--ease-out),
      background var(--duration-fast) var(--ease-out);
  }
  .desktop-nav .nav-icon {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 15px;
    height: 15px;
    line-height: 0;
    opacity: 0.85;
    flex-shrink: 0;
    overflow: visible;
    color: inherit;
  }
  .desktop-nav .nav-icon :global(svg) {
    display: block;
    width: 100%;
    height: 100%;
  }
  .desktop-nav a.active .nav-icon,
  .desktop-nav a:hover .nav-icon {
    opacity: 1;
  }
  .desktop-nav a:hover {
    color: var(--color-primary);
    background: var(--color-primary-soft);
  }
  .desktop-nav a.active {
    color: var(--color-primary);
    background: var(--color-primary-soft);
    font-weight: var(--font-weight-bold);
  }

  .header-actions {
    display: flex;
    align-items: center;
    gap: 7px;
    flex: 0 0 auto;
  }
  .theme-toggle,
  .menu-toggle {
    border: 1px solid var(--color-border);
    background: var(--color-surface);
    color: var(--color-text);
    width: 36px;
    height: 36px;
    border-radius: var(--radius-sm);
    display: inline-grid;
    place-items: center;
    flex: 0 0 auto;
    transition:
      border-color var(--duration-fast) var(--ease-out),
      color var(--duration-fast) var(--ease-out),
      background var(--duration-fast) var(--ease-out);
  }
  .theme-toggle:hover,
  .menu-toggle:hover {
    border-color: var(--color-primary);
    color: var(--color-primary);
    background: var(--color-primary-soft);
  }
  .menu-toggle {
    display: none;
  }

  .menu-backdrop {
    position: fixed;
    inset: 0;
    background: rgba(10, 18, 14, 0.28);
    z-index: 40;
    animation: fadeIn var(--duration-fast) var(--ease-out);
  }

  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }

  @media (max-width: 1180px) {
    .desktop-nav a {
      padding: 6px 6px;
      font-size: 12px;
      gap: 3px;
    }
    .header-inner {
      gap: 6px;
    }
    .brand {
      max-width: 118px;
    }
  }

  @media (max-width: 980px) {
    .desktop-nav {
      display: none;
      position: absolute;
      top: calc(100% + 6px);
      left: var(--space-page-x);
      right: var(--space-page-x);
      background: var(--color-surface);
      border: 1px solid var(--color-border);
      border-radius: var(--radius-lg);
      padding: 8px;
      flex-direction: column;
      align-items: stretch;
      justify-content: flex-start;
      flex-wrap: nowrap;
      overflow: visible;
      box-shadow: var(--elevation-4);
      z-index: 45;
      animation: slideDown var(--duration-base) var(--ease-out);
    }
    .desktop-nav.open {
      display: flex;
    }
    .desktop-nav a {
      padding: 12px 14px;
      font-size: var(--text-sm);
      border-radius: var(--radius-sm);
    }
    .menu-toggle {
      display: inline-grid;
      place-items: center;
    }
    .reserve {
      min-height: 36px;
      padding-inline: 12px;
    }

    @keyframes slideDown {
      from {
        opacity: 0;
        transform: translateY(-8px);
      }
      to {
        opacity: 1;
        transform: none;
      }
    }
  }

  @media (max-width: 520px) {
    .brand {
      gap: 7px;
      max-width: 104px;
    }
    .brand-mark,
    .company-logo {
      width: 28px;
      height: 28px;
    }
    .reserve {
      display: none;
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .site-header,
    .desktop-nav a,
    .theme-toggle,
    .menu-toggle {
      transition: none;
    }
    .menu-backdrop,
    .desktop-nav.open {
      animation: none;
    }
  }
</style>
