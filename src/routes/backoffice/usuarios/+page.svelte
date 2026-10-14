<script lang="ts">
  import { onMount } from 'svelte';
  import { supabase } from '$infrastructure/data/supabase-client';
  import { getAuthUser } from '$features/auth/ui/stores/auth.store.svelte';
  import type { UserRole } from '$features/auth/domain/entities';

  type Profile = { id: string; email: string; full_name: string; phone: string | null; role: UserRole; is_active: boolean; created_at: string; updated_at: string };
  const roleLabels: Record<UserRole, string> = { admin: 'Administrador', support: 'Soporte', sales: 'Ventas' };
  let users = $state<Profile[]>([]);
  let loading = $state(true);
  let saving = $state(false);
  let error = $state('');
  let success = $state('');
  let search = $state('');
  let roleFilter = $state('all');
  let statusFilter = $state('all');
  let editing = $state<Profile | null>(null);
  let fullName = $state('');
  let email = $state('');
  let phone = $state('');
  let role = $state<UserRole>('support');
  let isActive = $state(true);
  let showForm = $state(false);

  const currentUser = $derived(getAuthUser());
  const filteredUsers = $derived(users.filter((user) => {
    const term = search.trim().toLowerCase();
    const matchesSearch = !term || [user.full_name, user.email, user.phone ?? ''].some((value) => value.toLowerCase().includes(term));
    return matchesSearch && (roleFilter === 'all' || user.role === roleFilter) && (statusFilter === 'all' || (statusFilter === 'active' ? user.is_active : !user.is_active));
  }));
  const activeCount = $derived(users.filter((user) => user.is_active).length);

  onMount(loadUsers);

  async function loadUsers() {
    loading = true; error = '';
    try {
      const { data, error: queryError } = await supabase.from('profiles').select('*').order('created_at', { ascending: false });
      if (queryError) throw queryError;
      users = (data ?? []) as Profile[];
    } catch (e) {
      error = e instanceof Error ? e.message : 'No se pudieron cargar los usuarios.';
    } finally { loading = false; }
  }

  function openCreate() {
    editing = null; fullName = ''; email = ''; phone = ''; role = 'support'; isActive = true;
    error = ''; success = ''; showForm = true;
  }

  function openEdit(user: Profile) {
    editing = user; fullName = user.full_name; email = user.email; phone = user.phone ?? '';
    role = user.role; isActive = user.is_active; error = ''; success = ''; showForm = true;
  }

  function closeForm() { showForm = false; editing = null; }

  async function saveUser(event: SubmitEvent) {
    event.preventDefault(); saving = true; error = ''; success = '';
    try {
      if (!editing) {
        throw new Error('Para crear usuarios necesitas una Edge Function segura que cree la cuenta en Supabase Auth y su perfil. No se debe crear una cuenta escribiendo directamente en profiles.');
      }
      if (editing.id === currentUser?.id && (!isActive || role !== 'admin')) {
        throw new Error('No puedes desactivar tu propia cuenta ni quitarte el rol de administrador.');
      }
      const { error: updateError } = await supabase.from('profiles').update({
        full_name: fullName.trim(), phone: phone.trim() || null, role, is_active: isActive
      }).eq('id', editing.id);
      if (updateError) throw updateError;
      success = 'Usuario actualizado.';
      closeForm();
      await loadUsers();
    } catch (e) {
      error = e instanceof Error ? e.message : 'No se pudo guardar el usuario.';
    } finally { saving = false; }
  }

  async function toggleActive(user: Profile) {
    if (user.id === currentUser?.id) { error = 'No puedes desactivar tu propia cuenta.'; return; }
    const action = user.is_active ? 'desactivar' : 'activar';
    if (!confirm(`¿Confirmas ${action} a ${user.full_name}?`)) return;
    error = ''; success = '';
    try {
      const { error: updateError } = await supabase.from('profiles').update({ is_active: !user.is_active }).eq('id', user.id);
      if (updateError) throw updateError;
      success = user.is_active ? 'Usuario desactivado.' : 'Usuario activado.';
      await loadUsers();
    } catch (e) {
      error = e instanceof Error ? e.message : 'No se pudo cambiar el estado.';
    }
  }

  function date(value: string) {
    return new Intl.DateTimeFormat('es', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(value));
  }
</script>

<svelte:head><title>Usuarios | SOLUX Backoffice</title></svelte:head>

