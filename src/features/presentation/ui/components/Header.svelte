<script lang="ts">
  import { onMount } from 'svelte';
  import { page } from '$app/stores';
  import { publicContactUseCases } from '$features/contact/di/public-contact';

  let companyName = $state('SOLUX');
  let logoUrl = $state('');

  onMount(async () => {
    const data = await publicContactUseCases.getCompanyProfile.execute();
    if (data) { companyName = data.name || 'SOLUX'; logoUrl = data.logo_url || ''; }
  });

  const links = [
    { href: '/', label: 'Inicio', route: '/' },
    { href: '/servicios', label: 'Servicios', route: '/servicios' },
    { href: '/catalogo', label: 'Catálogo', route: '/catalogo' },
    { href: '/proyectos', label: 'Proyectos', route: '/proyectos' },
    { href: '/nosotros', label: 'Nosotros', route: '/nosotros' },
    { href: '/seguimiento', label: 'Seguimiento', route: '/seguimiento' },
    { href: '/soporte', label: 'Soporte', route: '/soporte' },
    { href: '/contacto', label: 'Contacto', route: '/contacto' }
  ];

  let menuOpen = $state(false);

  function toggleTheme() {
    const next = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
    document.documentElement.dataset.theme = next;
    localStorage.setItem('solux-theme', next);
  }

  function isActive(href: string) {
    const path = $page.url.pathname;
    return href === '/' ? path === '/' : path.startsWith(href);
  }
</script>

<header class="site-header">
  <a class="brand" href="/" aria-label="SOLUX inicio">
    {#if logoUrl}<img class="company-logo" src={logoUrl} alt={`Logo de ${companyName}`} />{:else}<span class="brand-mark"><span></span></span>{/if}
    <span>{companyName}</span>
  </a>

  <nav class="desktop-nav" class:open={menuOpen} aria-label="Navegación principal">
    {#each links as link}
      <a href={link.href} class:active={isActive(link.href)}>{link.label}</a>
    {/each}
  </nav>

  <div class="header-actions">
    <button class="theme-toggle" onclick={toggleTheme} aria-label="Cambiar tema">
      <span>☼</span>
    </button>
    <a class="btn btn-small btn-primary" href="/reservas">Reservar</a>
    <button class="menu-toggle" onclick={() => (menuOpen = !menuOpen)} aria-label="Abrir menú">
      ☰
    </button>
  </div>
</header>

<style>
  .site-header {
    max-width: var(--max-width);
    margin: 0 auto;
    padding: 18px 28px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
  }
  .brand {
    display: inline-flex;
    align-items: center;
    gap: 10px;
    font-weight: 800;
    letter-spacing: -0.03em;
    color: var(--color-text);
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
    border-radius: 9px;
    background: linear-gradient(145deg, var(--color-primary), var(--color-primary-2));
    position: relative;
    overflow: hidden;
    transform: rotate(-5deg);
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
  }
  .desktop-nav a {
    padding: 8px 12px;
    border-radius: 10px;
    font-size: 13px;
    font-weight: 600;
    color: var(--color-muted);
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
  }
  .theme-toggle,
  .menu-toggle {
    border: 1px solid var(--color-border);
    background: var(--color-surface);
    color: var(--color-text);
    width: 36px;
    height: 36px;
    border-radius: 10px;
  }
  .menu-toggle {
    display: none;
  }
  @media (max-width: 900px) {
    .desktop-nav {
      display: none;
      position: absolute;
      top: 64px;
      left: 16px;
      right: 16px;
      background: var(--color-surface);
      border: 1px solid var(--color-border);
      border-radius: 14px;
      padding: 10px;
      flex-direction: column;
      z-index: 20;
    }
    .desktop-nav.open {
      display: flex;
    }
    .menu-toggle {
      display: inline-grid;
      place-items: center;
    }
  }
</style>
