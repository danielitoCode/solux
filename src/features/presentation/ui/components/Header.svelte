<script lang="ts">
  import { onMount } from 'svelte';
  import { page } from '$app/stores';
  import { supabase } from '$infrastructure/data/supabase-client';

  let companyName = $state('SOLUX');
  let logoUrl = $state('');

  onMount(async () => {
    const { data } = await supabase.from('company_profile').select('name, logo_url').limit(1).maybeSingle();
    if (data) { companyName = data.name || 'SOLUX'; logoUrl = data.logo_url || ''; }
  });

  const links = [
    { href: '/', label: 'Inicio', route: '/' },
    { href: '/servicios', label: 'Servicios', route: '/servicios' },
    { href: '/catalogo', label: 'Catálogo', route: '/catalogo' },
    { href: '/proyectos', label: 'Proyectos', route: '/proyectos' },
    { href: '/nosotros', label: 'Nosotros', route: '/nosotros' },
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
    position: sticky;
    top: 0;
    z-index: 50;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 28px;
    height: var(--header-height);
    padding: 0 5vw;
    background: color-mix(in srgb, var(--color-bg) 84%, transparent);
    backdrop-filter: blur(18px);
    border-bottom: 1px solid color-mix(in srgb, var(--color-border) 75%, transparent);
  }
  .brand {
    display: inline-flex;
    align-items: center;
    gap: 10px;
    font-weight: 800;
    letter-spacing: -0.04em;
  }
  .company-logo { width: 38px; height: 38px; object-fit: contain; border-radius: 8px; }
  .brand-mark {
    width: 32px;
    height: 32px;
    display: grid;
    place-items: center;
    border-radius: 10px;
    background: linear-gradient(145deg, var(--color-primary), var(--color-primary-2));
    position: relative;
    overflow: hidden;
    transform: rotate(-5deg);
  }
  .brand-mark::before {
    content: '';
    width: 16px;
    height: 16px;
    border-radius: 50%;
    background: var(--color-accent);
    position: absolute;
    top: 3px;
    right: 2px;
  }
  .brand-mark span {
    width: 18px;
    height: 9px;
    border: 4px solid white;
    border-top: 0;
    border-radius: 0 0 12px 12px;
    position: relative;
    z-index: 1;
  }
  .desktop-nav {
    display: flex;
    gap: 28px;
    font-size: 13px;
    font-weight: 600;
    color: var(--color-muted);
  }
  .desktop-nav a {
    transition:
      color 0.2s ease,
      transform 0.2s ease;
  }
  .desktop-nav a:hover,
  .desktop-nav a.active {
    color: var(--color-primary);
    transform: translateY(-1px);
  }
  .header-actions {
    display: flex;
    align-items: center;
    gap: 10px;
  }
  .theme-toggle,
  .menu-toggle {
    border: 1px solid var(--color-border);
    background: var(--color-surface);
    color: var(--color-text);
    border-radius: var(--radius-sm);
    width: 40px;
    height: 40px;
  }
  .menu-toggle {
    display: none;
  }

  @media (max-width: 900px) {
    .desktop-nav {
      display: none;
    }
    .desktop-nav.open {
      display: flex;
      position: absolute;
      top: 74px;
      left: 0;
      right: 0;
      padding: 18px;
      background: var(--color-surface);
      flex-direction: column;
      border-bottom: 1px solid var(--color-border);
    }
    .menu-toggle {
      display: block;
    }
  }
  @media (max-width: 600px) {
    .site-header {
      padding: 0 18px;
    }
    .header-actions .btn {
      display: none;
    }
  }
</style>
