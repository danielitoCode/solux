<script lang="ts">
  import { onMount } from 'svelte';
  import { supabase } from '$infrastructure/data/supabase-client';

  type Product = { id: string; name: string; sku: string | null; category: string; unit: string; description: string; default_cost: number; default_markup_percent: number; is_active: boolean };
  let products = $state<Product[]>([]);
  let editingId = $state<string | null>(null);
  let name = $state('');
  let sku = $state('');
  let category = $state('Consumibles');
  let unit = $state('unidad');
  let description = $state('');
  let cost = $state('0');
  let markup = $state('0');
  let active = $state(true);
  let loading = $state(false);
  let saving = $state(false);
  let error = $state('');
  let notice = $state('');

  async function load() {
    loading = true;
    const { data, error: e } = await supabase.from('consumable_products').select('*').order('name');
    if (e) error = e.message; else products = (data ?? []) as Product[];
    loading = false;
  }
  function reset() { editingId = null; name = ''; sku = ''; category = 'Consumibles'; unit = 'unidad'; description = ''; cost = '0'; markup = '0'; active = true; }
  function edit(p: Product) { editingId = p.id; name = p.name; sku = p.sku ?? ''; category = p.category; unit = p.unit; description = p.description; cost = String(p.default_cost); markup = String(p.default_markup_percent); active = p.is_active; notice = ''; }
  async function save() {
    if (saving) return;
    saving = true;
    error = ''; notice = '';
    if (!name.trim() || !(Number(cost) >= 0) || !(Number(markup) >= 0)) { error = 'Nombre, costo y porcentaje deben ser válidos.'; return; }
    const payload = { name: name.trim(), sku: sku.trim() || null, category: category.trim() || 'Consumibles', unit: unit.trim() || 'unidad', description: description.trim(), default_cost: Number(cost), default_markup_percent: Number(markup), is_active: active };
    const result = editingId
      ? await supabase.from('consumable_products').update(payload).eq('id', editingId)
      : await supabase.from('consumable_products').insert(payload);
    if (result.error) { error = result.error.message; saving = false; return; }
    notice = editingId ? 'Consumible actualizado.' : 'Consumible creado.';
    reset(); await load();
    saving = false;
  }
  async function toggle(p: Product) {
    const action = p.is_active ? 'desactivar' : 'activar';
    if (!window.confirm(`¿${action.charAt(0).toUpperCase() + action.slice(1)} "${p.name}"?`)) return;
    const { error: e } = await supabase.from('consumable_products').update({ is_active: !p.is_active }).eq('id', p.id);
    if (e) error = e.message; else await load();
  }
  onMount(load);
</script>

