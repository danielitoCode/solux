<script lang="ts">
import { onMount } from 'svelte';
import { isCloudinaryConfigured, uploadImageToCloudinary } from '$infrastructure/media/cloudinary';
import type { Project, ProjectInput, ProjectLayout } from '$features/projects/domain/entities/project';
import { getProjectsState, loadProjects, removeProject, saveProject } from '$features/projects/ui/stores/projects.store.svelte';

type LayoutOption = { value: ProjectLayout; label: string; description: string };
const layouts: LayoutOption[] = [
 {value:'hero-left',label:'Portada + galería lateral',description:'Imagen protagonista y detalles en columna.'},
 {value:'editorial',label:'Editorial',description:'Ficha técnica y fotografía grande.'},
 {value:'gallery-grid',label:'Galería mosaico',description:'Fotografías en mosaico y ficha debajo.'},
 {value:'technical-report',label:'Ficha técnica',description:'Datos de instalación y galería compacta.'}
];
const blank = (): ProjectInput => ({title:'',slug:'',location:'',category:'Instalación solar',systemName:'Kit solar híbrido',capacityKw:3,inverter:'',panels:'',battery:'',description:'',specifications:[{label:'Inversor',value:''},{label:'Paneles',value:''},{label:'Respaldo',value:''}],gallery:[],layout:'hero-left',isPublished:false,sortOrder:0});
let viewState = getProjectsState();
let form = $state<ProjectInput>(blank());
let selectedId = $state('');
let uploading = $state(false);
let localError = $state('');
let localNotice = $state('');
let fileInput = $state<HTMLInputElement>();