<section class="page">
  <div class="section-head">
    <div><div class="eyebrow">Administración</div><h2>Gestión de usuarios</h2></div>
    <p>Administra cuentas internas, roles y acceso al backoffice.</p>
  </div>

  <div class="stats">
    <article class="stat-card"><span>Usuarios registrados</span><strong>{users.length}</strong></article>
    <article class="stat-card"><span>Cuentas activas</span><strong>{activeCount}</strong></article>
    <article class="stat-card"><span>Administradores</span><strong>{users.filter((user) => user.role === 'admin' && user.is_active).length}</strong></article>
  </div>

  <div class="toolbar">
    <div class="search"><label for="user-search">Buscar</label><input id="user-search" bind:value={search} placeholder="Nombre, correo o teléfono" /></div>
    <div><label for="role-filter">Rol</label><select id="role-filter" bind:value={roleFilter}><option value="all">Todos los roles</option><option value="admin">Administrador</option><option value="support">Soporte</option><option value="sales">Ventas</option></select></div>
    <div><label for="status-filter">Estado</label><select id="status-filter" bind:value={statusFilter}><option value="all">Todos</option><option value="active">Activos</option><option value="inactive">Inactivos</option></select></div>
    <button class="btn btn-primary" type="button" onclick={openCreate}>Nuevo usuario</button>
  </div>

  {#if error}<p class="notice error" role="alert">{error}</p>{/if}
  {#if success}<p class="notice success" role="status">{success}</p>{/if}

  {#if showForm}
    <form class="card editor" onsubmit={saveUser}>
      <div class="editor-head"><div><h3>{editing ? 'Editar usuario' : 'Crear usuario'}</h3><p>{editing ? 'Actualiza perfil, rol y acceso.' : 'La creación de cuentas requiere el endpoint seguro de Supabase Auth.'}</p></div><button class="btn btn-ghost" type="button" onclick={closeForm}>Cancelar</button></div>
      {#if !editing}<p class="notice error">Alta de cuentas no disponible todavía: requiere una Edge Function con privilegios de servidor para crear usuario en Auth y su perfil. No se expondrán credenciales administrativas en el navegador.</p>{/if}
      <div class="form-grid">
        <div><label for="user-name">Nombre completo</label><input id="user-name" bind:value={fullName} required maxlength="120" /></div>
        <div><label for="user-email">Correo</label><input id="user-email" type="email" bind:value={email} required maxlength="254" disabled={!!editing} /></div>
        <div><label for="user-phone">Teléfono</label><input id="user-phone" bind:value={phone} maxlength="40" /></div>
        <div><label for="user-role">Rol</label><select id="user-role" bind:value={role}><option value="admin">Administrador</option><option value="support">Soporte</option><option value="sales">Ventas</option></select></div>
        <label class="active-toggle"><input type="checkbox" bind:checked={isActive} /> Cuenta activa</label>
      </div>
      <div class="editor-actions"><button class="btn btn-primary" type="submit" disabled={saving || !editing}>{saving ? 'Guardando…' : 'Guardar cambios'}</button></div>
    </form>
  {/if}

  <div class="card table-card">
    {#if loading}<p class="empty">Cargando usuarios…</p>
    {:else if filteredUsers.length === 0}<p class="empty">No hay usuarios que coincidan con los filtros.</p>
    {:else}
      <div class="table-wrap"><table><thead><tr><th>Usuario</th><th>Rol</th><th>Estado</th><th>Alta</th><th class="actions-head">Acciones</th></tr></thead>
      <tbody>{#each filteredUsers as user (user.id)}
        <tr>
          <td><div class="identity"><span class="avatar">{user.full_name.trim().charAt(0).toUpperCase() || '?'}</span><div><strong>{user.full_name}</strong><small>{user.email}</small>{#if user.phone}<small>{user.phone}</small>{/if}</div></div></td>
          <td><span class="role" class:admin={user.role === 'admin'}>{roleLabels[user.role]}</span></td>
          <td><span class="status" class:inactive={!user.is_active}><i></i>{user.is_active ? 'Activo' : 'Inactivo'}</span></td>
          <td>{date(user.created_at)}</td>
          <td><div class="actions"><button type="button" class="btn btn-ghost" onclick={() => openEdit(user)}>Editar</button><button type="button" class="btn btn-ghost" disabled={user.id === currentUser?.id} onclick={() => toggleActive(user)}>{user.is_active ? 'Desactivar' : 'Activar'}</button></div></td>
        </tr>
      {/each}</tbody></table></div>
    {/if}
    <div class="table-footer">Mostrando {filteredUsers.length} de {users.length} usuarios</div>
  </div>
</section>

<style>
.page{padding:clamp(20px,3vw,36px);max-width:1400px;margin:0 auto}.section-head{display:flex;align-items:end;justify-content:space-between;gap:24px;margin-bottom:24px}.section-head h2{margin:4px 0 0}.section-head p{color:var(--color-muted);max-width:380px;margin:0}.stats{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:14px;margin-bottom:20px}.stat-card{padding:18px 20px;background:var(--color-surface);border:1px solid var(--color-border);border-radius:16px;display:grid;gap:8px}.stat-card span{font-size:13px;color:var(--color-muted)}.stat-card strong{font-size:28px;letter-spacing:-.04em}.toolbar{display:flex;align-items:end;gap:12px;padding:16px;background:var(--color-surface);border:1px solid var(--color-border);border-radius:16px;margin-bottom:16px}.toolbar>div{display:grid;gap:6px;min-width:150px}.toolbar .search{flex:1;min-width:200px}.toolbar label,.form-grid label{font-size:12px;font-weight:700}.toolbar input,.toolbar select,.form-grid input:not([type=checkbox]),.form-grid select{width:100%;box-sizing:border-box;min-height:42px;padding:9px 11px;border:1px solid var(--color-border);border-radius:10px;background:var(--color-background,var(--color-surface));color:var(--color-text)}.toolbar button{min-height:42px;white-space:nowrap}.card{background:var(--color-surface);border:1px solid var(--color-border);border-radius:16px}.table-card{overflow:hidden}.table-wrap{overflow-x:auto}table{border-collapse:collapse;width:100%;text-align:left;font-size:13px}th{padding:13px 16px;background:var(--color-surface-2);font-size:11px;text-transform:uppercase;letter-spacing:.06em;color:var(--color-muted);font-weight:800}td{padding:14px 16px;border-top:1px solid var(--color-border);white-space:nowrap}tbody tr:hover{background:var(--color-surface-2)}.identity{display:flex;align-items:center;gap:11px;min-width:240px}.identity>div{display:grid;gap:3px}.identity strong{font-size:13px}.identity small{font-size:12px;color:var(--color-muted)}.avatar{width:38px;height:38px;display:grid;place-items:center;border-radius:12px;background:var(--color-surface-2);color:var(--color-primary);font-weight:800}.role,.status{display:inline-flex;align-items:center;gap:6px;border-radius:999px;padding:5px 9px;font-size:11px;font-weight:700;background:var(--color-surface-2)}.role.admin{color:var(--color-primary)}.status i{width:7px;height:7px;border-radius:50%;background:#16a34a}.status.inactive i{background:#9ca3af}.status.inactive{color:var(--color-muted)}.actions{display:flex;gap:6px}.actions-head{text-align:right}.actions .btn{padding:7px 10px;font-size:12px}.btn-ghost{border:1px solid var(--color-border);border-radius:9px;background:transparent;color:var(--color-text);padding:8px 11px;font-weight:600;cursor:pointer}.btn-ghost:hover:not(:disabled){border-color:var(--color-primary);color:var(--color-primary)}button:disabled{opacity:.45;cursor:not-allowed}.table-footer{padding:12px 16px;border-top:1px solid var(--color-border);font-size:12px;color:var(--color-muted)}.empty{padding:30px;text-align:center;color:var(--color-muted)}.notice{padding:12px 14px;border-radius:10px;font-size:13px;margin:12px 0}.notice.error{color:#b91c1c;background:color-mix(in srgb,#ef4444 9%,transparent)}.notice.success{color:#15803d;background:color-mix(in srgb,#22c55e 9%,transparent)}.editor{padding:20px;margin-bottom:16px}.editor-head{display:flex;align-items:start;justify-content:space-between;gap:16px;margin-bottom:18px}.editor-head h3{margin:0 0 5px}.editor-head p{margin:0;color:var(--color-muted);font-size:13px}.form-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:14px}.form-grid>div{display:grid;gap:6px}.active-toggle{display:flex;align-items:center;gap:8px}.editor-actions{display:flex;justify-content:flex-end;margin-top:18px}.btn-primary{cursor:pointer}@media(max-width:850px){.section-head{display:block}.section-head p{margin-top:8px}.toolbar{flex-wrap:wrap}.toolbar .search{flex-basis:100%}.toolbar>div{flex:1}.stats{gap:8px}.stat-card{padding:14px}.stat-card strong{font-size:23px}}@media(max-width:520px){.page{padding:16px}.stats{grid-template-columns:1fr}.toolbar>div{min-width:100%}.toolbar button{width:100%}.form-grid{grid-template-columns:1fr}.editor-head{align-items:start}.table-wrap table{min-width:760px}}
</style>
