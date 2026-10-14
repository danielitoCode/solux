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
    if (!contact.map_url && !query) return '';
    try {
      const url = new URL(contact.map_url || '');
      if (url.hostname.includes('google.') || url.hostname === 'maps.app.goo.gl') {
        const params = url.searchParams;
        const placeQuery = params.get('q') || params.get('query') || params.get('destination');
        const dataCoords = url.pathname.match(/!3d(-?\\d+(?:\\.\\d+)?)!4d(-?\\d+(?:\\.\\d+)?)/);
        const coords = url.pathname.match(/@(-?\\d+(?:\\.\\d+)?),(-?\\d+(?:\\.\\d+)?)/);
        const target = placeQuery || (dataCoords ? `${dataCoords[1]},${dataCoords[2]}` : coords ? `${coords[1]},${coords[2]}` : query) || url.href;
        return `https://maps.google.com/maps?q=${encodeURIComponent(target)}&output=embed`;
      }
    } catch { /* URL ausente o no estándar: usar dirección guardada. */ }
    return query ? `https://maps.google.com/maps?q=${encodeURIComponent(query)}&output=embed` : '';
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
      <h3>Envíanos un mensaje</h3><p class="intro">¿Tienes una idea, una duda o quieres un presupuesto?</p>
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
    <div class="contact-item"><span>⌖</span><div><strong>Ubicación</strong><br /><small>{[contact.address, contact.city, contact.country].filter(Boolean).join(', ') || 'No configurada'}</small></div></div>
    <div class="contact-item"><span>☎</span><div><strong>Teléfono</strong><br /><small>{contact.phone || 'No configurado'}</small></div></div>
    {#if contact.whatsapp}<div class="contact-item"><span>◉</span><div><strong>WhatsApp</strong><br /><small>{contact.whatsapp}</small></div></div>{/if}
    <div class="contact-item"><span>✉</span><div><strong>Correo</strong><br /><small>{contact.email || 'No configurado'}</small></div></div>
    <div class="contact-item hours-item"><span>◷</span><div><strong>Horario</strong><br /><small>{#if hours.length}{#each hours as hour, i}{#if i > 0} · {/if}{dayNames[hour.day] || hour.day}: {hour.is_closed ? 'Cerrado' : `${time(hour.open_time)}–${time(hour.close_time)}`}{/each}{:else}No configurado{/if}</small></div></div>
  </div><style>
.contact-grid{display:grid;grid-template-columns:1fr 1fr;gap:20px;align-items:stretch}.message-card{padding:24px;min-width:0}.message-card h3{margin-top:0}.intro{margin-bottom:18px;color:var(--color-muted)}.field{margin-bottom:12px}.field input,.field textarea{width:100%;box-sizing:border-box}.field textarea{min-height:100px;resize:vertical}.contact-side{min-width:0}.map-preview{height:100%;min-height:390px;display:flex;flex-direction:column;border:1px solid var(--color-border);border-radius:20px;overflow:hidden;background:var(--color-surface)}.map-preview iframe{display:block;width:100%;flex:1;min-height:340px;border:0}.map-open{display:flex;justify-content:center;align-items:center;padding:12px 16px;font-weight:600;color:var(--color-primary,#087b43);text-decoration:none}.map-open:hover{text-decoration:underline}.map{min-height:390px;border-radius:20px;background:linear-gradient(135deg,var(--color-surface-2),var(--color-surface));border:1px solid var(--color-border);display:grid;place-items:center;color:var(--color-muted);padding:20px;text-align:center}.contact-list{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:10px;margin-top:16px}.contact-item{display:flex;gap:10px;align-items:center;padding:13px;background:var(--color-surface);border:1px solid var(--color-border);border-radius:14px;min-width:0}.contact-item span:first-child{flex:0 0 34px;width:34px;height:34px;display:grid;place-items:center;border-radius:10px;background:var(--color-surface-2)}.contact-item div{min-width:0;overflow-wrap:anywhere}.contact-item small{line-height:1.45}.hours-item{grid-column:span 2}.form-error{color:#b91c1c}.form-success{color:#15803d}@media(max-width:900px){.contact-grid{grid-template-columns:1fr}.map-preview{min-height:300px}.map-preview iframe{min-height:250px}.contact-list{grid-template-columns:repeat(2,minmax(0,1fr))}.hours-item{grid-column:span 2}}@media(max-width:480px){.contact-list{grid-template-columns:1fr}.hours-item{grid-column:auto}}
</style>
