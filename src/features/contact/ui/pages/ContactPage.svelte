<script lang="ts">
  import { onMount } from 'svelte';
  import { fade, scale } from 'svelte/transition';
  import { cubicOut } from 'svelte/easing';
  import { publicContactUseCases } from '$features/contact/di/public-contact';
  import { ms, reveal, scrollDepth, spotlight } from '$infrastructure/ui/util/motion';
  import Ambient from "$infrastructure/ui/component/Ambient.svelte";
  import { readLeadFromLocation, type LeadIntent, type LeadSource } from '$infrastructure/ui/lead-context';

  /* ─────────── Tipos ─────────── */
  type ContactInfo = {
    email: string;
    phone: string;
    whatsapp: string | null;
    address: string;
    city: string;
    country: string;
    map_url: string | null;
  };
  type BusinessHour = {
    day: string;
    open_time: string | null;
    close_time: string | null;
    is_closed: boolean;
  };

  const DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
  const dayNames: Record<string, string> = {
    monday: 'Lun',
    tuesday: 'Mar',
    wednesday: 'Mié',
    thursday: 'Jue',
    friday: 'Vie',
    saturday: 'Sáb',
    sunday: 'Dom'
  };
  // El horario es de la sede, no del visitante: "hoy" y "abierto" se calculan en su zona horaria
  const BUSINESS_TZ = 'America/Havana';

  /* ─────────── Estado ─────────── */
  let contact = $state<ContactInfo>({
    email: '',
    phone: '',
    whatsapp: '',
    address: '',
    city: '',
    country: '',
    map_url: null
  });
  let hours = $state<BusinessHour[]>([]);
  let loading = $state(true);
  let loadError = $state('');

  let sending = $state(false);
  let sent = $state(false);
  let sendError = $state('');
  let name = $state('');
  let email = $state('');
  let phone = $state('');
  let message = $state('');

  let leadIntent = $state<LeadIntent>('contact');
  let leadSource = $state<LeadSource>('direct');

  let mapLoaded = $state(false);
  let now = $state(new Date());

  async function load() {
    loading = true;
    loadError = '';
    try {
      const [c, h] = await Promise.all([
        publicContactUseCases.getContactInfo.execute(),
        publicContactUseCases.getBusinessHours.execute()
      ]);
      if (c) contact = { ...contact, ...c };
      hours = h;
    } catch (e) {
      loadError = e instanceof Error ? e.message : 'No se pudieron cargar los datos de contacto.';
    } finally {
      loading = false;
    }
  }

  onMount(() => {
    const lead = readLeadFromLocation({ intent: 'contact', source: 'direct' });
    leadIntent = lead.intent;
    leadSource = lead.source;
    const itemName = new URLSearchParams(location.search).get('name')?.trim();
    if (itemName && !message.trim()) {
      message = `Consulta sobre equipo: ${itemName}`;
    }
    load();
    // Mantiene actualizado el estado "abierto ahora" sin recargar
    const id = setInterval(() => (now = new Date()), 60_000);
    return () => clearInterval(id);
  });

  /* ─────────── Derivados ─────────── */
  const time = (value: string | null) => (value ? value.slice(0, 5) : '');

  const fullAddress = $derived([contact.address, contact.city, contact.country].filter(Boolean).join(', '));

  const phoneHref = $derived(contact.phone ? `tel:${contact.phone.replace(/[^\d+]/g, '')}` : '');
  const whatsappHref = $derived(
          contact.whatsapp?.replace(/\D/g, '') ? `https://wa.me/${contact.whatsapp.replace(/\D/g, '')}` : ''
  );
  const emailHref = $derived(contact.email ? `mailto:${contact.email}` : '');

  const today = $derived(
          now.toLocaleDateString('en-US', { weekday: 'long', timeZone: BUSINESS_TZ }).toLowerCase()
  );
  const nowTime = $derived(
          now.toLocaleTimeString('en-GB', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: false,
            timeZone: BUSINESS_TZ
          })
  );
  const byDay = $derived(new Map(hours.map((h) => [h.day.toLowerCase(), h])));

  const status = $derived.by<'open' | 'closed' | 'unknown'>(() => {
    if (!hours.length) return 'unknown';
    const h = byDay.get(today);
    if (!h || h.is_closed || !h.open_time || !h.close_time) return 'closed';
    return nowTime >= time(h.open_time) && nowTime < time(h.close_time) ? 'open' : 'closed';
  });

  let mapEmbedUrl = $derived.by(() => {
    const query = fullAddress;
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
          const coords =
                  url.href.match(/!3d(-?\d+(?:\.\d+)?)!4d(-?\d+(?:\.\d+)?)/) ||
                  url.href.match(/@(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/) ||
                  url.searchParams.get('q')?.match(/^\s*(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)\s*$/);
          if (coords) return `https://www.google.com/maps?q=${coords[1]},${coords[2]}&z=17&output=embed`;
          const place = url.pathname.match(/\/maps\/place\/([^/]+)/)?.[1];
          const target =
                  url.searchParams.get('q') ||
                  url.searchParams.get('query') ||
                  (place ? decodeURIComponent(place.replace(/\+/g, ' ')) : '') ||
                  query;
          if (target) return `https://www.google.com/maps?q=${encodeURIComponent(target)}&output=embed`;
        }
      } catch {
        // Si URL no es válida, usar dirección configurada.
      }
    }
    return query ? `https://www.google.com/maps?q=${encodeURIComponent(query)}&output=embed` : '';
  });

  const mapOpenHref = $derived(
          contact.map_url ||
          `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(fullAddress)}`
  );

  // Si cambia el mapa, vuelve a mostrar el esqueleto hasta que cargue
  $effect(() => {
    mapEmbedUrl;
    mapLoaded = false;
  });

  /* ─────────── Envío ─────────── */
  async function send(event: SubmitEvent) {
    event.preventDefault();
    if (sending) return;
    sending = true;
    sendError = '';
    try {
      await publicContactUseCases.sendMessage.execute({
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim() || null,
        subject: leadIntent === 'buy' ? 'quote' : 'general',
        message: message.trim(),
        source: leadSource,
        intent: leadIntent === 'general' ? 'contact' : leadIntent
      });
      sent = true;
      name = '';
      email = '';
      phone = '';
      message = '';
    } catch (e) {
      sendError = e instanceof Error ? e.message : 'No se pudo enviar el mensaje.';
    } finally {
      sending = false;
    }
  }

  function focusOnMount(node: HTMLElement) {
    node.focus();
  }

  /* ─────────── Encabezado ─────────── */
  const title = 'Hablemos de tu proyecto.';
  const words = title.split(/\s+/);
