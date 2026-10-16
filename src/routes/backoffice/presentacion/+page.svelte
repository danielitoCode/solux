<script lang="ts">
  import { onMount } from 'svelte';
  import { supabase } from '$infrastructure/data/supabase-client';
  import ResizableSplit from '$infrastructure/ui/ResizableSplit.svelte';
  import { isCloudinaryConfigured, uploadImageToCloudinary } from '$infrastructure/media/cloudinary';

  type PageSlug = 'inicio' | 'servicios' | 'proyectos' | 'nosotros';
  type PageContent = {
    eyebrow: string;
    title: string;
    description: string;
    secondary_title: string;
    secondary_description: string;
    image_1: string;
    image_2: string;
    image_3: string;
    image_4: string;
  };
  type PageItem = { slug: PageSlug; label: string; description: string };
  const pages: PageItem[] = [
    { slug: 'inicio', label: 'Inicio', description: 'Portada y llamada a la acción' },
    { slug: 'servicios', label: 'Servicios', description: 'Presentación de servicios' },
    { slug: 'proyectos', label: 'Proyectos', description: 'Galería de proyectos' },
    { slug: 'nosotros', label: 'Nosotros', description: 'Identidad y valores' }
  ];
  const imageKey = (index: number): keyof PageContent => `image_${index}` as keyof PageContent;
  const emptyContent = (): PageContent => ({
    eyebrow: '', title: '', description: '', secondary_title: '', secondary_description: '',
    image_1: '', image_2: '', image_3: '', image_4: ''
  });

  let selectedSlug = $state<PageSlug>('inicio');
  let content = $state<PageContent>(emptyContent());
  let loading = $state(true);
  let saving = $state(false);
  let error = $state('');
  let success = $state('');
  let loaded = $state<Record<string, PageContent>>({});
  let uploadingImages = $state<Record<number, boolean>>({});

  async function selectPage(slug: PageSlug) {
    selectedSlug = slug;
    error = '';
    success = '';
    if (loaded[slug]) {
      content = { ...loaded[slug] };
      return;
    }
    loading = true;
    const { data, error: loadError } = await supabase.from('site_content').select('content').eq('page_slug', slug).maybeSingle();
    if (loadError) {
      error = loadError.message;
      content = emptyContent();
    } else {
      content = { ...emptyContent(), ...(data?.content ?? {}) };
      loaded[slug] = { ...content };
    }
    loading = false;
  }

  async function uploadImage(index: number, file?: File) {
    if (!file) return;
    error = '';
    success = '';
    if (!file.type.startsWith('image/')) {
      error = 'Selecciona un archivo de imagen.';
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      error = 'La imagen supera el límite de 10 MB.';
      return;
    }

    uploadingImages[index] = true;
    try {
      const result = await uploadImageToCloudinary(file, `solux/site-content/${selectedSlug}`);
      content[imageKey(index)] = result.url;
      success = `Imagen ${index} subida a Cloudinary. URL insertada automáticamente.`;
    } catch (e) {
      error = e instanceof Error ? e.message : 'No se pudo subir la imagen.';
    } finally {
      uploadingImages[index] = false;
    }
  }

  async function save() {
    saving = true;
    error = '';
    success = '';
    try {
      const { error: saveError } = await supabase.from('site_content').upsert({
        page_slug: selectedSlug,
        content,
        updated_at: new Date().toISOString()
      }, { onConflict: 'page_slug' });
      if (saveError) throw saveError;
      loaded[selectedSlug] = { ...content };
      success = `Vista "${pages.find(p => p.slug === selectedSlug)?.label}" guardada. La web pública cargará estos cambios.`;
    } catch (e) {
      error = e instanceof Error ? e.message : 'No se pudo guardar el contenido';
    } finally {
      saving = false;
    }
  }

  onMount(() => selectPage('inicio'));
</script>

<svelte:head><title>Presentación | SOLUX Backoffice</title></svelte:head>