<svelte:head><title>Consumibles | Backoffice SOLUX</title></svelte:head>
<div class="page">
  <header><div><p class="eyebrow">Inventario de uso interno</p><h1>Catálogo de consumibles</h1><p class="sub">Insumos de ejecución. Este catálogo es independiente de productos y servicios de venta.</p></div><button class="secondary" onclick={load} disabled={loading}>Actualizar</button></header>
  {#if error}<p class="error" role="alert">{error}</p>{/if}{#if notice}<p class="notice">{notice}</p>{/if}
  <div class="layout">
    <form class="editor" onsubmit={(e) => { e.preventDefault(); save(); }}>
      <h2>{editingId ? 'Editar consumible' : 'Nuevo consumible'}</h2>
      <label>Nombre<input bind:value={name} required placeholder="Disco de corte 4½ pulgadas" /></label>
      <div class="two"><label>Código / SKU<input bind:value={sku} placeholder="Opcional" /></label><label>Categoría<input bind:value={category} placeholder="Corte, soldadura, fijación…" /></label></div>
      <div class="two"><label>Unidad<input bind:value={unit} required placeholder="unidad, caja, metro…" /></label><label>Costo unitario<input type="number" min="0" step="0.01" bind:value={cost} required /></label></div>
      <label>Sobrecargo predeterminado (%)<input type="number" min="0" max="1000" step="0.1" bind:value={markup} /></label>
      <label>Descripción<textarea bind:value={description} rows="3" placeholder="Marca, medida, especificación…"></textarea></label>
      <label class="check"><input type="checkbox" bind:checked={active} /> Disponible para usar en trabajos</label>
      <div class="buttons"><button class="primary" type="submit" disabled={saving || loading}>{saving ? 'Guardando…' : 'Guardar'}</button>{#if editingId}<button type="button" class="secondary" onclick={reset}>Cancelar</button>{/if}</div>
    </form>
    <section class="catalog"><div class="catalog-head"><h2>Consumibles registrados</h2><span>{products.length}</span></div>
      {#if loading}<p class="empty">Cargando…</p>{:else if products.length === 0}<p class="empty">Todavía no hay consumibles.</p>{:else}
        {#each products as p (p.id)}
          <article class="product" class:inactive={!p.is_active}><div class="product-info"><div class="title-line"><strong>{p.name}</strong>{#if !p.is_active}<span class="badge">Inactivo</span>{/if}</div><p>{p.category} · {p.unit}{#if p.sku} · {p.sku}{/if}</p><small>Costo: {new Intl.NumberFormat('es-US',{style:'currency',currency:'USD'}).format(Number(p.default_cost))} · Sobrecargo sugerido: {p.default_markup_percent}%</small>{#if p.description}<small>{p.description}</small>{/if}</div><div class="product-actions"><button class="secondary" onclick={() => edit(p)}>Editar</button><button class="secondary" onclick={() => toggle(p)}>{p.is_active ? 'Desactivar' : 'Activar'}</button></div></article>
        {/each}
      {/if}
    </section>
  </div>
</div>

<style>
.page{padding:28px;max-width:1440px;margin:auto;color:var(--color-text)}header{display:flex;justify-content:space-between;align-items:flex-start;gap:20px;margin-bottom:24px}h1{font-size:26px;letter-spacing:-.04em;margin:4px 0 8px}h2{font-size:16px;margin:0 0 16px}.eyebrow{font-size:10px;text-transform:uppercase;letter-spacing:.13em;font-weight:800;color:var(--color-primary);margin:0}.sub{font-size:13px;color:var(--color-muted);margin:0}.layout{display:grid;grid-template-columns:minmax(280px,380px) minmax(0,1fr);gap:20px;align-items:start}.editor,.catalog{background:var(--color-surface);border:1px solid var(--color-border);border-radius:16px;padding:20px;min-width:0}.editor{display:grid;gap:13px}label{display:grid;gap:6px;font-size:12px;font-weight:700}.two{display:grid;grid-template-columns:1fr 1fr;gap:10px}input,textarea{min-width:0;width:100%;padding:10px;border:1px solid var(--color-border);border-radius:9px;background:var(--color-background);color:inherit;font:inherit;font-weight:400}.check{display:flex;align-items:center;gap:8px}.check input{width:auto}.buttons,.product-actions{display:flex;gap:8px;flex-wrap:wrap}.primary,.secondary{border:0;border-radius:9px;padding:10px 13px;font-weight:700;cursor:pointer}.primary{background:var(--color-primary);color:white}.secondary{background:var(--color-surface-2);color:inherit}.catalog-head{display:flex;justify-content:space-between;align-items:center}.catalog-head span,.badge{font-size:11px;padding:4px 8px;border-radius:999px;background:var(--color-surface-2);color:var(--color-muted)}.product{display:flex;justify-content:space-between;gap:14px;padding:16px 0;border-top:1px solid var(--color-border)}.product.inactive{opacity:.65}.product-info{min-width:0}.title-line{display:flex;gap:8px;align-items:center;flex-wrap:wrap}.product p{margin:5px 0;font-size:12px;color:var(--color-muted)}.product small{display:block;margin-top:4px;font-size:11px;color:var(--color-muted)}.error{color:#b42318}.notice{color:#18794e}.empty{color:var(--color-muted);font-size:13px}@media(max-width:900px){.layout{grid-template-columns:1fr}}@media(max-width:600px){.page{padding:16px}header,.product{flex-direction:column}.two{grid-template-columns:1fr}}
</style>