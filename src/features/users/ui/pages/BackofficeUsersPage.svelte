<script lang="ts">
  import { onMount } from 'svelte';
  import { getAuthUser } from '$features/auth/ui/stores/auth.store.svelte';
  import type { UserRole } from '$features/auth/domain/entities';
  import type { EditableUserPermission } from '../../domain/entities/feature-permission';
  import type { SaveUserPermissionInput } from '../../domain/repository/users-repository';
  import {
    getUsersState,
    loadUsers,
    loadUserPermissions,
    toggleUserActive,
    updateUser,
    saveUserPermissions
  } from '../stores/users.store.svelte';

  const viewState = getUsersState();
  const currentUser = $derived(getAuthUser());

  const roleLabels: Record<UserRole, string> = {
    admin: 'Administrador',
    support: 'Soporte',
    sales: 'Ventas'
  };

  let search = $state('');
  let roleFilter = $state('all');
  let statusFilter = $state('all');
  let editingId = $state('');
  let fullName = $state('');
  let phone = $state('');
  let role = $state<UserRole>('support');
  let isActive = $state(true);
  let showForm = $state(false);
  let creationNotice = $state('');
  let loadingPerms = $state(false);
  let permRows = $state<EditableUserPermission[]>([]);

  const filteredUsers = $derived(
    viewState.users.filter((user) => {
      const term = search.trim().toLowerCase();
      const matchesSearch =
        !term ||
        [user.fullName, user.email, user.phone ?? ''].some((value) =>
          value.toLowerCase().includes(term)
        );
      return (
        matchesSearch &&
        (roleFilter === 'all' || user.role === roleFilter) &&
        (statusFilter === 'all' || (statusFilter === 'active' ? user.isActive : !user.isActive))
      );
    })
  );

  const activeCount = $derived(viewState.users.filter((user) => user.isActive).length);
  const adminCount = $derived(
    viewState.users.filter((user) => user.role === 'admin' && user.isActive).length
  );

  onMount(loadUsers);

  function toLocalInput(iso: string | null): string {
    if (!iso) return '';
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return '';
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  }

  function fromLocalInput(local: string): string | null {
    if (!local.trim()) return null;
    const d = new Date(local);
    if (Number.isNaN(d.getTime())) return null;
    return d.toISOString();
  }

  async function openEdit(user: (typeof viewState.users)[number]) {
    editingId = user.id;
    fullName = user.fullName;
    phone = user.phone ?? '';
    role = user.role;
    isActive = user.isActive;
    showForm = true;
    creationNotice = '';
    loadingPerms = true;
    permRows = [];
    try {
      const grants = user.role === 'admin' ? [] : await loadUserPermissions(user.id);
      const byKey = new Map(grants.map((g) => [g.featureKey, g]));
      permRows = viewState.features.map((f) => {
        const g = byKey.get(f.key);
        return {
          featureKey: f.key,
          enabled: Boolean(g),
          canRead: g?.canRead ?? true,
          canWrite: g?.canWrite ?? false,
          expiresAtLocal: toLocalInput(g?.expiresAt ?? null)
        };
      });
    } catch {
      permRows = viewState.features.map((f) => ({
        featureKey: f.key,
        enabled: false,
        canRead: true,
        canWrite: false,
        expiresAtLocal: ''
      }));
    } finally {
      loadingPerms = false;
    }
  }

  function closeForm() {
    if (!viewState.saving) showForm = false;
  }

  function toggleEnabled(index: number, enabled: boolean) {
    const row = permRows[index];
    if (!row) return;
    permRows[index] = {
      ...row,
      enabled,
      canRead: enabled ? row.canRead || true : row.canRead,
      canWrite: enabled ? row.canWrite : false
    };
  }

  function setCanWrite(index: number, canWrite: boolean) {
    const row = permRows[index];
    if (!row) return;
    permRows[index] = {
      ...row,
      canWrite,
      canRead: canWrite ? true : row.canRead,
      enabled: canWrite ? true : row.enabled
    };
  }

  function setCanRead(index: number, canRead: boolean) {
    const row = permRows[index];
    if (!row) return;
    permRows[index] = {
      ...row,
      canRead,
      canWrite: canRead ? row.canWrite : false,
      enabled: canRead || row.canWrite ? true : row.enabled
    };
  }

  async function save(event: SubmitEvent) {
    event.preventDefault();
    const user = viewState.users.find((item) => item.id === editingId);
    if (!user || viewState.saving) return;

    if (user.id === currentUser?.id && (!isActive || role !== 'admin')) {
      creationNotice =
        'No puedes desactivar tu propia cuenta ni quitarte el rol de administrador.';
      return;
    }

    try {
      await updateUser(user.id, {
        fullName: fullName.trim(),
        phone: phone.trim() || null,
        role,
        isActive
      });

      // Admin no necesita grants (acceso total). Aun así limpiamos si se degradó de admin.
      if (role !== 'admin') {
        const grants: SaveUserPermissionInput[] = permRows
          .filter((r) => r.enabled && (r.canRead || r.canWrite))
          .map((r) => ({
            featureKey: r.featureKey,
            canRead: r.canRead || r.canWrite,
            canWrite: r.canWrite,
            expiresAt: fromLocalInput(r.expiresAtLocal)
          }));
        await saveUserPermissions(user.id, grants, currentUser?.id ?? null);
      } else {
        // Si es admin, revoca grants explícitos (opcional limpieza)
        await saveUserPermissions(user.id, [], currentUser?.id ?? null);
      }

      if (!viewState.error) showForm = false;
    } catch {
      /* error ya en store */
    }
  }

  async function toggle(user: (typeof viewState.users)[number]) {
    if (user.id === currentUser?.id) return;
    if (!confirm(`¿Confirmas ${user.isActive ? 'desactivar' : 'activar'} a ${user.fullName}?`))
      return;
    await toggleUserActive(user);
  }

  function date(value: string) {
    return new Intl.DateTimeFormat('es', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    }).format(new Date(value));
  }

  function featureLabel(key: string) {
    return viewState.features.find((f) => f.key === key)?.label ?? key;
  }

  function featureDescription(key: string) {
    return viewState.features.find((f) => f.key === key)?.description ?? '';
  }
