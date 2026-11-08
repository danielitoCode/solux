<script lang="ts">
  import {
    listTeamMembersAdmin,
    createTeamMember,
    updateTeamMember,
    deleteTeamMember,
    type TeamMember
  } from '$infrastructure/data/team-members';
  import { isCloudinaryConfigured, uploadImageToCloudinary } from '$infrastructure/media/cloudinary';

  let members = $state<TeamMember[]>([]);
  let loading = $state(true);
  let saving = $state(false);
  let uploading = $state(false);
  let error = $state('');
  let success = $state('');

  let editingId = $state<string | null>(null);
  let fullName = $state('');
  let role = $state('');
  let photoUrl = $state('');
  let sortOrder = $state(0);
  let isActive = $state(true);

  const cloudReady = isCloudinaryConfigured();

  async function load() {
    loading = true;
    error = '';
    try {
      members = await listTeamMembersAdmin();
    } catch (e) {
      error = e instanceof Error ? e.message : 'No se pudo cargar el equipo.';
      members = [];
    } finally {
      loading = false;
    }
  }

  function resetForm() {
    editingId = null;
    fullName = '';
    role = '';
    photoUrl = '';
    sortOrder = members.length;
    isActive = true;
  }

  function startCreate() {
    success = '';
    error = '';
    resetForm();
    sortOrder = members.length;
  }

  function startEdit(m: TeamMember) {
    success = '';
    error = '';
    editingId = m.id;
    fullName = m.fullName;
    role = m.role;
    photoUrl = m.photoUrl;
    sortOrder = m.sortOrder;
    isActive = m.isActive;
  }

  async function onUpload(file?: File) {
    if (!file || uploading || saving) return;
    if (!cloudReady) {
      error = 'Configura Cloudinary para subir fotos.';
      return;
    }
    if (!file.type.startsWith('image/')) {
      error = 'Selecciona un archivo de imagen.';
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      error = 'La imagen supera el límite de 10 MB.';
      return;
    }
    uploading = true;
    error = '';
    try {
      const result = await uploadImageToCloudinary(file, 'solux/team');
      photoUrl = result.url;
      success = 'Foto subida. Recuerda guardar el miembro.';
    } catch (e) {
      error = e instanceof Error ? e.message : 'No se pudo subir la foto.';
    } finally {
      uploading = false;
    }
  }

  async function save() {
    if (saving || uploading) return;
    if (!fullName.trim()) {
      error = 'El nombre es obligatorio.';
      return;
    }
    saving = true;
    error = '';
    success = '';
    try {
      if (editingId) {
        await updateTeamMember(editingId, {
          fullName,
          role,
          photoUrl,
          sortOrder,
          isActive
        });
        success = 'Miembro actualizado.';
      } else {
        await createTeamMember({
          fullName,
          role,
          photoUrl,
          sortOrder,
          isActive
        });
        success = 'Miembro añadido. Aparecerá como nueva bolita en Nosotros.';
      }
      await load();
      resetForm();
    } catch (e) {
      error = e instanceof Error ? e.message : 'No se pudo guardar.';
    } finally {
      saving = false;
    }
  }

  async function remove(id: string) {
    if (saving) return;
    if (!confirm('¿Eliminar este miembro del equipo?')) return;
    saving = true;
    error = '';
    success = '';
    try {
      await deleteTeamMember(id);
      if (editingId === id) resetForm();
      await load();
      success = 'Miembro eliminado.';
    } catch (e) {
      error = e instanceof Error ? e.message : 'No se pudo eliminar.';
    } finally {
      saving = false;
    }
  }

  $effect(() => {
    void load();
  });
</script>