function edit(project: Project) { form = {...project, specifications:[...project.specifications], gallery:[...project.gallery]}; selectedId = project.id; localError = ''; localNotice = ''; }
function newProject() { form = blank(); selectedId = ''; localError = ''; localNotice = ''; }
function slugify(value: string) { return value.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().trim().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,''); }
function titleChanged(value: string) { form.title = value; if (!selectedId) form.slug = slugify(value); }
function addSpec() { form.specifications = [...form.specifications, {label:'',value:''}]; }
function removeSpec(index: number) { form.specifications = form.specifications.filter((_, n) => n !== index); }
async function uploadFiles(files: FileList | null) {
 if (!files?.length) return;
 if (!isCloudinaryConfigured()) { localError = 'Configura VITE_CLOUDINARY_CLOUD_NAME y VITE_CLOUDINARY_UPLOAD_PRESET.'; return; }
 uploading = true; localError = ''; localNotice = '';
 try {
  for (const file of Array.from(files)) {
   if (!file.type.startsWith('image/')) throw new Error('Selecciona archivos de imagen.');
   if (file.size > 10 * 1024 * 1024) throw new Error(`La imagen "${file.name}" supera 10 MB.`);
   const uploaded = await uploadImageToCloudinary(file, 'solux/projects');
   form.gallery = [...form.gallery, uploaded.url];
  }
  localNotice = 'Fotos subidas a Cloudinary y añadidas a la galería.';
 } catch (e) { localError = e instanceof Error ? e.message : 'Error al subir fotografías.'; }
 finally { uploading = false; if (fileInput) fileInput.value = ''; }
}
async function save() {
 const title = form.title.trim(); const slug = (form.slug || slugify(title)).trim(); const capacity = form.capacityKw === null ? null : Number(form.capacityKw); const order = Number(form.sortOrder);
 if (!title) { localError = 'El título es obligatorio.'; return; }
 if (!slug || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) { localError = 'El slug debe contener letras minúsculas, números y guiones.'; return; }
 if (capacity !== null && (!Number.isFinite(capacity) || capacity < 0)) { localError = 'La potencia debe ser un número no negativo.'; return; }
 if (!Number.isFinite(order)) { localError = 'El orden debe ser numérico.'; return; }
 localError = ''; localNotice = '';
 const saved = await saveProject(selectedId || null, {...form,title,slug,capacityKw:capacity,sortOrder:order,specifications:form.specifications.filter((spec) => spec.label.trim() && spec.value.trim())});
 if (saved) { selectedId = saved.id; edit(saved); }
}
async function deleteSelected() {
 if (!selectedId || viewState.saving || uploading || !confirm(`¿Eliminar el proyecto "${form.title}"?`)) return;
 const removed = await removeProject(selectedId);
 if (removed) newProject();
}
onMount(loadProjects);
</script>
<svelte:head><title>Proyectos | SOLUX Backoffice</title></svelte:head>
<div class="workspace">
<aside class="project-list"><header><p class="eyebrow">Contenido público</p><h1>Proyectos</h1><p>Instalaciones reales con ficha técnica, fotografías y diseño propio.</p></header><button class="primary full" onclick={newProject} disabled={viewState.saving||uploading}>+ Nuevo proyecto</button>
{#if viewState.loading}<p>Cargando…</p>{:else if !viewState.projects.length}<p class="muted">Todavía no hay proyectos.</p>{/if}
{#each viewState.projects as project (project.id)}<button class:chosen={selectedId===project.id} class="project-option" onclick={()=>edit(project)} disabled={viewState.saving||uploading}><strong>{project.title}</strong><small>{project.capacityKw??'—'} kW · {project.location||project.category}</small><span class:published={project.isPublished} class="status">{project.isPublished?'Publicado':'Borrador'}</span></button>{/each}
</aside>
<main class="editor">
<header class="editor-head"><div><p class="eyebrow">{selectedId?'Editar instalación':'Nueva instalación'}</p><h2>{form.title||'Proyecto sin título'}</h2></div><button class="primary" onclick={save} disabled={viewState.saving||uploading}>{viewState.saving?'Guardando…':'Guardar proyecto'}</button></header>
{#if localError||viewState.error}<p class="message error" role="alert">{localError||viewState.error}</p>{/if}{#if localNotice||viewState.notice}<p class="message success" role="status">{localNotice||viewState.notice}</p>{/if}
<section class="panel"><h3>Identificación del proyecto</h3><div class="fields">
<label>Título<input value={form.title} oninput={e=>titleChanged(e.currentTarget.value)} placeholder="Instalación de Kit Solar 3 kW con Sumry" required /></label>
<label>Slug<input bind:value={form.slug} placeholder="kit-solar-3kw-sumry" /></label>
<label>Ubicación<input bind:value={form.location} placeholder="Ciudad, provincia" /></label>
<label>Tipo de instalación<input bind:value={form.category} placeholder="Residencial, comercial…" /></label>
<label>Sistema / modelo<input bind:value={form.systemName} placeholder="Kit solar híbrido Sumry" /></label>
<label>Potencia instalada (kW)<input type="number" min="0" step="0.1" bind:value={form.capacityKw} /></label>
<label>Inversor<input bind:value={form.inverter} placeholder="Marca y modelo" /></label>
<label>Paneles<input bind:value={form.panels} placeholder="Cantidad, potencia y modelo" /></label>
<label>Batería / respaldo<input bind:value={form.battery} placeholder="Tecnología y capacidad" /></label>
<label>Orden<input type="number" bind:value={form.sortOrder} /></label></div>
<label>Descripción técnica y alcance<textarea rows="5" bind:value={form.description} placeholder="Necesidad, solución instalada, protecciones, puesta en marcha y resultado…"></textarea></label>
<label class="check"><input type="checkbox" bind:checked={form.isPublished}/> Publicar en la web</label></section>
<section class="panel"><h3>Disposición visual por proyecto</h3><div class="layouts">{#each layouts as item}<label class:active={form.layout===item.value} class="layout-option"><input type="radio" name="layout" value={item.value} bind:group={form.layout}/><strong>{item.label}</strong><small>{item.description}</small><div class="layout-mini" class:editorial={item.value==='editorial'} class:mosaic={item.value==='gallery-grid'} class:technical={item.value==='technical-report'}><i></i><i></i><i></i><i></i></div></label>{/each}</div></section>
<section class="panel"><h3>Galería fotográfica</h3><label class="upload-zone">Subir fotos a Cloudinary<input bind:this={fileInput} type="file" accept="image/*" multiple onchange={e=>uploadFiles(e.currentTarget.files)} disabled={uploading||viewState.saving}/><small>{uploading?'Subiendo…':'Varias imágenes, máximo 10 MB cada una.'}</small></label>
{#each form.gallery as url,i}<div class="gallery-row"><img src={url} alt={`Foto ${i+1}`}/><input type="url" bind:value={form.gallery[i]} placeholder="Pegar URL de imagen"/><button class="remove" onclick={()=>form.gallery=form.gallery.filter((_,n)=>n!==i)} disabled={viewState.saving||uploading}>Quitar</button></div>{/each}<button class="secondary" onclick={()=>form.gallery=[...form.gallery,'']} disabled={viewState.saving||uploading}>+ Añadir URL</button></section>
<section class="panel"><div class="section-head"><h3>Características técnicas</h3><button class="secondary" onclick={addSpec} disabled={viewState.saving||uploading}>+ Añadir</button></div>
{#each form.specifications as spec,i}<div class="spec-row"><input bind:value={spec.label} placeholder="Característica"/><input bind:value={spec.value} placeholder="Valor"/><button class="remove" onclick={()=>removeSpec(i)} disabled={viewState.saving||uploading}>Quitar</button></div>{/each}</section>
<footer><button class="danger" onclick={deleteSelected} disabled={!selectedId||viewState.saving||uploading}>Eliminar proyecto</button><button class="primary" onclick={save} disabled={viewState.saving||uploading}>Guardar proyecto</button></footer>
</main></div>
<style>
.workspace{display:grid;grid-template-columns:280px minmax(0,1fr);min-height:100vh;color:var(--color-text)}.project-list{padding:22px 15px;border-right:1px solid var(--color-border);background:var(--color-surface);overflow:auto}.project-list header p:not(.eyebrow){font-size:12px;color:var(--color-muted);line-height:1.5}h1{font-size:23px;margin:6px 0}.eyebrow{font-size:10px;font-weight:800;letter-spacing:.12em;text-transform:uppercase;color:var(--color-primary);margin:0}h2{font-size:24px;margin:5px 0}h3{font-size:15px;margin:0 0 14px}.primary,.secondary,.danger,.remove{border:0;border-radius:9px;padding:10px 13px;font-weight:750;cursor:pointer}.primary{background:var(--color-primary);color:white}.secondary{background:var(--color-surface-2);color:var(--color-text);border:1px solid var(--color-border)}.danger,.remove{background:#fee2e2;color:#991b1b}.full{width:100%;margin:12px 0}.project-option{width:100%;display:block;text-align:left;padding:12px;margin:7px 0;border:1px solid var(--color-border);border-radius:11px;background:transparent;color:var(--color-text);cursor:pointer}.project-option.chosen{border-color:var(--color-primary)}.project-option strong,.project-option small{display:block}.project-option small,.muted{font-size:11px;color:var(--color-muted);margin-top:5px}.status{display:block;font-size:10px;margin-top:7px;color:var(--color-muted)}.status.published{color:#15803d}.editor{padding:24px;min-width:0;max-width:1100px;width:100%;box-sizing:border-box}.editor-head,.section-head,footer{display:flex;align-items:center;justify-content:space-between;gap:12px}.panel{padding:20px;border:1px solid var(--color-border);border-radius:15px;background:var(--color-surface);margin:14px 0}.fields{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px 14px}label{display:flex;flex-direction:column;gap:7px;font-size:12px;font-weight:700;color:var(--color-muted);margin:12px 0}input,textarea{width:100%;min-width:0;box-sizing:border-box;border:1px solid var(--color-border);border-radius:8px;padding:10px;background:var(--color-background);color:var(--color-text);font:inherit;font-size:13px}input[type=checkbox],input[type=radio]{width:auto}.check{flex-direction:row;align-items:center}.message{padding:11px;border-radius:8px;font-size:12px}.error{background:#fee2e2;color:#991b1b}.success{background:#dcfce7;color:#166534}.layouts{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px}.layout-option{border:1px solid var(--color-border);border-radius:12px;padding:12px;margin:0;cursor:pointer}.layout-option.active{border-color:var(--color-primary);box-shadow:0 0 0 1px var(--color-primary)}.layout-option strong,.layout-option small{display:block}.layout-option small{font-weight:400;line-height:1.4;margin-top:5px}.layout-mini{height:55px;display:grid;grid-template-columns:1.3fr .7fr;grid-template-rows:repeat(3,1fr);gap:4px;margin-top:9px}.layout-mini i{background:color-mix(in srgb,var(--color-primary) 35%,var(--color-surface-2));border-radius:3px}.layout-mini i:first-child{grid-row:span 3}.layout-mini.editorial{grid-template-columns:.7fr 1.3fr;grid-template-rows:1fr}.layout-mini.editorial i:first-child{grid-row:auto}.layout-mini.mosaic{grid-template-columns:repeat(3,1fr);grid-template-rows:repeat(2,1fr)}.layout-mini.mosaic i:first-child{grid-row:auto;grid-column:span 2}.layout-mini.technical{grid-template-columns:repeat(4,1fr);grid-template-rows:1fr}.layout-mini.technical i:first-child{grid-row:auto;grid-column:span 2}.upload-zone{display:block;border:1px dashed var(--color-border);padding:14px;border-radius:10px}.upload-zone small{font-weight:400}.gallery-row{display:grid;grid-template-columns:75px minmax(0,1fr) auto;gap:9px;align-items:center;margin:10px 0}.gallery-row img{width:75px;height:58px;object-fit:cover;border-radius:7px}.spec-row{display:grid;grid-template-columns:1fr 1fr auto;gap:8px;margin:9px 0}button:disabled{opacity:.55;cursor:not-allowed}footer{padding:10px 0 35px}@media(max-width:800px){.workspace{grid-template-columns:1fr}.project-list{border-right:0;border-bottom:1px solid var(--color-border)}.fields,.layouts{grid-template-columns:1fr}.editor{padding:15px}.gallery-row,.spec-row{grid-template-columns:1fr}.gallery-row img{width:100%;height:130px}}
</style>
