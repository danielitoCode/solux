<script lang="ts">
import { onMount } from 'svelte';
import { supabase } from '$infrastructure/data/supabase-client';
import { isCloudinaryConfigured, uploadImageToCloudinary } from '$infrastructure/media/cloudinary';
type Layout = 'hero-left' | 'editorial' | 'gallery-grid' | 'technical-report';
type Spec = { label: string; value: string };
type Project = { id?: string; title: string; slug: string; location: string; category: string; system_name: string; capacity_kw: number | null; inverter: string; panels: string; battery: string; description: string; specifications: Spec[]; gallery: string[]; layout: Layout; is_published: boolean; sort_order: number };
const layouts: {value: Layout; label: string; description: string}[] = [
{value:'hero-left',label:'Portada + galería lateral',description:'Imagen protagonista y detalles en columna.'},
{value:'editorial',label:'Editorial',description:'Ficha técnica y fotografía grande.'},
{value:'gallery-grid',label:'Galería mosaico',description:'Fotografías en mosaico y ficha debajo.'},
{value:'technical-report',label:'Ficha técnica',description:'Datos de instalación y galería compacta.'}];
const blank = (): Project => ({title:'',slug:'',location:'',category:'Instalación solar',system_name:'Kit solar híbrido',capacity_kw:3,inverter:'',panels:'',battery:'',description:'',specifications:[{label:'Inversor',value:''},{label:'Paneles',value:''},{label:'Respaldo',value:''}],gallery:[],layout:'hero-left',is_published:false,sort_order:0});
let projects = $state<Project[]>([]);
let form = $state<Project>(blank());
let selectedId = $state('');
let loading = $state(true);
let saving = $state(false);
let uploading = $state(false);
let error = $state('');
let notice = $state('');
let fileInput = $state<HTMLInputElement>();
async function refresh() {
 loading=true;
 const {data,error:e}=await supabase.from('site_projects').select('*').order('sort_order').order('created_at',{ascending:false});
 if(e) error=e.message; else projects=(data??[]) as unknown as Project[];
 loading=false;
}
function edit(p:Project){form={...blank(),...p,specifications:[...(p.specifications??[])],gallery:[...(p.gallery??[])]};selectedId=p.id??'';error='';notice='';}
function newProject(){form=blank();selectedId='';error='';notice='';}
function slugify(v:string){return v.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().trim().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');}
function titleChanged(v:string){form.title=v;if(!selectedId)form.slug=slugify(v);}
function addSpec(){form.specifications=[...form.specifications,{label:'',value:''}];}
function removeSpec(i:number){form.specifications=form.specifications.filter((_,n)=>n!==i);}
async function uploadFiles(files:FileList|null){
 if(!files?.length)return;
 if(!isCloudinaryConfigured()){error='Configura VITE_CLOUDINARY_CLOUD_NAME y VITE_CLOUDINARY_UPLOAD_PRESET.';return;}
 uploading=true;error='';notice='';
 try { for(const file of Array.from(files)){if(!file.type.startsWith('image/'))throw new Error('Selecciona archivos de imagen.');if(file.size>10*1024*1024)throw new Error(`La imagen "${file.name}" supera 10 MB.`);const uploaded=await uploadImageToCloudinary(file,'solux/projects');form.gallery=[...form.gallery,uploaded.url];}notice='Fotos subidas a Cloudinary y añadidas a la galería.';}
 catch(e){error=e instanceof Error?e.message:'Error al subir fotografías.';}finally{uploading=false;if(fileInput)fileInput.value='';}
}
async function save(){
 if(!form.title.trim()){error='El título es obligatorio.';return;}
 saving=true;error='';notice='';
 const payload={...form,slug:form.slug||slugify(form.title),specifications:form.specifications.filter(s=>s.label.trim()&&s.value.trim()),updated_at:new Date().toISOString()};
 const result=selectedId?await supabase.from('site_projects').update(payload).eq('id',selectedId):await supabase.from('site_projects').insert(payload);
 if(result.error)error=result.error.message;else{notice='Proyecto guardado.';await refresh();const saved=projects.find(p=>p.slug===payload.slug);if(saved)edit(saved);}
 saving=false;
}
async function removeProject(p:Project){
 if(!p.id||!confirm(`¿Eliminar el proyecto "${p.title}"?`))return;
 const {error:e}=await supabase.from('site_projects').delete().eq('id',p.id);
 if(e)error=e.message;else{notice='Proyecto eliminado.';if(selectedId===p.id)newProject();await refresh();}
}
onMount(refresh);
</script>
<svelte:head><title>Proyectos | SOLUX Backoffice</title></svelte:head>
<div class="workspace">
<aside class="project-list"><header><p class="eyebrow">Contenido público</p><h1>Proyectos</h1><p>Instalaciones reales con ficha técnica, fotografías y diseño propio.</p></header><button class="primary full" onclick={newProject}>+ Nuevo proyecto</button>
{#if loading}<p>Cargando…</p>{:else if !projects.length}<p class="muted">Todavía no hay proyectos.</p>{/if}
{#each projects as p}<button class:chosen={selectedId===p.id} class="project-option" onclick={()=>edit(p)}><strong>{p.title}</strong><small>{p.capacity_kw??'—'} kW · {p.location||p.category}</small><span class:published={p.is_published} class="status">{p.is_published?'Publicado':'Borrador'}</span></button>{/each}
</aside>
<main class="editor">
<header class="editor-head"><div><p class="eyebrow">{selectedId?'Editar instalación':'Nueva instalación'}</p><h2>{form.title||'Proyecto sin título'}</h2></div><button class="primary" onclick={save} disabled={saving||uploading}>{saving?'Guardando…':'Guardar proyecto'}</button></header>
{#if error}<p class="message error" role="alert">{error}</p>{/if}{#if notice}<p class="message success" role="status">{notice}</p>{/if}
<section class="panel"><h3>Identificación del proyecto</h3><div class="fields">
<label>Título<input value={form.title} oninput={e=>titleChanged(e.currentTarget.value)} placeholder="Instalación de Kit Solar 3 kW con Sumry" required /></label>
<label>Slug<input bind:value={form.slug} placeholder="kit-solar-3kw-sumry" /></label>
<label>Ubicación<input bind:value={form.location} placeholder="Ciudad, provincia" /></label>
<label>Tipo de instalación<input bind:value={form.category} placeholder="Residencial, comercial…" /></label>
<label>Sistema / modelo<input bind:value={form.system_name} placeholder="Kit solar híbrido Sumry" /></label>
<label>Potencia instalada (kW)<input type="number" min="0" step="0.1" bind:value={form.capacity_kw} /></label>
<label>Inversor<input bind:value={form.inverter} placeholder="Marca y modelo" /></label>
<label>Paneles<input bind:value={form.panels} placeholder="Cantidad, potencia y modelo" /></label>
<label>Batería / respaldo<input bind:value={form.battery} placeholder="Tecnología y capacidad" /></label>
<label>Orden<input type="number" bind:value={form.sort_order} /></label></div>
<label>Descripción técnica y alcance<textarea rows="5" bind:value={form.description} placeholder="Necesidad, solución instalada, protecciones, puesta en marcha y resultado…"></textarea></label>
<label class="check"><input type="checkbox" bind:checked={form.is_published}/> Publicar en la web</label></section>
<section class="panel"><h3>Disposición visual por proyecto</h3><div class="layouts">{#each layouts as item}<label class:active={form.layout===item.value} class="layout-option"><input type="radio" name="layout" value={item.value} bind:group={form.layout}/><strong>{item.label}</strong><small>{item.description}</small><div class="layout-mini" class:editorial={item.value==='editorial'} class:mosaic={item.value==='gallery-grid'} class:technical={item.value==='technical-report'}><i></i><i></i><i></i><i></i></div></label>{/each}</div></section>
<section class="panel"><h3>Galería fotográfica</h3><label class="upload-zone">Subir fotos a Cloudinary<input bind:this={fileInput} type="file" accept="image/*" multiple onchange={e=>uploadFiles(e.currentTarget.files)} disabled={uploading}/><small>{uploading?'Subiendo…':'Varias imágenes, máximo 10 MB cada una.'}</small></label>
{#each form.gallery as url,i}<div class="gallery-row"><img src={url} alt={`Foto ${i+1}`}/><input type="url" bind:value={form.gallery[i]} placeholder="Pegar URL de imagen"/><button class="remove" onclick={()=>form.gallery=form.gallery.filter((_,n)=>n!==i)}>Quitar</button></div>{/each}<button class="secondary" onclick={()=>form.gallery=[...form.gallery,'']}>+ Añadir URL</button></section>
<section class="panel"><div class="section-head"><h3>Características técnicas</h3><button class="secondary" onclick={addSpec}>+ Añadir</button></div>
{#each form.specifications as spec,i}<div class="spec-row"><input bind:value={spec.label} placeholder="Característica"/><input bind:value={spec.value} placeholder="Valor"/><button class="remove" onclick={()=>removeSpec(i)}>Quitar</button></div>{/each}</section>
<footer><button class="danger" onclick={()=>selectedId&&removeProject(form)} disabled={!selectedId}>Eliminar proyecto</button><button class="primary" onclick={save} disabled={saving||uploading}>Guardar proyecto</button></footer>
</main></div>
<style>
.workspace{display:grid;grid-template-columns:280px minmax(0,1fr);min-height:100vh;color:var(--color-text)}.project-list{padding:22px 15px;border-right:1px solid var(--color-border);background:var(--color-surface);overflow:auto}.project-list header p:not(.eyebrow){font-size:12px;color:var(--color-muted);line-height:1.5}h1{font-size:23px;margin:6px 0}.eyebrow{font-size:10px;font-weight:800;letter-spacing:.12em;text-transform:uppercase;color:var(--color-primary);margin:0}h2{font-size:24px;margin:5px 0}h3{font-size:15px;margin:0 0 14px}.primary,.secondary,.danger,.remove{border:0;border-radius:9px;padding:10px 13px;font-weight:750;cursor:pointer}.primary{background:var(--color-primary);color:white}.secondary{background:var(--color-surface-2);color:var(--color-text);border:1px solid var(--color-border)}.danger,.remove{background:#fee2e2;color:#991b1b}.full{width:100%;margin:12px 0}.project-option{width:100%;display:block;text-align:left;padding:12px;margin:7px 0;border:1px solid var(--color-border);border-radius:11px;background:transparent;color:var(--color-text);cursor:pointer}.project-option.chosen{border-color:var(--color-primary)}.project-option strong,.project-option small{display:block}.project-option small,.muted{font-size:11px;color:var(--color-muted);margin-top:5px}.status{display:block;font-size:10px;margin-top:7px;color:var(--color-muted)}.status.published{color:#15803d}.editor{padding:24px;min-width:0;max-width:1100px;width:100%;box-sizing:border-box}.editor-head,.section-head,footer{display:flex;align-items:center;justify-content:space-between;gap:12px}.panel{padding:20px;border:1px solid var(--color-border);border-radius:15px;background:var(--color-surface);margin:14px 0}.fields{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px 14px}label{display:flex;flex-direction:column;gap:7px;font-size:12px;font-weight:700;color:var(--color-muted);margin:12px 0}input,textarea{width:100%;min-width:0;box-sizing:border-box;border:1px solid var(--color-border);border-radius:8px;padding:10px;background:var(--color-background);color:var(--color-text);font:inherit;font-size:13px}input[type=checkbox],input[type=radio]{width:auto}.check{flex-direction:row;align-items:center}.message{padding:11px;border-radius:8px;font-size:12px}.error{background:#fee2e2;color:#991b1b}.success{background:#dcfce7;color:#166534}.layouts{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px}.layout-option{border:1px solid var(--color-border);border-radius:12px;padding:12px;margin:0;cursor:pointer}.layout-option.active{border-color:var(--color-primary);box-shadow:0 0 0 1px var(--color-primary)}.layout-option strong,.layout-option small{display:block}.layout-option small{font-weight:400;line-height:1.4;margin-top:5px}.layout-mini{height:55px;display:grid;grid-template-columns:1.3fr .7fr;grid-template-rows:repeat(3,1fr);gap:4px;margin-top:9px}.layout-mini i{background:color-mix(in srgb,var(--color-primary) 35%,var(--color-surface-2));border-radius:3px}.layout-mini i:first-child{grid-row:span 3}.layout-mini.editorial{grid-template-columns:.7fr 1.3fr;grid-template-rows:1fr}.layout-mini.editorial i:first-child{grid-row:auto}.layout-mini.mosaic{grid-template-columns:repeat(3,1fr);grid-template-rows:repeat(2,1fr)}.layout-mini.mosaic i:first-child{grid-row:auto;grid-column:span 2}.layout-mini.technical{grid-template-columns:repeat(4,1fr);grid-template-rows:1fr}.layout-mini.technical i:first-child{grid-row:auto;grid-column:span 2}.upload-zone{display:block;border:1px dashed var(--color-border);padding:14px;border-radius:10px}.upload-zone small{font-weight:400}.gallery-row{display:grid;grid-template-columns:75px minmax(0,1fr) auto;gap:9px;align-items:center;margin:10px 0}.gallery-row img{width:75px;height:58px;object-fit:cover;border-radius:7px}.spec-row{display:grid;grid-template-columns:1fr 1fr auto;gap:8px;margin:9px 0}footer{padding:10px 0 35px}@media(max-width:800px){.workspace{grid-template-columns:1fr}.project-list{border-right:0;border-bottom:1px solid var(--color-border)}.fields,.layouts{grid-template-columns:1fr}.editor{padding:15px}.gallery-row,.spec-row{grid-template-columns:1fr}.gallery-row img{width:100%;height:130px}}
</style>