<script lang="ts">
  import { onMount } from 'svelte';
  import { supabase } from '$infrastructure/data/supabase-client';

  type Profile = { id?: string; name: string; tagline: string; about: string; mission: string; vision: string; years_of_experience: number; completed_projects: number; logo_url?: string | null };
  type Contact = { id?: string; email: string; phone: string; whatsapp: string | null; address: string; city: string; country: string; map_url: string | null };
  type Hours = { id?: string; day: string; open_time: string | null; close_time: string | null; is_closed: boolean };

  const days = [
    ['monday', 'Lunes'], ['tuesday', 'Martes'], ['wednesday', 'Miércoles'],
    ['thursday', 'Jueves'], ['friday', 'Viernes'], ['saturday', 'Sábado'], ['sunday', 'Domingo']
  ];
  let profile = $state<Profile>({ name: '', tagline: '', about: '', mission: '', vision: '', years_of_experience: 0, completed_projects: 0 });
  let contact = $state<Contact>({ email: '', phone: '', whatsapp: '', address: '', city: '', country: '', map_url: '' });
  let hours = $state<Hours[]>(days.map(([day]) => ({ day, open_time: '08:00', close_time: '17:00', is_closed: false })));
  let loading = $state(true);
  let saving = $state(false);
  let uploadingLogo = $state(false);
  let error = $state('');
  let success = $state('');

  async function load() {
    loading = true; error = '';
    try {
      const [p, c, h] = await Promise.all([
        supabase.from('company_profile').select('*').limit(1).maybeSingle(),
        supabase.from('contact_info').select('*').limit(1).maybeSingle(),
        supabase.from('business_hours').select('*')
      ]);
      if (p.error) throw p.error;
      if (c.error) throw c.error;
      if (h.error) throw h.error;
      if (p.data) profile = { ...profile, ...p.data };
      if (c.data) contact = { ...contact, ...c.data };
      if (h.data?.length) hours = days.map(([day]) => h.data!.find((row) => row.day === day) ?? { day, open_time: '08:00', close_time: '17:00', is_closed: false });
    } catch (e) {
      error = e instanceof Error ? e.message : 'No se pudo cargar la presentación';
    } finally { loading = false; }
  }

  async function save() {
    saving = true; error = ''; success = '';
    try {
      const { id: profileId, ...profileFields } = profile;
      const profileResult = profileId
        ? await supabase.from('company_profile').update(profileFields).eq('id', profileId)
        : await supabase.from('company_profile').insert(profileFields);
      if (profileResult.error) throw profileResult.error;

      const { id: contactId, ...contactFields } = contact;
      const contactResult = contactId
        ? await supabase.from('contact_info').update(contactFields).eq('id', contactId)
        : await supabase.from('contact_info').insert(contactFields);
      if (contactResult.error) throw contactResult.error;

      for (const hour of hours) {
        const payload = { day: hour.day, open_time: hour.is_closed ? null : hour.open_time, close_time: hour.is_closed ? null : hour.close_time, is_closed: hour.is_closed };
        const result = await supabase.from('business_hours').upsert(payload, { onConflict: 'day' });
        if (result.error) throw result.error;
      }
      success = 'Presentación guardada.';
      await load();
    } catch (e) {
      error = e instanceof Error ? e.message : 'No se pudo guardar. Verifica permisos de administrador.';
    } finally { saving = false; }
  }

  async function uploadLogo(event: Event) {
    console.group('[SOLUX] Subida de logo');
    const input = event.currentTarget as HTMLInputElement;
    const file = input.files?.[0];
    console.log('[SOLUX] Archivo seleccionado:', file ? { name: file.name, type: file.type, size: file.size } : null);
    if (!file) {
      console.warn('[SOLUX] No se seleccionó archivo.');
      console.groupEnd();
      return;
    }
    error = ''; success = '';
    if (!['image/png', 'image/jpeg', 'image/webp'].includes(file.type)) {
      console.error('[SOLUX] Formato no válido:', file.type);
      error = 'Formato no válido. Usa PNG, JPG o WebP.'; input.value = ''; console.groupEnd(); return;
    }
    if (file.size > 2 * 1024 * 1024) {
      console.error('[SOLUX] Archivo supera 2 MB:', file.size);
      error = 'El logo supera 2 MB.'; input.value = ''; console.groupEnd(); return;
    }
    const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME as string | undefined;
    const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET as string | undefined;
    console.log('[SOLUX] Cloudinary config:', {
      cloudName: cloudName ? `${cloudName.slice(0, 3)}***` : undefined,
      uploadPreset: uploadPreset ? `${uploadPreset.slice(0, 3)}***` : undefined,
      hasCloudName: Boolean(cloudName),
      hasUploadPreset: Boolean(uploadPreset)
    });
    if (!cloudName || !uploadPreset) {
      console.error('[SOLUX] Faltan variables VITE_CLOUDINARY_CLOUD_NAME o VITE_CLOUDINARY_UPLOAD_PRESET.');
      error = 'Faltan VITE_CLOUDINARY_CLOUD_NAME y VITE_CLOUDINARY_UPLOAD_PRESET.';
      input.value = '';
      console.groupEnd();
      return;
    }
    uploadingLogo = true;
    try {
      if (!profile.id) {
        console.log('[SOLUX] No existe company_profile.id. Creando perfil antes de subir logo...');
        const { data, error: insertError } = await supabase.from('company_profile').insert({
          name: profile.name || 'SOLUX', tagline: profile.tagline, about: profile.about,
          mission: profile.mission, vision: profile.vision,
          years_of_experience: profile.years_of_experience, completed_projects: profile.completed_projects
        }).select('id').single();
        if (insertError) {
          console.error('[SOLUX] Error creando company_profile:', insertError);
          throw insertError;
        }
        profile.id = data.id;
        console.log('[SOLUX] company_profile creado:', profile.id);
      }

      const formData = new FormData();
      formData.append('file', file);
      formData.append('upload_preset', uploadPreset);
      formData.append('folder', 'solux/company');
      formData.append('public_id', `logo-${profile.id}`);
      console.log('[SOLUX] Enviando archivo a Cloudinary:', {
        endpoint: `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
        folder: 'solux/company',
        publicId: `logo-${profile.id}`
      });

      const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
        method: 'POST',
        body: formData
      });
      console.log('[SOLUX] Respuesta HTTP Cloudinary:', { status: response.status, ok: response.ok });
      const result = await response.json() as { secure_url?: string; public_id?: string; error?: { message?: string; http_code?: number } };
      console.log('[SOLUX] Respuesta Cloudinary:', result);
      if (!response.ok || !result.secure_url) {
        console.error('[SOLUX] Cloudinary rechazó la subida:', result.error);
        throw new Error(result.error?.message || 'Cloudinary rechazó la subida.');
      }

      console.log('[SOLUX] Logo subido. URL:', result.secure_url);
      console.log('[SOLUX] Guardando logo_url en company_profile:', profile.id);
      const { error: updateError } = await supabase.from('company_profile').update({ logo_url: result.secure_url }).eq('id', profile.id);
      if (updateError) {
        console.error('[SOLUX] Error actualizando logo_url en Supabase:', updateError);
        throw updateError;
      }
      profile.logo_url = result.secure_url;
      success = 'Logo actualizado.';
      console.log('[SOLUX] Subida de logo completada correctamente.');
    } catch (e) {
      console.error('[SOLUX] Error final en subida de logo:', e);
      error = e instanceof Error ? e.message : 'No se pudo subir el logo.';
    } finally {
      uploadingLogo = false;
      input.value = '';
      console.log('[SOLUX] Estado uploadingLogo:', uploadingLogo);
      console.groupEnd();
    }
  }

  onMount(load);
</script>

<svelte:head><title>Presentación | SOLUX Backoffice</title></svelte:head>
<main class="page">
  <header class="heading">
    <div><p class="eyebrow">Backoffice · Sitio público</p><h1>Presentación</h1><p>Contenido corporativo, datos de contacto y horario visible en la web.</p></div>
    <button class="primary" onclick={save} disabled={saving || loading}>{saving ? 'Guardando…' : 'Guardar cambios'}</button>
  </header>

  {#if error}<div class="notice error" role="alert">{error}</div>{/if}
  {#if success}<div class="notice success" role="status">{success}</div>{/if}
  {#if loading}<p>Cargando configuración…</p>{:else}
    <form onsubmit={(event) => { event.preventDefault(); save(); }}>
      <section class="panel">
        <h2>Identidad y portada</h2>
        <div class="logo-upload">
          {#if profile.logo_url}<img src={profile.logo_url} alt="Logo actual de la empresa" />{/if}
          <label>Logo de la empresa (PNG, JPG o WebP; máximo 2 MB)
            <input type="file" accept="image/png,image/jpeg,image/webp" onchange={uploadLogo} disabled={uploadingLogo} />
          </label>
          {#if uploadingLogo}<small>Subiendo logo…</small>{/if}
        </div>
        <div class="fields">
          <label>Nombre de empresa<input bind:value={profile.name} required /></label>
          <label>Eslogan<input bind:value={profile.tagline} /></label>
          <label class="wide">Acerca de la empresa<textarea rows="3" bind:value={profile.about}></textarea></label>
          <label class="wide">Misión<textarea rows="2" bind:value={profile.mission}></textarea></label>
          <label class="wide">Visión<textarea rows="2" bind:value={profile.vision}></textarea></label>
          <label>Años de experiencia<input type="number" min="0" bind:value={profile.years_of_experience} /></label>
          <label>Proyectos completados<input type="number" min="0" bind:value={profile.completed_projects} /></label>
        </div>
      </section>
      <section class="panel">
        <h2>Contacto público</h2>
        <div class="fields">
          <label>Correo<input type="email" bind:value={contact.email} required /></label>
          <label>Teléfono<input bind:value={contact.phone} required /></label>
          <label>WhatsApp<input bind:value={contact.whatsapp} /></label>
          <label>Dirección<input bind:value={contact.address} /></label>
          <label>Ciudad<input bind:value={contact.city} /></label>
          <label>País<input bind:value={contact.country} /></label>
          <label class="wide">URL de mapa<input type="url" bind:value={contact.map_url} placeholder="https://…" /></label>
        </div>
      </section>
      <section class="panel">
        <h2>Horario de atención</h2>
        <div class="hours">
          {#each hours as hour, i}
            <div class="hour-row">
              <strong>{days.find(([day]) => day === hour.day)?.[1]}</strong>
              <label class="closed"><input type="checkbox" bind:checked={hour.is_closed} /> Cerrado</label>
              <label>Abre<input type="time" bind:value={hour.open_time} disabled={hour.is_closed} /></label>
              <label>Cierra<input type="time" bind:value={hour.close_time} disabled={hour.is_closed} /></label>
            </div>
          {/each}
        </div>
      </section>
      <div class="footer"><button class="primary" type="submit" disabled={saving}>{saving ? 'Guardando…' : 'Guardar cambios'}</button></div>
    </form>
  {/if}
</main>

<style>
  .page{max-width:1100px;margin:auto;padding:32px 26px 56px;color:var(--color-text)}
  .heading{display:flex;justify-content:space-between;align-items:center;gap:20px;margin-bottom:24px}
  h1{margin:4px 0 8px;font-size:30px;letter-spacing:-.04em}.heading p:last-child{color:var(--color-muted);margin:0}
  .eyebrow{font-size:11px;font-weight:800;letter-spacing:.1em;text-transform:uppercase;color:var(--color-primary)}
  .panel{background:var(--color-surface);border:1px solid var(--color-border);border-radius:18px;padding:22px;margin:18px 0}
  h2{font-size:17px;margin:0 0 18px}
  .logo-upload{display:flex;align-items:center;gap:18px;margin-bottom:20px;flex-wrap:wrap}.logo-upload img{width:88px;height:88px;object-fit:contain;border:1px solid var(--color-border);border-radius:12px;padding:8px;background:white}.logo-upload label{min-width:240px}.logo-upload input{margin-top:4px}
  .fields{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:16px}
  label{display:flex;flex-direction:column;gap:7px;font-size:12px;font-weight:700;color:var(--color-muted)}
  input,textarea{width:100%;box-sizing:border-box;border:1px solid var(--color-border);border-radius:9px;padding:10px 11px;background:var(--color-background);color:var(--color-text);font:inherit;font-size:14px}
  input:disabled{opacity:.45}.wide{grid-column:1/-1}
  .hour-row{display:grid;grid-template-columns:1fr 1fr 1fr 1fr;align-items:center;gap:14px;padding:12px 0;border-bottom:1px solid var(--color-border)}
  .hour-row strong{font-size:13px}.closed{flex-direction:row;align-items:center}.closed input{width:auto}
  .primary{background:var(--color-primary);color:white;border:0;border-radius:10px;padding:11px 16px;font-weight:800;cursor:pointer}.primary:disabled{opacity:.6}
  .notice{padding:12px 14px;border-radius:10px;margin:12px 0}.error{background:#fee2e2;color:#991b1b}.success{background:#dcfce7;color:#166534}
  .footer{display:flex;justify-content:flex-end}.heading .primary{flex-shrink:0}
  @media(max-width:700px){.page{padding:22px 14px}.heading{align-items:flex-start;flex-direction:column}.fields{grid-template-columns:1fr}.wide{grid-column:auto}.hour-row{grid-template-columns:1fr 1fr}.hour-row strong{grid-column:1/-1}}
</style>