<ResizableSplit storageKey="solux-bo-presentation-split" initialLeft={300} minLeft={240} maxLeft={420}>
  {#snippet left()}
    <section class="list-pane">
      <header class="pane-header">
        <p class="eyebrow">Backoffice</p>
        <h1>Presentación pública</h1>
        <p class="hint">Elige vista para editar textos e imágenes por URL.</p>
      </header>
      <nav class="page-list" aria-label="Vistas públicas">
        {#each pages as item}
          <button class:active={selectedSlug === item.slug} type="button" onclick={() => selectPage(item.slug)}>
            <strong>{item.label}</strong>
            <small>{item.description}</small>
          </button>
        {/each}
      </nav>
    </section>
  {/snippet}
  {#snippet right()}
    <section class="editor-pane">
      <header class="editor-header">
        <div>
          <p class="eyebrow">Contenido público</p>
          <h2>{pages.find(p => p.slug === selectedSlug)?.label}</h2>
        </div>
        <button class="primary" type="button" onclick={save} disabled={saving || loading}>{saving ? 'Guardando…' : 'Guardar cambios'}</button>
      </header>
      {#if error}<div class="notice error" role="alert">{error}</div>{/if}
      {#if success}<div class="notice success" role="status">{success}</div>{/if}
      {#if loading}
        <p>Cargando contenido…</p>
      {:else}
        <form onsubmit={(event) => { event.preventDefault(); save(); }}>
          <section class="panel">
            <h3>{selectedSlug === 'proyectos' ? 'Encabezado de proyectos' : 'Textos'}</h3>
            <label>Antetítulo<input bind:value={content.eyebrow} /></label>
            <label>Título principal<input bind:value={content.title} required /></label>
            <label>Descripción principal<textarea rows="4" bind:value={content.description}></textarea></label>
            {#if selectedSlug !== 'proyectos'}
              <label>Título secundario<input bind:value={content.secondary_title} /></label>
              <label>Descripción secundaria<textarea rows="4" bind:value={content.secondary_description}></textarea></label>
            {/if}
          </section>
          {#if selectedSlug !== 'proyectos'}
          <section class="panel">
            <h3>Imágenes</h3>
            {#if !isCloudinaryConfigured()}
              <div class="notice error">Configura VITE_CLOUDINARY_CLOUD_NAME y VITE_CLOUDINARY_UPLOAD_PRESET para habilitar subidas.</div>
            {/if}
            {#each [1, 2, 3, 4] as index}
              <div class="image-field">
                <label>Imagen {index}{#if index > 1}<small>Opcional; no todas las vistas usan las cuatro imágenes.</small>{/if}
                  <input type="url" placeholder="Pega URL https://…" bind:value={content[imageKey(index)]} />
                </label>
                <label class="upload-label">O subir archivo a Cloudinary
                  <input class="file-input" type="file" accept="image/*" disabled={!isCloudinaryConfigured() || uploadingImages[index]} onchange={(event) => uploadImage(index, event.currentTarget.files?.[0])} />
                </label>
                {#if uploadingImages[index]}<p class="upload-status">Subiendo imagen…</p>{/if}
                {#if content[`image_${index}` as keyof PageContent]}
                  <img class="preview" src={content[`image_${index}` as keyof PageContent]} alt={`Vista previa imagen ${index}`} />
                {/if}
              </div>
            {/each}
          </section>
          {/if}
          <div class="actions"><button class="primary" type="submit" disabled={saving}>{saving ? 'Guardando…' : 'Guardar cambios'}</button></div>
        </form>
      {/if}
    </section>
  {/snippet}
</ResizableSplit>

<style>
  .list-pane,.editor-pane{height:100%;overflow:auto;min-width:0;padding:24px;color:var(--color-text)}
  .pane-header{padding-bottom:18px;border-bottom:1px solid var(--color-border)}
  h1{font-size:22px;margin:5px 0 8px;letter-spacing:-.04em}.hint{font-size:12px;color:var(--color-muted)}
  .eyebrow{font-size:11px;font-weight:800;letter-spacing:.1em;text-transform:uppercase;color:var(--color-primary);margin:0}
  .page-list{display:flex;flex-direction:column;gap:8px;padding-top:14px}
  .page-list button{text-align:left;padding:14px;border:1px solid var(--color-border);border-radius:12px;background:transparent;color:var(--color-text);cursor:pointer}
  .page-list button.active{border-color:var(--color-primary);background:color-mix(in srgb,var(--color-primary) 10%,transparent)}
  .page-list strong,.page-list small{display:block}.page-list small{margin-top:5px;color:var(--color-muted);font-size:11px}
  .editor-header{display:flex;align-items:center;justify-content:space-between;gap:16px;margin-bottom:18px}
  h2{font-size:24px;margin:5px 0}h3{font-size:16px;margin:0 0 16px}
  .panel{background:var(--color-surface);border:1px solid var(--color-border);border-radius:16px;padding:20px;margin:14px 0}
  label{display:flex;flex-direction:column;gap:7px;font-size:12px;font-weight:700;color:var(--color-muted);margin:14px 0}
  input,textarea{width:100%;box-sizing:border-box;border:1px solid var(--color-border);border-radius:9px;padding:10px;background:var(--color-background);color:var(--color-text);font:inherit;font-size:14px}
  label small{font-weight:400}.image-field{border-top:1px solid var(--color-border);padding-top:8px;margin-top:16px}.upload-label{margin-top:0}.file-input{padding:8px}.upload-status{font-size:12px;color:var(--color-primary);margin:4px 0}.preview{display:block;width:min(100%,460px);max-height:220px;object-fit:contain;object-position:left;border:1px solid var(--color-border);border-radius:10px;margin:8px 0 18px;background:white}
  .primary{background:var(--color-primary);color:white;border:0;border-radius:10px;padding:11px 16px;font-weight:800;cursor:pointer;white-space:nowrap}.primary:disabled{opacity:.6}
  .notice{padding:12px;border-radius:9px;margin:12px 0;font-size:13px}.error{background:#fee2e2;color:#991b1b}.success{background:#dcfce7;color:#166534}
  .actions{display:flex;justify-content:flex-end;padding:10px 0 30px}
  @media(max-width:700px){.list-pane,.editor-pane{padding:16px}.editor-header{align-items:flex-start;flex-direction:column}}
</style>
