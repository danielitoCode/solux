<script lang="ts">
  import { page } from '$app/stores';
  import { goto } from '$app/navigation';
  import { logout, initAuth, getAuthUser } from '$features/auth/ui/stores/auth.store';
  import type { User, UserRole } from '$features/auth/domain/entities';
  import { onMount } from 'svelte';

  let { children, data } = $props();

  const isLogin = $derived($page.url.pathname === '/backoffice/login');

  const sections: { href: string; label: string; roles: UserRole[] }[] = [
    { href: '/backoffice', label: 'Dashboard', roles: ['admin', 'support', 'sales'] },
    { href: '/backoffice/reservas', label: 'Reservaciones', roles: ['admin', 'sales'] },
    { href: '/backoffice/soporte', label: 'Soporte', roles: ['admin', 'support'] },
    { href: '/backoffice/mensajes', label: 'Mensajes', roles: ['admin', 'support', 'sales'] },
    { href: '/backoffice/catalogo', label: 'Catálogo', roles: ['admin', 'sales'] },
    { href: '/backoffice/presentacion', label: 'Presentación', roles: ['admin'] },
    { href: '/backoffice/usuarios', label: 'Usuarios', roles: ['admin'] }
  ];

  const user = $derived((data.user as User | null) ?? getAuthUser());

  const visibleSections = $derived(
    user ? sections.filter((s) => s.roles.includes(user.role)) : []
  );

  onMount(() => {
    initAuth();
  });

  async function handleLogout() {
    await logout();
    goto('/backoffice/login');
  }

  function isActive(href: string) {
    const path = $page.url.pathname;
    if (href === '/backoffice') return path === '/backoffice';
    return path.startsWith(href);
  }
</script>

{#if isLogin}
  {@render children()}
{:else}
  <div class="bo-shell">
    <aside class="bo-sidebar">
      <div class="bo-brand">
        <span class="brand-mark"><span></span></span>
        <div>
          <strong>SOLUX</strong>
          <small>Backoffice</small>
        </div>
      </div>

      <nav class="bo-nav">
        {#each visibleSections as s}
          <a href={s.href} class:active={isActive(s.href)}>{s.label}</a>
        {/each}
      </nav>

      <div class="bo-user">
        {#if user}
          <div class="bo-user-info">
            <strong>{user.fullName}</strong>
            <span class="role-badge">{user.role}</span>
          </div>
          <button type="button" class="btn-logout" onclick={handleLogout}>Salir</button>
        {/if}
      </div>
    </aside>

    <div class="bo-main">
      {@render children()}
    </div>
  </div>
{/if}

<style>
  .bo-shell {
    display: grid;
    grid-template-columns: 240px 1fr;
    min-height: 100vh;
  }
  .bo-sidebar {
    background: var(--color-surface);
    border-right: 1px solid var(--color-border);
    display: flex;
    flex-direction: column;
    padding: 24px 16px;
    position: sticky;
    top: 0;
    height: 100vh;
  }
  .bo-brand {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 0 8px 20px;
    border-bottom: 1px solid var(--color-border);
    margin-bottom: 16px;
  }
  .bo-brand strong {
    display: block;
    font-size: 15px;
    letter-spacing: -0.03em;
  }
  .bo-brand small {
    color: var(--color-muted);
    font-size: 11px;
  }
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
    flex-shrink: 0;
  }
  .brand-mark::before {
    content: '';
    width: 14px;
    height: 14px;
    border-radius: 50%;
    background: var(--color-accent);
    position: absolute;
    top: 2px;
    right: 2px;
  }
  .brand-mark span {
    width: 16px;
    height: 8px;
    border: 3px solid white;
    border-top: 0;
    border-radius: 0 0 10px 10px;
    position: relative;
    z-index: 1;
  }
  .bo-nav {
    display: flex;
    flex-direction: column;
    gap: 4px;
    flex: 1;
  }
  .bo-nav a {
    padding: 10px 12px;
    border-radius: 10px;
    font-size: 13px;
    font-weight: 600;
    color: var(--color-muted);
    transition: 0.15s;
  }
  .bo-nav a:hover {
    background: var(--color-surface-2);
    color: var(--color-text);
  }
  .bo-nav a.active {
    background: color-mix(in srgb, var(--color-primary) 12%, transparent);
    color: var(--color-primary);
  }
  .bo-user {
    border-top: 1px solid var(--color-border);
    padding-top: 16px;
    display: flex;
    flex-direction: column;
    gap: 10px;
  }
  .bo-user-info {
    display: flex;
    flex-direction: column;
    gap: 4px;
    padding: 0 8px;
  }
  .bo-user-info strong {
    font-size: 13px;
  }
  .role-badge {
    display: inline-block;
    font-size: 10px;
    font-weight: 800;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    color: var(--color-primary);
    background: color-mix(in srgb, var(--color-primary) 12%, transparent);
    padding: 2px 8px;
    border-radius: 999px;
    width: fit-content;
  }
  .btn-logout {
    border: 1px solid var(--color-border);
    background: transparent;
    color: var(--color-muted);
    border-radius: 10px;
    padding: 8px 12px;
    font-size: 12px;
    font-weight: 700;
    text-align: left;
  }
  .btn-logout:hover {
    border-color: var(--color-primary);
    color: var(--color-primary);
  }
  .bo-main {
    min-width: 0;
  }
  @media (max-width: 800px) {
    .bo-shell {
      grid-template-columns: 1fr;
    }
    .bo-sidebar {
      position: static;
      height: auto;
      border-right: 0;
      border-bottom: 1px solid var(--color-border);
    }
    .bo-nav {
      flex-direction: row;
      flex-wrap: wrap;
    }
  }
</style>