<section class="team-panel">
  <header class="editor-header">
    <div>
      <p class="eyebrow">Contenido público</p>
      <h2>Equipo</h2>
      <p class="hint">Fotos y datos visibles en /nosotros como bolitas de avatar.</p>
    </div>
    <button class="primary" type="button" onclick={startCreate} disabled={saving || uploading}>
      Nuevo miembro
    </button>
  </header>

  {#if error}<div class="notice error" role="alert">{error}</div>{/if}
  {#if success}<div class="notice success" role="status">{success}</div>{/if}

  {#if loading}
    <p>Cargando equipo…</p>
  {:else}
    <div class="layout">
      <div class="list panel">
        <h3>Miembros ({members.length})</h3>
        {#if !members.length}
          <p class="empty">Aún no hay miembros. Crea el primero.</p>
        {:else}
          <ul>
            {#each members as m (m.id)}
              <li class:active={editingId === m.id} class:inactive={!m.isActive}>
                <button type="button" class="row" onclick={() => startEdit(m)}>
                  <span class="av">
                    {#if m.photoUrl}
                      <img src={m.photoUrl} alt="" />
                    {:else}
                      <span>{m.fullName.slice(0, 1)}</span>
                    {/if}
                  </span>
                  <span class="meta">
                    <strong>{m.fullName}</strong>
                    <small>{m.role || 'Sin cargo'} · orden {m.sortOrder}</small>
                  </span>
                </button>
                <button type="button" class="danger" onclick={() => remove(m.id)} disabled={saving}
                  >Eliminar</button
                >
              </li>
            {/each}
          </ul>
        {/if}
      </div>

      <form
        class="panel form"
        onsubmit={(e) => {
          e.preventDefault();
          save();
        }}
      >
        <h3>{editingId ? 'Editar miembro' : 'Nuevo miembro'}</h3>

        <label
          >Nombre completo
          <input bind:value={fullName} required placeholder="Ej. Ana Pérez" />
        </label>
        <label
          >Cargo / rol
          <input bind:value={role} placeholder="Ej. Ingeniera eléctrica" />
        </label>
        <label
          >Orden
          <input type="number" bind:value={sortOrder} min="0" step="1" />
        </label>
        <label class="check">
          <input type="checkbox" bind:checked={isActive} />
          Visible en la web pública
        </label>

        <label
          >URL de foto
          <input type="url" bind:value={photoUrl} placeholder="https://…" />
        </label>

        {#if !cloudReady}
          <div class="notice error">
            Configura VITE_CLOUDINARY_CLOUD_NAME y VITE_CLOUDINARY_UPLOAD_PRESET para subir fotos.
          </div>
        {/if}

        <label class="upload-label">
          O subir foto
          <input
            class="file-input"
            type="file"
            accept="image/*"
            disabled={!cloudReady || uploading || saving}
            onchange={(e) => onUpload(e.currentTarget.files?.[0])}
          />
        </label>
        {#if uploading}<p class="upload-status">Subiendo foto…</p>{/if}
        {#if photoUrl}
          <img class="preview" src={photoUrl} alt="Vista previa" />
        {/if}

        <div class="actions">
          {#if editingId}
            <button type="button" class="ghost" onclick={resetForm} disabled={saving || uploading}
              >Cancelar</button
            >
          {/if}
          <button class="primary" type="submit" disabled={saving || uploading}>
            {saving ? 'Guardando…' : editingId ? 'Guardar cambios' : 'Añadir miembro'}
          </button>
        </div>
      </form>
    </div>
  {/if}
</section>

<style>
  .team-panel {
    height: 100%;
    overflow: auto;
    padding: 24px;
    color: var(--color-text);
  }
  .editor-header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 16px;
    margin-bottom: 18px;
  }
  .eyebrow {
    font-size: 11px;
    font-weight: 800;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    color: var(--color-primary);
    margin: 0;
  }
  h2 {
    font-size: 24px;
    margin: 5px 0;
  }
  h3 {
    font-size: 16px;
    margin: 0 0 14px;
  }
  .hint {
    font-size: 12px;
    color: var(--color-muted);
    margin: 0;
  }
  .layout {
    display: grid;
    grid-template-columns: minmax(240px, 0.9fr) minmax(280px, 1.1fr);
    gap: 16px;
    align-items: start;
  }
  .panel {
    background: var(--color-surface);
    border: 1px solid var(--color-border);
    border-radius: 16px;
    padding: 18px;
  }
  .list ul {
    list-style: none;
    margin: 0;
    padding: 0;
    display: grid;
    gap: 8px;
  }
  .list li {
    display: flex;
    align-items: center;
    gap: 8px;
    border: 1px solid var(--color-border);
    border-radius: 12px;
    padding: 6px;
  }
  .list li.active {
    border-color: var(--color-primary);
    background: color-mix(in srgb, var(--color-primary) 8%, transparent);
  }
  .list li.inactive {
    opacity: 0.65;
  }
  .row {
    flex: 1;
    display: flex;
    align-items: center;
    gap: 10px;
    border: 0;
    background: transparent;
    color: inherit;
    text-align: left;
    cursor: pointer;
    padding: 4px;
    min-width: 0;
  }
  .av {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    overflow: hidden;
    background: color-mix(in srgb, var(--color-primary) 12%, transparent);
    display: grid;
    place-items: center;
    font-weight: 800;
    color: var(--color-primary);
    flex-shrink: 0;
  }
  .av img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
  .meta {
    min-width: 0;
  }
  .meta strong,
  .meta small {
    display: block;
  }
  .meta small {
    color: var(--color-muted);
    font-size: 11px;
    margin-top: 2px;
  }
  .empty {
    color: var(--color-muted);
    font-size: 13px;
  }
  label {
    display: flex;
    flex-direction: column;
    gap: 7px;
    font-size: 12px;
    font-weight: 700;
    color: var(--color-muted);
    margin: 12px 0;
  }
  label.check {
    flex-direction: row;
    align-items: center;
    gap: 8px;
    font-weight: 600;
  }
  input[type='text'],
  input[type='url'],
  input[type='number'],
  input:not([type]) {
    width: 100%;
    box-sizing: border-box;
    border: 1px solid var(--color-border);
    border-radius: 9px;
    padding: 10px;
    background: var(--color-background);
    color: var(--color-text);
    font: inherit;
    font-size: 14px;
  }
  .file-input {
    padding: 8px;
  }
  .upload-status {
    font-size: 12px;
    color: var(--color-primary);
    margin: 4px 0;
  }
  .preview {
    display: block;
    width: 96px;
    height: 96px;
    object-fit: cover;
    border-radius: 50%;
    border: 2px solid var(--color-border);
    margin: 8px 0 12px;
  }
  .actions {
    display: flex;
    justify-content: flex-end;
    gap: 10px;
    padding-top: 8px;
  }
  .primary {
    background: var(--color-primary);
    color: white;
    border: 0;
    border-radius: 10px;
    padding: 11px 16px;
    font-weight: 800;
    cursor: pointer;
  }
  .primary:disabled {
    opacity: 0.6;
  }
  .ghost {
    background: transparent;
    border: 1px solid var(--color-border);
    border-radius: 10px;
    padding: 11px 14px;
    cursor: pointer;
    color: var(--color-text);
  }
  .danger {
    border: 0;
    background: transparent;
    color: #b91c1c;
    font-size: 12px;
    font-weight: 700;
    cursor: pointer;
    padding: 6px 8px;
  }
  .notice {
    padding: 12px;
    border-radius: 9px;
    margin: 12px 0;
    font-size: 13px;
  }
  .error {
    background: #fee2e2;
    color: #991b1b;
  }
  .success {
    background: #dcfce7;
    color: #166534;
  }
  @media (max-width: 800px) {
    .layout {
      grid-template-columns: 1fr;
    }
    .editor-header {
      flex-direction: column;
    }
  }
</style>
