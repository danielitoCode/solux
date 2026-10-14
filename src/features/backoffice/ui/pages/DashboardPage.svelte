<script lang="ts">
  /**
   * Backoffice scaffold.
   * Roles: admin (full) · support (tickets + messages) · sales (reservations + catalog + messages)
   * Content managed via Supabase; this is the shell.
   */
  const sections = [
    { id: 'dashboard', label: 'Dashboard', roles: ['admin', 'support', 'sales'] },
    { id: 'reservations', label: 'Reservaciones', roles: ['admin', 'sales'] },
    { id: 'tickets', label: 'Soporte', roles: ['admin', 'support'] },
    { id: 'messages', label: 'Mensajes', roles: ['admin', 'support', 'sales'] },
    { id: 'catalog', label: 'Catálogo', roles: ['admin', 'sales'] },
    { id: 'presentation', label: 'Presentación', roles: ['admin'] },
    { id: 'users', label: 'Usuarios', roles: ['admin'] }
  ];
</script>

<section class="page backoffice">
  <div class="section-head">
    <div>
      <div class="eyebrow">Backoffice</div>
      <h2>Panel de gestión</h2>
    </div>
    <p>Gestión de reservaciones, soporte, catálogo y contenido público. Roles: admin · support · sales.</p>
  </div>

  <div class="grid grid-3">
    {#each sections as s}
      <article class="card">
        <h3>{s.label}</h3>
        <p>Roles: {s.roles.join(', ')}</p>
        <p class="muted">Conectar con Supabase + políticas RLS por rol.</p>
      </article>
    {/each}
  </div>
</section>

<style>
  .backoffice .muted {
    font-size: 12px;
    margin-top: 10px;
    color: var(--color-muted);
  }
</style>
