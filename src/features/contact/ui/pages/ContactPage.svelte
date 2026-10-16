<script lang="ts">
  import { onMount } from 'svelte';
  import { supabase } from '$infrastructure/data/supabase-client';

  type ContactInfo = { email: string; phone: string; whatsapp: string | null; address: string; city: string; country: string; map_url: string | null };
  type BusinessHour = { day: string; open_time: string | null; close_time: string | null; is_closed: boolean };
  const dayNames: Record<string, string> = { monday: 'Lun', tuesday: 'Mar', wednesday: 'Mié', thursday: 'Jue', friday: 'Vie', saturday: 'Sáb', sunday: 'Dom' };
  let contact = $state<ContactInfo>({ email: '', phone: '', whatsapp: '', address: '', city: '', country: '', map_url: null });
  let hours = $state<BusinessHour[]>([]);
  let loading = $state(true);
  let sending = $state(false);
  let error = $state('');
  let toastText = $state('');
  let toastShow = $state(false);
  let name = $state('');
  let email = $state('');
  let phone = $state('');
  let message = $state('');

  onMount(async () => {
    try {
      const [c, h] = await Promise.all([
        supabase.from('contact_info').select('email,phone,whatsapp,address,city,country,map_url').limit(1).maybeSingle(),
        supabase.from('business_hours').select('day,open_time,close_time,is_closed').order('day')
      ]);
      if (c.error) throw c.error;
      if (h.error) throw h.error;
      if (c.data) contact = { ...contact, ...c.data };
      if (h.data) hours = h.data;
    } catch (e) {
      error = e instanceof Error ? e.message : 'No se pudieron cargar los datos de contacto.';
    } finally { loading = false; }
  });

  function time(value: string | null) { return value ? value.slice(0, 5) : ''; }

  let mapEmbedUrl = $derived.by(() => {
    const query = [contact.address, contact.city, contact.country].filter(Boolean).join(', ');
    const rawUrl = contact.map_url?.trim();
    if (rawUrl) {
      // Google Maps short links cannot be resolved reliably in the browser due to redirects/CORS.
      // Use the official embed URL supplied for this exact company location.
      if (rawUrl.includes('maps.app.goo.gl/ssEEXshVQw95LymN6')) {
        return 'https://www.google.com/maps/embed?pb=!1m14!1m12!1m3!1d936.4971499876735!2d-75.21309445975318!3d20.134523205264504!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!5e0!3m2!1ses-419!2sus!4v1792010812592!5m2!1ses-419!2sus';
      }
      try {
        const url = new URL(rawUrl);
        const host = url.hostname.toLowerCase();
        if (host.includes('google.')) {
          if (url.pathname.includes('/maps/embed')) return url.href;
          const coords = url.href.match(/!3d(-?\d+(?:\.\d+)?)!4d(-?\d+(?:\.\d+)?)/)
            || url.href.match(/@(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/)
            || url.searchParams.get('q')?.match(/^\s*(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)\s*$/);
          if (coords) return `https://www.google.com/maps?q=${coords[1]},${coords[2]}&z=17&output=embed`;
          const place = url.pathname.match(/\/maps\/place\/([^/]+)/)?.[1];
          const target = url.searchParams.get('q') || url.searchParams.get('query') || (place ? decodeURIComponent(place.replace(/\+/g, ' ')) : '') || query;
          if (target) return `https://www.google.com/maps?q=${encodeURIComponent(target)}&output=embed`;
        }
      } catch {
        // Si URL no es válida, usar dirección configurada.
      }
    }
    return query ? `https://www.google.com/maps?q=${encodeURIComponent(query)}&output=embed` : '';
  });

  async function send(event: SubmitEvent) {
    event.preventDefault();
    sending = true; error = ''; toastText = ''; toastShow = false;
    try {
      const { error: insertError } = await supabase.from('contact_messages').insert({
        name: name.trim(), email: email.trim(), phone: phone.trim() || null,
        subject: 'general', message: message.trim()
      });
      if (insertError) throw insertError;
      toastText = 'Mensaje enviado. Nos pondremos en contacto contigo.';
      toastShow = true; name = ''; email = ''; phone = ''; message = '';
    } catch (e) {
      error = e instanceof Error ? e.message : 'No se pudo enviar el mensaje.';
    } finally { sending = false; }
  }
</script>

<svelte:head><title>Contacto | SOLUX</title></svelte:head>
<section class="page">
  <div class="section-head">
    <div><div class="eyebrow">Contacto</div><h2>Hablemos de tu proyecto.</h2></div>
    <p>Cuéntanos qué necesitas y nos pondremos en contacto contigo.</p>
  </div>
  {#if loading}<p>Cargando datos de contacto…</p>{/if}
  <div class="contact-grid">
    <form class="card message-card" onsubmit={send}>
      <h3>Envíanos un mensaje</h3>
      <p class="intro support-hint">¿Incidencia técnica? Abre un <a href="/soporte">ticket de soporte</a> con código de seguimiento.</p>
      <p class="intro">¿Tienes una idea, una duda o quieres un presupuesto?</p>
      <div class="field"><label for="contact-name">Nombre completo</label><input id="contact-name" bind:value={name} required maxlength="120" placeholder="Tu nombre" /></div>
      <div class="field"><label for="contact-email">Correo</label><input id="contact-email" type="email" bind:value={email} required maxlength="254" placeholder="tu@correo.com" /></div>
      <div class="field"><label for="contact-phone">Teléfono (opcional)</label><input id="contact-phone" bind:value={phone} maxlength="40" placeholder="Tu teléfono" /></div>
      <div class="field"><label for="contact-message">Mensaje</label><textarea id="contact-message" bind:value={message} required maxlength="5000" placeholder="Cuéntanos sobre tu proyecto..."></textarea></div>
      {#if error}<p class="form-error" role="alert">{error}</p>{/if}
      <button class="btn btn-primary" type="submit" disabled={sending}>{sending ? 'Enviando…' : 'Enviar mensaje'}</button>
      {#if toastShow}<p class="form-success" role="status">{toastText}</p>{/if}
    </form>
    <div class="contact-side">
      {#if mapEmbedUrl}
        <div class="map-preview">
          <iframe src={mapEmbedUrl} title="Ubicación de SOLUX en Google Maps" loading="lazy" referrerpolicy="no-referrer-when-downgrade" allowfullscreen></iframe>
          <a class="map-open" href={contact.map_url || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent([contact.address, contact.city, contact.country].filter(Boolean).join(', '))}`} target="_blank" rel="noreferrer">Abrir ubicación en Google Maps ↗</a>
        </div>
      {:else}
        <div class="map map-empty">{[contact.address, contact.city, contact.country].filter(Boolean).join(', ') || 'Ubicación no configurada'}</div>
      {/if}
    </div>
  </div>
  <div class="contact-list">
    <div class="contact-item"><span>⌖</span><div><strong>Ubicación</strong><small>{[contact.address, contact.city, contact.country].filter(Boolean).join(', ') || 'No configurada'}</small></div></div>
    <div class="contact-item"><span>☎</span><div><strong>Teléfono</strong><small>{contact.phone || 'No configurado'}</small></div></div>
    {#if contact.whatsapp}<div class="contact-item"><span>◉</span><div><strong>WhatsApp</strong><small>{contact.whatsapp}</small></div></div>{/if}
    <div class="contact-item"><span>✉</span><div><strong>Correo</strong><small>{contact.email || 'No configurado'}</small></div></div>
    <section class="hours-card" aria-labelledby="hours-title">
      <div class="hours-heading"><span class="hours-icon">◷</span><div><h3 id="hours-title">Horario de atención</h3><p>Consulta nuestros días y horas de servicio.</p></div></div>
      {#if hours.length}
        <div class="hours-grid">
          {#each ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'] as day}
            {@const hour = hours.find((item) => item.day.toLowerCase() === day)}
            <div class:today={new Date().toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase() === day} class="hours-row">
              <span class="hours-day">{dayNames[day] || day}{#if new Date().toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase() === day}<small>Hoy</small>{/if}</span>
              {#if !hour}<span class="hours-closed">Sin horario</span>
              {:else if hour.is_closed}<span class="hours-closed">Cerrado</span>
              {:else}<span class="hours-time">{time(hour.open_time)} <span>–</span> {time(hour.close_time)}</span>{/if}
            </div>
          {/each}
        </div>
      {:else}
        <p class="hours-empty">Horario no configurado.</p>
      {/if}
    </section>
  </div>
</section>

<style>
.page{padding-block:clamp(20px,3vh,36px)}.section-head{margin-bottom:20px}.section-head h2{margin:4px 0 8px}.contact-grid{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr);gap:16px;align-items:stretch}.message-card{padding:clamp(16px,2vw,24px);min-width:0}.message-card h3{margin-top:0}.intro{margin-bottom:14px;color:var(--color-muted)}.field{margin-bottom:10px}.field input,.field textarea{width:100%;box-sizing:border-box}.field textarea{min-height:76px;resize:vertical}.contact-side{min-width:0}.map-preview{height:100%;min-height:320px;display:flex;flex-direction:column;border:1px solid var(--color-border);border-radius:18px;overflow:hidden;background:var(--color-surface)}.map-preview iframe{display:block;width:100%;flex:1;min-height:270px;border:0}.map-open{display:flex;justify-content:center;align-items:center;padding:10px 14px;font-weight:600;color:var(--color-primary,#087b43);text-decoration:none}.map-open:hover{text-decoration:underline}.map{min-height:320px;border-radius:18px;background:linear-gradient(135deg,var(--color-surface-2),var(--color-surface));border:1px solid var(--color-border);display:grid;place-items:center;color:var(--color-muted);padding:20px;text-align:center}.contact-list{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:10px;margin-top:14px}.contact-item{display:flex;gap:10px;align-items:center;padding:12px;background:var(--color-surface);border:1px solid var(--color-border);border-radius:13px;min-width:0}.contact-item>span:first-child{flex:0 0 32px;width:32px;height:32px;display:grid;place-items:center;border-radius:9px;background:var(--color-surface-2)}.contact-item div{min-width:0;overflow-wrap:anywhere;display:grid;gap:3px}.contact-item small{line-height:1.4;color:var(--color-muted)}.hours-card{grid-column:span 2;padding:18px;border:1px solid var(--color-border);border-radius:16px;background:var(--color-surface)}.hours-heading{display:flex;gap:12px;align-items:center;margin-bottom:14px}.hours-icon{display:grid;place-items:center;width:40px;height:40px;border-radius:12px;background:var(--color-surface-2);font-size:20px}.hours-heading h3{margin:0;font-size:1.05rem}.hours-heading p{margin:3px 0 0;color:var(--color-muted);font-size:.9rem}.hours-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px}.hours-row{display:flex;justify-content:space-between;align-items:center;gap:10px;padding:10px 12px;border:1px solid var(--color-border);border-radius:10px;min-width:0}.hours-row.today{border-color:var(--color-primary,#087b43);background:var(--color-surface-2)}.hours-day{display:flex;align-items:center;gap:7px;font-weight:600}.hours-day small{font-size:.7rem;padding:2px 6px;border-radius:5px;background:var(--color-primary,#087b43);color:white}.hours-time{white-space:nowrap;font-variant-numeric:tabular-nums}.hours-time span{color:var(--color-muted)}.hours-closed{color:var(--color-muted);font-size:.88rem}.hours-empty{color:var(--color-muted);margin:0}.form-error{color:#b91c1c}.form-success{color:#15803d}
@media(min-width:901px) and (max-height:850px){.page{padding-block:16px}.section-head{display:flex;align-items:end;justify-content:space-between;gap:20px;margin-bottom:14px}.section-head p{margin:0;max-width:360px}.contact-grid{gap:14px}.message-card{padding:16px}.message-card h3{margin-bottom:6px}.intro{margin-bottom:10px}.field{margin-bottom:8px}.field textarea{min-height:58px}.map-preview{min-height:260px}.map-preview iframe{min-height:210px}.contact-list{margin-top:12px;gap:8px}.contact-item{padding:9px}.hours-card{padding:14px}.hours-grid{gap:6px}.hours-row{padding:7px 9px}}
@media(max-width:900px){.contact-grid{grid-template-columns:1fr}.map-preview{min-height:280px}.map-preview iframe{min-height:230px}.contact-list{grid-template-columns:repeat(2,minmax(0,1fr))}.hours-card{grid-column:span 2}}
@media(max-width:480px){.contact-list,.hours-grid{grid-template-columns:1fr}.hours-card{grid-column:auto}.hours-row{padding:10px 12px}.section-head{margin-bottom:16px}}
</style>
