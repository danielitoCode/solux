<script lang="ts">
  import type { User } from '$features/auth/domain/entities';

  let { data } = $props();
  const user = $derived(data.user as User);

  const cards = [
    {
      title: 'Reservaciones',
      desc: 'Gestionar visitas técnicas y estados.',
      href: '/backoffice/reservas',
      roles: ['admin', 'sales']
    },
    {
      title: 'Soporte',
      desc: 'Tickets y seguimiento técnico.',
      href: '/backoffice/soporte',
      roles: ['admin', 'support']
    },
    {
      title: 'Mensajes',
      desc: 'Consultas del formulario de contacto.',
      href: '/backoffice/mensajes',
      roles: ['admin', 'support', 'sales']
    },
    {
      title: 'Catálogo',
      desc: 'Productos y servicios de la carta.',
      href: '/backoffice/catalogo',
      roles: ['admin', 'sales']
    },
    {
      title: 'Presentación',
      desc: 'Textos, fotos y datos públicos.',
      href: '/backoffice/presentacion',
      roles: ['admin']
    },
    {
      title: 'Usuarios',
      desc: 'Staff y roles del sistema.',
      href: '/backoffice/usuarios',
      roles: ['admin']
    }
  ];

  const visible = $derived(cards.filter((c) => user && c.roles.includes(user.role)));
</script>

<section class="page">
  <div class="section-head">
    <div>
      <div class="eyebrow">Dashboard</div>
      <h2>Hola, {user?.fullName ?? 'staff'}</h2>
    </div>
    <p>Panel de gestión SOLUX. Solo ves lo que tu rol permite.</p>
  </div>

  <div class="grid grid-3">
    {#each visible as c}
      <a class="card dash-card" href={c.href}>
        <h3>{c.title}</h3>
        <p>{c.desc}</p>
        <span class="go">Abrir →</span>
      </a>
    {/each}
  </div>
</section>

<style>
  .dash-card {
    display: block;
    transition: transform 0.2s ease;
  }
  .dash-card:hover {
    transform: translateY(-4px);
  }
  .go {
    display: inline-block;
    margin-top: 16px;
    font-size: 12px;
    font-weight: 800;
    color: var(--color-primary);
  }
</style>