</script>

<svelte:head><title>Usuarios | SOLUX Backoffice</title></svelte:head>

<section class="page">
  <div class="section-head">
    <div>
      <div class="eyebrow">Administración</div>
      <h2>Gestión de usuarios</h2>
    </div>
    <p>Administra cuentas internas, roles y permisos por módulo.</p>
  </div>

  <div class="stats">
    <article>
      <span>Usuarios registrados</span>
      <strong>{viewState.users.length}</strong>
    </article>
    <article>
      <span>Cuentas activas</span>
      <strong>{activeCount}</strong>
    </article>
    <article>
      <span>Administradores</span>
      <strong>{adminCount}</strong>
    </article>
  </div>

  <div class="toolbar">
    <div class="search">
      <label>Buscar</label>
      <input bind:value={search} placeholder="Nombre, correo o teléfono" />
    </div>
    <div>
      <label>Rol</label>
      <select bind:value={roleFilter}>
        <option value="all">Todos los roles</option>
        <option value="admin">Administrador</option>
        <option value="support">Soporte</option>
        <option value="sales">Ventas</option>
      </select>
    </div>
    <div>
      <label>Estado</label>
      <select bind:value={statusFilter}>
        <option value="all">Todos</option>
        <option value="active">Activos</option>
        <option value="inactive">Inactivos</option>
      </select>
    </div>
    <button
      type="button"
      onclick={() =>
        (creationNotice =
          'La creación de cuentas requiere Edge Function segura de Supabase Auth.')}
      disabled={viewState.saving}>Nuevo usuario</button
    >
  </div>

  {#if viewState.error}<p class="notice error" role="alert">{viewState.error}</p>{/if}
  {#if creationNotice}<p class="notice error" role="alert">{creationNotice}</p>{/if}
  {#if viewState.success}<p class="notice success" role="status">{viewState.success}</p>{/if}

  {#if showForm}
    <form class="card editor" onsubmit={save}>
      <div class="editor-head">
        <div>
          <h3>Editar usuario</h3>
          <p>Perfil, rol y permisos por módulo.</p>
        </div>
        <button type="button" onclick={closeForm} disabled={viewState.saving}>Cancelar</button>
      </div>

      <div class="form-grid">
        <div>
          <label>Nombre completo</label>
          <input bind:value={fullName} required maxlength="120" />
        </div>
        <div>
          <label>Correo</label>
          <input value={viewState.users.find((u) => u.id === editingId)?.email ?? ''} disabled />
        </div>
        <div>
          <label>Teléfono</label>
          <input bind:value={phone} maxlength="40" />
        </div>
        <div>
          <label>Rol</label>
          <select bind:value={role}>
            <option value="admin">Administrador</option>
            <option value="support">Soporte</option>
            <option value="sales">Ventas</option>
          </select>
        </div>
        <label class="active-toggle">
          <input type="checkbox" bind:checked={isActive} />
          Cuenta activa
        </label>
      </div>

      <div class="perms">
        <div class="perms-head">
          <h4>Permisos por módulo</h4>
          {#if role === 'admin'}
            <p class="hint">Los administradores tienen acceso total. No necesitan grants individuales.</p>
          {:else}
            <p class="hint">
              Activa módulos y, si quieres, una fecha de caducidad. Sin fecha = indefinido.
            </p>
          {/if}
        </div>

        {#if role === 'admin'}
          <p class="empty-inline">Acceso completo por rol administrador.</p>
        {:else if loadingPerms}
          <p class="empty-inline">Cargando permisos…</p>
        {:else if !permRows.length}
          <p class="empty-inline">
            No hay catálogo de módulos. Verifica que la migración 025 esté aplicada.
          </p>
        {:else}
          <div class="perm-table">
            <div class="perm-row head">
              <span>Módulo</span>
              <span>Activo</span>
              <span>Lectura</span>
              <span>Escritura</span>
              <span>Caduca</span>
            </div>
            {#each permRows as row, i (row.featureKey)}
              <div class="perm-row" class:on={row.enabled}>
                <div class="mod">
                  <strong>{featureLabel(row.featureKey)}</strong>
                  <small>{featureDescription(row.featureKey)}</small>
                </div>
                <label class="check">
                  <input
                    type="checkbox"
                    checked={row.enabled}
                    onchange={(e) => toggleEnabled(i, e.currentTarget.checked)}
                  />
                </label>
                <label class="check">
                  <input
                    type="checkbox"
                    checked={row.canRead}
                    disabled={!row.enabled}
                    onchange={(e) => setCanRead(i, e.currentTarget.checked)}
                  />
                </label>
                <label class="check">
                  <input
                    type="checkbox"
                    checked={row.canWrite}
                    disabled={!row.enabled}
                    onchange={(e) => setCanWrite(i, e.currentTarget.checked)}
                  />
                </label>
                <input
                  type="datetime-local"
                  value={row.expiresAtLocal}
                  disabled={!row.enabled}
                  oninput={(e) => {
                    permRows[i] = { ...row, expiresAtLocal: e.currentTarget.value };
                  }}
                />
              </div>
            {/each}
          </div>
        {/if}
      </div>

      <div class="editor-actions">
        <button type="submit" disabled={viewState.saving || loadingPerms}>
          {viewState.saving ? 'Guardando…' : 'Guardar cambios'}
        </button>
      </div>
    </form>
  {/if}

  <div class="card table-card">
    {#if viewState.loading}
      <p class="empty">Cargando usuarios…</p>
    {:else if filteredUsers.length === 0}
      <p class="empty">No hay usuarios que coincidan con los filtros.</p>
    {:else}
      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Usuario</th>
              <th>Rol</th>
              <th>Estado</th>
              <th>Alta</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {#each filteredUsers as user (user.id)}
              <tr>
                <td>
                  <div class="identity">
                    <span class="avatar">{user.fullName.trim().charAt(0).toUpperCase() || '?'}</span>
                    <div>
                      <strong>{user.fullName}</strong>
                      <small>{user.email}</small>
                      {#if user.phone}<small>{user.phone}</small>{/if}
                    </div>
                  </div>
                </td>
                <td><span class="role">{roleLabels[user.role]}</span></td>
                <td><span class="status">{user.isActive ? 'Activo' : 'Inactivo'}</span></td>
                <td>{date(user.createdAt)}</td>
                <td>
                  <div class="actions">
                    <button
                      type="button"
                      onclick={() => openEdit(user)}
                      disabled={viewState.saving || viewState.updatingUsers.includes(user.id)}
                      >Editar</button
                    >
                    <button
                      type="button"
                      disabled={user.id === currentUser?.id ||
                        viewState.saving ||
                        viewState.updatingUsers.includes(user.id)}
                      onclick={() => toggle(user)}
                      >{user.isActive ? 'Desactivar' : 'Activar'}</button
                    >
                  </div>
                </td>
              </tr>
            {/each}
          </tbody>
        </table>
      </div>
    {/if}
    <div class="table-footer">
      Mostrando {filteredUsers.length} de {viewState.users.length} usuarios
    </div>
  </div>
</section>

<style>
  .page {
    padding: clamp(20px, 3vw, 36px);
    max-width: 1400px;
    margin: 0 auto;
  }
  .section-head {
    display: flex;
    align-items: end;
    justify-content: space-between;
    gap: 24px;
    margin-bottom: 24px;
  }
  .section-head h2 {
    margin: 4px 0;
  }
  .section-head p {
    color: var(--color-muted);
    max-width: 380px;
  }
  .eyebrow {
    font-size: 11px;
    font-weight: 800;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    color: var(--color-primary);
  }
  .stats {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 14px;
    margin-bottom: 20px;
  }
  .stats article,
  .card {
    background: var(--color-surface);
    border: 1px solid var(--color-border);
    border-radius: 16px;
  }
  .stats article {
    padding: 18px;
    display: grid;
    gap: 8px;
  }
  .stats span {
    font-size: 13px;
    color: var(--color-muted);
  }
  .stats strong {
    font-size: 28px;
  }
  .toolbar {
    display: flex;
    align-items: end;
    gap: 12px;
    padding: 16px;
    background: var(--color-surface);
    border: 1px solid var(--color-border);
    border-radius: 16px;
    margin-bottom: 16px;
  }
  .toolbar > div {
    display: grid;
    gap: 6px;
    min-width: 150px;
  }
  .toolbar .search {
    flex: 1;
  }
  .toolbar input,
  .toolbar select,
  input,
  select {
    width: 100%;
    box-sizing: border-box;
    min-height: 42px;
    padding: 9px 11px;
    border: 1px solid var(--color-border);
    border-radius: 10px;
    background: var(--color-background);
    color: var(--color-text);
    font: inherit;
  }
  button {
    border: 1px solid var(--color-border);
    border-radius: 9px;
    background: transparent;
    color: var(--color-text);
    padding: 9px 11px;
    font-weight: 600;
    cursor: pointer;
  }
  button:disabled {
    opacity: 0.45;
    cursor: not-allowed;
  }
  .table-card {
    overflow: hidden;
  }
  .table-wrap {
    overflow-x: auto;
  }
  table {
    border-collapse: collapse;
    width: 100%;
    text-align: left;
    font-size: 13px;
  }
  th {
    padding: 13px 16px;
    background: var(--color-surface-2);
    font-size: 11px;
    color: var(--color-muted);
  }
  td {
    padding: 14px 16px;
    border-top: 1px solid var(--color-border);
  }
  .identity {
    display: flex;
    align-items: center;
    gap: 11px;
  }
  .identity > div {
    display: grid;
    gap: 3px;
  }
  .identity small {
    font-size: 12px;
    color: var(--color-muted);
  }
  .avatar {
    width: 38px;
    height: 38px;
    display: grid;
    place-items: center;
    border-radius: 12px;
    background: var(--color-surface-2);
    color: var(--color-primary);
    font-weight: 800;
  }
  .role,
  .status {
    display: inline-flex;
    border-radius: 999px;
    padding: 5px 9px;
    font-size: 11px;
    font-weight: 700;
    background: var(--color-surface-2);
  }
  .actions {
    display: flex;
    gap: 6px;
  }
  .table-footer {
    padding: 12px 16px;
    border-top: 1px solid var(--color-border);
    font-size: 12px;
    color: var(--color-muted);
  }
  .empty {
    padding: 30px;
    text-align: center;
    color: var(--color-muted);
  }
  .empty-inline {
    margin: 0;
    padding: 12px 0;
    color: var(--color-muted);
    font-size: 13px;
  }
  .notice {
    padding: 12px 14px;
    border-radius: 10px;
    font-size: 13px;
    margin: 12px 0;
  }
  .notice.error {
    color: #b91c1c;
    background: #fee2e2;
  }
  .notice.success {
    color: #15803d;
    background: #dcfce7;
  }
  .editor {
    padding: 20px;
    margin-bottom: 16px;
  }
  .editor-head {
    display: flex;
    justify-content: space-between;
    gap: 16px;
    margin-bottom: 18px;
  }
  .form-grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 14px;
  }
  .form-grid > div {
    display: grid;
    gap: 6px;
  }
  .active-toggle {
    display: flex;
    align-items: center;
    gap: 8px;
  }
  .perms {
    margin-top: 22px;
    padding-top: 18px;
    border-top: 1px solid var(--color-border);
  }
  .perms-head h4 {
    margin: 0 0 4px;
    font-size: 15px;
  }
  .hint {
    margin: 0 0 14px;
    font-size: 12px;
    color: var(--color-muted);
  }
  .perm-table {
    display: grid;
    gap: 6px;
  }
  .perm-row {
    display: grid;
    grid-template-columns: minmax(160px, 1.4fr) 70px 70px 80px minmax(160px, 1fr);
    gap: 10px;
    align-items: center;
    padding: 10px 12px;
    border: 1px solid var(--color-border);
    border-radius: 12px;
    background: var(--color-background);
  }
  .perm-row.head {
    background: transparent;
    border: 0;
    padding: 0 12px 4px;
    font-size: 11px;
    font-weight: 700;
    color: var(--color-muted);
    text-transform: uppercase;
    letter-spacing: 0.04em;
  }
  .perm-row.on {
    border-color: color-mix(in srgb, var(--color-primary) 35%, var(--color-border));
    background: color-mix(in srgb, var(--color-primary) 6%, var(--color-background));
  }
  .mod {
    display: grid;
    gap: 2px;
    min-width: 0;
  }
  .mod strong {
    font-size: 13px;
  }
  .mod small {
    font-size: 11px;
    color: var(--color-muted);
  }
  .check {
    display: flex;
    justify-content: center;
  }
  .editor-actions {
    display: flex;
    justify-content: flex-end;
    margin-top: 18px;
  }
  @media (max-width: 900px) {
    .perm-row,
    .perm-row.head {
      grid-template-columns: 1fr 1fr;
    }
    .perm-row.head {
      display: none;
    }
  }
  @media (max-width: 850px) {
    .section-head {
      display: block;
    }
    .toolbar {
      flex-wrap: wrap;
    }
    .toolbar .search {
      flex-basis: 100%;
    }
    .stats {
      gap: 8px;
    }
  }
  @media (max-width: 520px) {
    .stats,
    .form-grid {
      grid-template-columns: 1fr;
    }
  }
</style>