</script>

<svelte:head><title>Contacto | SOLUX</title></svelte:head>

<section class="page" use:scrollDepth>
  <Ambient />

  <!-- ───────── Encabezado ───────── -->
  <div class="section-head intro">
    <div>
      <div class="eyebrow rise" style="--i: 0">Contacto</div>
      <h2 class="headline" aria-label={title}>
        {#each words as word, i}
          <span class="word" aria-hidden="true"
          ><span class="word-in" style="--w: {i}">{word}</span></span
          >{' '}
        {/each}
      </h2>
    </div>
    <p class="rise" style="--i: 4">Cuéntanos qué necesitas y nos pondremos en contacto contigo.</p>
  </div>

  {#if loadError}
    <div class="banner-error" role="alert" in:fade={{ duration: ms(250) }}>
      <span>{loadError}</span>
      <button type="button" class="btn btn-ghost btn-small" onclick={load}>Reintentar</button>
    </div>
  {/if}

  <!-- ───────── Formulario + mapa ───────── -->
  <div class="contact-grid">
    <div class="card message-card rv" use:reveal>
      {#if sent}
        <div class="success" role="status" in:scale={{ start: 0.96, duration: ms(400), easing: cubicOut }}>
          <svg class="check" viewBox="0 0 52 52" aria-hidden="true">
            <circle cx="26" cy="26" r="24" />
            <path d="M14 27l8 8 16-17" />
          </svg>
          <h3 tabindex="-1" use:focusOnMount>Mensaje enviado</h3>
          <p>Gracias. Nos pondremos en contacto contigo lo antes posible.</p>
          <button type="button" class="btn btn-ghost btn-small" onclick={() => (sent = false)}>
            Enviar otro mensaje
          </button>
        </div>
      {:else}
        <form onsubmit={send} in:fade={{ duration: ms(250) }}>
          <h3>Envíanos un mensaje</h3>
          <p class="hint">
            ¿Incidencia técnica? Abre un <a href="/soporte">ticket de soporte</a> con código de seguimiento.
          </p>
          <p class="intro-text">¿Tienes una idea, una duda o quieres un presupuesto?</p>

          <div class="row">
            <div class="field">
              <label for="contact-name">Nombre completo</label>
              <input
                      id="contact-name"
                      bind:value={name}
                      required
                      maxlength="120"
                      autocomplete="name"
                      placeholder="Tu nombre"
              />
            </div>
            <div class="field">
              <label for="contact-email">Correo</label>
              <input
                      id="contact-email"
                      type="email"
                      bind:value={email}
                      required
                      maxlength="254"
                      autocomplete="email"
                      placeholder="tu@correo.com"
              />
            </div>
          </div>

          <div class="field">
            <label for="contact-phone">Teléfono (opcional)</label>
            <input
                    id="contact-phone"
                    type="tel"
                    bind:value={phone}
                    maxlength="40"
                    autocomplete="tel"
                    placeholder="Tu teléfono"
            />
          </div>

          <div class="field">
            <label for="contact-message">Mensaje</label>
            <textarea
                    id="contact-message"
                    bind:value={message}
                    required
                    maxlength="5000"
                    placeholder="Cuéntanos sobre tu proyecto..."
            ></textarea>
            {#if message.length > 0}
              <span class="counter" transition:fade={{ duration: ms(150) }}>{message.length}/5000</span>
            {/if}
          </div>

          {#if sendError}
            <p class="form-error" role="alert" in:fade={{ duration: ms(200) }}>{sendError}</p>
          {/if}

          <button class="btn btn-primary submit" type="submit" disabled={sending}>
            {#if sending}<span class="spinner" aria-hidden="true"></span>Enviando…{:else}Enviar mensaje <span
                    class="arrow"
                    aria-hidden="true">→</span
            >{/if}
          </button>
        </form>
      {/if}
    </div>

    <div class="contact-side rv" use:reveal={120}>
      {#if mapEmbedUrl}
        <div class="map-frame">
          <div class="map-skeleton" class:hidden={mapLoaded} aria-hidden="true"></div>
          <iframe
                  class:loaded={mapLoaded}
                  src={mapEmbedUrl}
                  title="Ubicación de SOLUX en Google Maps"
                  loading="lazy"
                  referrerpolicy="no-referrer-when-downgrade"
                  allowfullscreen
                  onload={() => (mapLoaded = true)}
          ></iframe>
          <a class="map-open" href={mapOpenHref} target="_blank" rel="noreferrer">
            Abrir ubicación en Google Maps <span class="arrow" aria-hidden="true">↗</span>
          </a>
        </div>
      {:else}
        <div class="map-frame map-empty">
          <span class="map-empty-icon" aria-hidden="true">⌖</span>
          <p>{fullAddress || 'Ubicación no configurada'}</p>
        </div>
      {/if}
    </div>
  </div>

  <!-- ───────── Datos de contacto (con acción directa) ───────── -->
  <div class="contact-list">
    {#snippet item(icon: string, label: string, value: string, href: string, external = false)}
      {#if loading}
        <div class="contact-item sk" aria-hidden="true">
          <span class="ci-icon sk-block"></span>
          <div><span class="sk-block sk-line short"></span><span class="sk-block sk-line"></span></div>
        </div>
      {:else if value && href}
        <a
                class="contact-item action"
                {href}
                target={external ? '_blank' : undefined}
                rel={external ? 'noreferrer' : undefined}
                use:spotlight
        >
          <span class="ci-icon" aria-hidden="true">{icon}</span>
          <div>
            <strong>{label}</strong>
            <small>{value}</small>
          </div>
          <span class="go" aria-hidden="true">→</span>
        </a>
      {:else}
        <div class="contact-item">
          <span class="ci-icon" aria-hidden="true">{icon}</span>
          <div>
            <strong>{label}</strong>
            <small>{value || 'No configurado'}</small>
          </div>
        </div>
      {/if}
    {/snippet}

    <div class="rv" use:reveal={0}>{@render item('⌖', 'Ubicación', fullAddress, mapOpenHref, true)}</div>
    <div class="rv" use:reveal={70}>{@render item('☎', 'Teléfono', contact.phone, phoneHref)}</div>
    {#if contact.whatsapp || loading}
      <div class="rv" use:reveal={140}>
        {@render item('◉', 'WhatsApp', contact.whatsapp ?? '', whatsappHref, true)}
      </div>
    {/if}
    <div class="rv" use:reveal={210}>{@render item('✉', 'Correo', contact.email, emailHref)}</div>
  </div>

  <!-- ───────── Horario ───────── -->
  <section class="hours-card rv" use:reveal aria-labelledby="hours-title">
    <div class="hours-heading">
      <span class="hours-icon" aria-hidden="true">◷</span>
      <div>
        <h3 id="hours-title">Horario de atención</h3>
        <p>Consulta nuestros días y horas de servicio.</p>
      </div>
      {#if status !== 'unknown'}
        <span class="status" class:open={status === 'open'} role="status">
          <span class="status-dot" aria-hidden="true"></span>
          {status === 'open' ? 'Abierto ahora' : 'Cerrado ahora'}
        </span>
      {/if}
    </div>

    {#if hours.length}
      <div class="hours-grid">
        {#each DAYS as day, i (day)}
          {@const hour = byDay.get(day)}
          <div class="hours-row" class:today={today === day} style="--i: {i}">
            <span class="hours-day">
              {dayNames[day] || day}
              {#if today === day}<small>Hoy</small>{/if}
            </span>
            {#if !hour}
              <span class="hours-closed">Sin horario</span>
            {:else if hour.is_closed}
              <span class="hours-closed">Cerrado</span>
            {:else}
              <span class="hours-time">{time(hour.open_time)} <span>–</span> {time(hour.close_time)}</span>
            {/if}
          </div>
        {/each}
      </div>
    {:else if !loading}
      <p class="hours-empty">Horario no configurado.</p>
    {/if}
  </section>
</section>

<style>
  .page {
    --ease: cubic-bezier(0.22, 1, 0.36, 1);
    --media-bg: var(--color-surface-2, var(--color-border));
    isolation: isolate;
    padding-block: clamp(20px, 3vh, 36px);
  }

  /* ───────── Entrada del encabezado ───────── */
  .rise {
    animation: rise 0.8s var(--ease) both;
    animation-delay: calc(var(--i, 0) * 90ms);
  }
  @keyframes rise {
    from {
      opacity: 0;
      transform: translateY(18px);
    }
  }
  .intro {
    margin-bottom: 28px;
  }
  .intro .eyebrow {
    display: inline-block;
    margin-bottom: 18px;
  }
  .headline {
    margin-block: inherit;
  }
  .word {
    display: inline-block;
    overflow: hidden;
    vertical-align: top;
    padding-block: 0.12em;
    margin-block: -0.12em;
  }
  .word-in {
    display: inline-block;
    animation: word-up 0.95s var(--ease) both;
    animation-delay: calc(0.2s + var(--w) * 80ms);
  }
  @keyframes word-up {
    from {
      transform: translateY(115%) rotate(4deg);
    }
  }

  /* ───────── Revelado al hacer scroll ───────── */
  .rv {
    opacity: 0;
    transform: translateY(28px) scale(0.98);
    filter: blur(6px);
    transition:
            opacity 0.7s var(--ease),
            transform 0.7s var(--ease),
            filter 0.7s var(--ease);
    transition-delay: var(--delay, 0ms);
  }
  .rv:global(.in) {
    opacity: 1;
    transform: none;
    filter: none;
  }
  .arrow {
    display: inline-block;
    transition: transform 0.25s var(--ease);
  }
  a:hover > .arrow,
  a:focus-visible > .arrow,
  button:hover > .arrow {
    transform: translateX(4px);
  }

  .banner-error {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
    flex-wrap: wrap;
    margin-bottom: 18px;
  }

  /* ───────── Formulario + mapa ───────── */
  .contact-grid {
    display: grid;
    grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
    gap: 18px;
    align-items: stretch;
  }
  .message-card {
    min-width: 0;
    padding: clamp(18px, 2.4vw, 30px);
  }
  .message-card h3 {
    margin: 0 0 8px;
  }
  .hint {
    display: flex;
    align-items: center;
    gap: 8px;
    margin: 0 0 14px;
    padding: 10px 14px;
    border: 1px dashed var(--color-border);
    border-radius: 12px;
    color: var(--color-muted);
    font-size: 12px;
  }
  .hint a {
    color: var(--color-primary);
    font-weight: 700;
  }
  .intro-text {
    margin: 0 0 16px;
    color: var(--color-muted);
  }
  .row {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 12px;
  }
  .field {
    position: relative;
    margin-bottom: 12px;
  }
  .field label {
    display: block;
    margin-bottom: 6px;
    font-size: 12px;
    font-weight: 700;
  }
  .field input,
  .field textarea {
    width: 100%;
    box-sizing: border-box;
    padding: 11px 14px;
    border: 1px solid var(--color-border);
    border-radius: 12px;
    background: var(--color-bg);
    color: var(--color-text);
    font: inherit;
    font-size: 14px;
    transition: border-color 0.25s var(--ease), box-shadow 0.25s var(--ease);
  }
  .field input:focus,
  .field textarea:focus {
    outline: none;
    border-color: var(--color-primary);
    box-shadow: 0 0 0 3px color-mix(in srgb, var(--color-primary) 18%, transparent);
  }
  .field textarea {
    min-height: 120px;
    resize: vertical;
  }
  .counter {
    position: absolute;
    right: 10px;
    bottom: 10px;
    font-size: 11px;
    color: var(--color-muted);
  }
  .form-error {
    margin: 0 0 12px;
    padding: 10px 12px;
    border-radius: 10px;
    background: color-mix(in srgb, #c0392b 12%, var(--color-surface));
    border: 1px solid color-mix(in srgb, #c0392b 30%, var(--color-border));
    color: #a93226;
    font-size: 13px;
  }
  .submit {
    width: 100%;
    margin-top: 4px;
  }
  .spinner {
    display: inline-block;
    width: 14px;
    height: 14px;
    margin-right: 8px;
    border: 2px solid rgba(255, 255, 255, 0.35);
    border-top-color: white;
    border-radius: 50%;
    animation: spin 0.7s linear infinite;
    vertical-align: -2px;
  }
  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }
  .success {
    text-align: center;
    padding: 28px 12px;
  }
  .check {
    width: 56px;
    height: 56px;
    margin: 0 auto 14px;
  }
  .check circle {
    fill: none;
    stroke: color-mix(in srgb, #27ae60 55%, transparent);
    stroke-width: 2;
  }
  .check path {
    fill: none;
    stroke: #1e8449;
    stroke-width: 3;
    stroke-linecap: round;
    stroke-linejoin: round;
  }
  .success h3 {
    margin: 0 0 8px;
  }
  .success p {
    margin: 0 0 16px;
    color: var(--color-muted);
  }

  .contact-side {
    min-width: 0;
  }
  .map-frame {
    position: relative;
    height: 100%;
    min-height: 320px;
    border-radius: 18px;
    overflow: hidden;
    border: 1px solid var(--color-border);
    background: var(--media-bg);
  }
  .map-frame iframe {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    border: 0;
    opacity: 0;
    transition: opacity 0.4s var(--ease);
  }
  .map-frame iframe.loaded {
    opacity: 1;
  }
  .map-skeleton {
    position: absolute;
    inset: 0;
    background: linear-gradient(
      90deg,
      var(--color-border) 25%,
      rgba(255, 255, 255, 0.12) 50%,
      var(--color-border) 75%
    )
    0 0 / 200% 100%;
    animation: shimmer 1.5s linear infinite;
  }
  .map-skeleton.hidden {
    display: none;
  }
  @keyframes shimmer {
    to {
      background-position: -200% 0;
    }
  }
  .map-open {
    position: absolute;
    left: 12px;
    right: 12px;
    bottom: 12px;
    z-index: 2;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    padding: 10px 14px;
    border-radius: 12px;
    background: color-mix(in srgb, var(--color-bg) 88%, transparent);
    backdrop-filter: blur(10px);
    color: var(--color-text);
    font-size: 12px;
    font-weight: 700;
    text-decoration: none;
  }
  .map-empty {
    display: grid;
    place-items: center;
    text-align: center;
    padding: 24px;
    color: var(--color-muted);
  }
  .map-empty-icon {
    font-size: 28px;
    margin-bottom: 8px;
  }

  /* ───────── Lista de contacto ───────── */
  .contact-list {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
    gap: 12px;
    margin-top: 22px;
  }
  .contact-item {
    display: flex;
    align-items: center;
    gap: 14px;
    padding: 16px 18px;
    border: 1px solid var(--color-border);
    border-radius: 16px;
    background: var(--color-surface);
    color: inherit;
    text-decoration: none;
    transition: transform 0.25s var(--ease), border-color 0.25s var(--ease);
  }
  .contact-item.action:hover {
    transform: translateY(-3px);
    border-color: var(--color-primary);
  }
  .ci-icon {
    flex: none;
    width: 40px;
    height: 40px;
    display: grid;
    place-items: center;
    border-radius: 12px;
    background: color-mix(in srgb, var(--color-primary) 12%, transparent);
    color: var(--color-primary);
    font-size: 18px;
  }
  .contact-item strong {
    display: block;
    font-size: 13px;
  }
  .contact-item small {
    color: var(--color-muted);
    font-size: 12px;
  }
  .go {
    margin-left: auto;
    color: var(--color-muted);
    font-weight: 700;
  }

  /* ───────── Horario ───────── */
  .hours-card {
    margin-top: 22px;
    padding: 22px 24px;
    border: 1px solid var(--color-border);
    border-radius: 18px;
    background: var(--color-surface);
  }
  .hours-heading {
    display: flex;
    align-items: center;
    gap: 14px;
    flex-wrap: wrap;
    margin-bottom: 16px;
  }
  .hours-icon {
    width: 42px;
    height: 42px;
    display: grid;
    place-items: center;
    border-radius: 12px;
    background: color-mix(in srgb, var(--color-primary) 12%, transparent);
    color: var(--color-primary);
    font-size: 18px;
  }
  .hours-heading h3 {
    margin: 0 0 2px;
    font-size: 16px;
  }
  .hours-heading p {
    margin: 0;
    color: var(--color-muted);
    font-size: 13px;
  }
  .status {
    margin-left: auto;
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 6px 12px;
    border-radius: 999px;
    background: color-mix(in srgb, #c0392b 12%, transparent);
    color: #a93226;
    font-size: 12px;
    font-weight: 700;
  }
  .status.open {
    background: color-mix(in srgb, #27ae60 14%, transparent);
    color: #1e8449;
  }
  .status-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: currentColor;
  }
  .hours-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
    gap: 8px;
  }
  .hours-row {
    display: flex;
    justify-content: space-between;
    gap: 10px;
    padding: 10px 12px;
    border-radius: 12px;
    background: var(--color-surface-2);
    font-size: 13px;
  }
  .hours-row.today {
    outline: 1px solid color-mix(in srgb, var(--color-primary) 45%, transparent);
  }
  .hours-day {
    font-weight: 700;
  }
  .hours-day small {
    margin-left: 6px;
    color: var(--color-primary);
    font-size: 10px;
    text-transform: uppercase;
  }
  .hours-closed {
    color: var(--color-muted);
  }
  .hours-time span {
    opacity: 0.55;
  }
  .hours-empty {
    margin: 0;
    color: var(--color-muted);
    font-size: 13px;
  }

  .contact-item.sk .sk-block {
    display: block;
    border-radius: 8px;
    background: linear-gradient(
      90deg,
      var(--color-border) 25%,
      rgba(255, 255, 255, 0.12) 50%,
      var(--color-border) 75%
    )
    0 0 / 200% 100%;
    animation: shimmer 1.5s linear infinite;
  }
  .sk-line {
    height: 10px;
    margin: 4px 0;
  }
  .sk-line.short {
    width: 45%;
  }

  @media (max-width: 820px) {
    .contact-grid {
      grid-template-columns: 1fr;
    }
    .map-frame {
      min-height: 260px;
    }
    .row {
      grid-template-columns: 1fr;
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .rise,
    .word-in,
    .map-skeleton,
    .contact-item.sk .sk-block {
      animation: none;
    }
    .rv {
      opacity: 1;
      transform: none;
      filter: none;
      transition: none;
    }
    .contact-item,
    .ci-icon,
    .go,
    .hours-row,
    .submit,
    .arrow,
    .map-frame iframe {
      transition: none;
    }
  }
</style>
