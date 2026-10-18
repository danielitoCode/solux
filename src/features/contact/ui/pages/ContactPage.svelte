<script lang="ts">
  import { onMount } from 'svelte';
  import { fade, scale } from 'svelte/transition';
  import { cubicOut } from 'svelte/easing';
  import { publicContactUseCases } from '$features/contact/di/public-contact';
  import { ms, reveal, scrollDepth, spotlight } from '$infrastructure/ui/util/motion';
  import Ambient from "$infrastructure/ui/component/Ambient.svelte";

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
        subject: 'general',
        message: message.trim()
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
    transition:
            border-color 0.25s var(--ease),
            box-shadow 0.25s var(--ease);
  }
  .field input:focus,
  .field textarea:focus {
    outline: none;
    border-color: var(--color-primary);
    box-shadow: 0 0 0 3px color-mix(in srgb, var(--color-primary) 20%, transparent);
  }
  .field textarea {
    min-height: 120px;
    resize: vertical;
  }
  .counter {
    position: absolute;
    right: 10px;
    bottom: 8px;
    color: var(--color-muted);
    font-size: 11px;
    font-variant-numeric: tabular-nums;
    pointer-events: none;
  }
  .form-error {
    margin: 0 0 12px;
    color: #b91c1c;
    font-size: 13px;
  }
  .submit {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    transition:
            transform 0.25s var(--ease),
            opacity 0.25s var(--ease);
  }
  .submit:not(:disabled):hover {
    transform: translateY(-2px);
  }
  .submit:not(:disabled):active {
    transform: scale(0.98);
  }
  .submit:disabled {
    opacity: 0.8;
    cursor: progress;
  }
  .spinner {
    width: 14px;
    height: 14px;
    border: 2px solid currentColor;
    border-right-color: transparent;
    border-radius: 50%;
    animation: spin 0.7s linear infinite;
  }
  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }

  /* Estado de éxito */
  .success {
    display: grid;
    justify-items: center;
    gap: 10px;
    padding: 36px 10px;
    text-align: center;
  }
  .success h3 {
    margin: 6px 0 0;
    outline: none;
  }
  .success p {
    margin: 0 0 8px;
    color: var(--color-muted);
  }
  .check {
    width: 64px;
    height: 64px;
    fill: none;
    stroke: var(--color-primary);
    stroke-width: 3;
    stroke-linecap: round;
    stroke-linejoin: round;
  }
  .check circle {
    stroke-dasharray: 152;
    stroke-dashoffset: 152;
    animation: draw 0.8s var(--ease) 0.1s forwards;
  }
  .check path {
    stroke-dasharray: 40;
    stroke-dashoffset: 40;
    animation: draw 0.5s var(--ease) 0.7s forwards;
  }
  @keyframes draw {
    to {
      stroke-dashoffset: 0;
    }
  }

  /* Mapa */
  .contact-side {
    min-width: 0;
  }
  .map-frame {
    position: relative;
    display: flex;
    flex-direction: column;
    height: 100%;
    min-height: 380px;
    border: 1px solid var(--color-border);
    border-radius: 22px;
    overflow: hidden;
    background: var(--color-surface);
    box-shadow: var(--color-shadow);
  }
  .map-frame iframe {
    position: relative;
    z-index: 1;
    display: block;
    width: 100%;
    flex: 1;
    min-height: 380px;
    border: 0;
    opacity: 0;
    transition: opacity 0.6s var(--ease);
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
    transition: opacity 0.4s;
  }
  .map-skeleton.hidden {
    opacity: 0;
  }
  @keyframes shimmer {
    to {
      background-position: -200% 0;
    }
  }
  .map-open {
    position: absolute;
    z-index: 2;
    left: 14px;
    bottom: 14px;
    padding: 9px 16px;
    border-radius: 999px;
    color: white;
    font-size: 12px;
    font-weight: 700;
    text-decoration: none;
    background: rgba(8, 120, 62, 0.82);
    backdrop-filter: blur(12px);
    transition: transform 0.25s var(--ease);
  }
  .map-open:hover {
    transform: translateY(-2px);
  }
  .map-empty {
    align-items: center;
    justify-content: center;
    gap: 10px;
    padding: 24px;
    text-align: center;
    color: var(--color-muted);
    background: linear-gradient(135deg, var(--media-bg), var(--color-surface));
  }
  .map-empty-icon {
    font-size: 44px;
    color: var(--color-primary);
  }
  .map-empty p {
    margin: 0;
  }

  /* ───────── Datos de contacto ───────── */
  .contact-list {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(230px, 1fr));
    gap: 12px;
    margin-top: 18px;
  }
  .contact-item {
    position: relative;
    display: flex;
    align-items: center;
    gap: 12px;
    height: 100%;
    box-sizing: border-box;
    padding: 14px;
    min-width: 0;
    color: inherit;
    text-decoration: none;
    background: var(--color-surface);
    border: 1px solid var(--color-border);
    border-radius: 16px;
    transition:
            transform 0.3s var(--ease),
            border-color 0.3s var(--ease),
            box-shadow 0.3s var(--ease);
  }
  .contact-item.action::before {
    content: '';
    position: absolute;
    inset: 0;
    border-radius: inherit;
    pointer-events: none;
    background: radial-gradient(
            220px circle at var(--sx, 50%) var(--sy, 50%),
            rgba(255, 191, 25, 0.16),
            transparent 65%
    );
    opacity: 0;
    transition: opacity 0.3s;
  }
  .contact-item.action:hover {
    transform: translateY(-4px);
    border-color: var(--color-primary);
    box-shadow: var(--color-shadow);
  }
  .contact-item.action:hover::before {
    opacity: 1;
  }
  .contact-item.action:focus-visible {
    outline: 2px solid var(--color-primary);
    outline-offset: 3px;
  }
  .ci-icon {
    flex: 0 0 38px;
    width: 38px;
    height: 38px;
    display: grid;
    place-items: center;
    border-radius: 11px;
    color: var(--color-primary);
    background: color-mix(in srgb, var(--color-primary) 12%, transparent);
    transition: transform 0.35s var(--ease);
  }
  .contact-item.action:hover .ci-icon {
    transform: scale(1.1) rotate(-6deg);
  }
  .contact-item div {
    min-width: 0;
    display: grid;
    gap: 3px;
    overflow-wrap: anywhere;
  }
  .contact-item small {
    line-height: 1.4;
    color: var(--color-muted);
  }
  .go {
    margin-left: auto;
    color: var(--color-primary);
    opacity: 0;
    transform: translateX(-6px);
    transition:
            opacity 0.3s var(--ease),
            transform 0.3s var(--ease);
  }
  .contact-item.action:hover .go {
    opacity: 1;
    transform: none;
  }
  .contact-item.sk {
    min-height: 68px;
  }
  .sk-block {
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
  .ci-icon.sk-block {
    flex: 0 0 38px;
    height: 38px;
  }
  .sk-line {
    height: 11px;
    width: 90px;
  }
  .sk-line.short {
    width: 50px;
  }

  /* ───────── Horario ───────── */
  .hours-card {
    margin-top: 18px;
    padding: clamp(16px, 2vw, 24px);
    border: 1px solid var(--color-border);
    border-radius: 22px;
    background: var(--color-surface);
  }
  .hours-heading {
    display: flex;
    flex-wrap: wrap;
    gap: 12px;
    align-items: center;
    margin-bottom: 18px;
  }
  .hours-icon {
    display: grid;
    place-items: center;
    width: 42px;
    height: 42px;
    border-radius: 12px;
    font-size: 20px;
    color: var(--color-primary);
    background: color-mix(in srgb, var(--color-primary) 12%, transparent);
  }
  .hours-heading h3 {
    margin: 0;
    font-size: 1.05rem;
  }
  .hours-heading p {
    margin: 3px 0 0;
    color: var(--color-muted);
    font-size: 0.9rem;
  }
  .status {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    margin-left: auto;
    padding: 7px 14px;
    border: 1px solid var(--color-border);
    border-radius: 999px;
    color: var(--color-muted);
    font-size: 12px;
    font-weight: 800;
  }
  .status-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: var(--color-muted);
  }
  .status.open {
    color: var(--color-primary);
    border-color: var(--color-primary);
    background: color-mix(in srgb, var(--color-primary) 10%, transparent);
  }
  .status.open .status-dot {
    background: var(--color-primary);
    animation: ping 1.8s ease-out infinite;
  }
  @keyframes ping {
    0% {
      box-shadow: 0 0 0 0 rgba(8, 120, 62, 0.6);
    }
    100% {
      box-shadow: 0 0 0 9px rgba(8, 120, 62, 0);
    }
  }
  .hours-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(128px, 1fr));
    gap: 10px;
  }
  .hours-row {
    display: grid;
    gap: 6px;
    padding: 14px;
    min-width: 0;
    border: 1px solid var(--color-border);
    border-radius: 14px;
    animation: rise 0.6s var(--ease) both;
    animation-delay: calc(var(--i) * 50ms);
    transition:
            transform 0.3s var(--ease),
            border-color 0.3s var(--ease);
  }
  .hours-row:hover {
    transform: translateY(-3px);
    border-color: var(--color-primary);
  }
  .hours-row.today {
    border-color: var(--color-primary);
    background: color-mix(in srgb, var(--color-primary) 10%, transparent);
  }
  .hours-day {
    display: flex;
    align-items: center;
    gap: 7px;
    font-weight: 700;
  }
  .hours-day small {
    font-size: 0.7rem;
    padding: 2px 7px;
    border-radius: 6px;
    background: var(--color-primary);
    color: white;
  }
  .hours-time {
    white-space: nowrap;
    font-size: 13px;
    font-variant-numeric: tabular-nums;
  }
  .hours-time span {
    color: var(--color-muted);
  }
  .hours-closed {
    color: var(--color-muted);
    font-size: 0.88rem;
  }
  .hours-empty {
    margin: 0;
    color: var(--color-muted);
  }

  /* ───────── Responsive ───────── */
  @media (max-width: 900px) {
    .contact-grid {
      grid-template-columns: 1fr;
    }
    .map-frame,
    .map-frame iframe {
      min-height: 300px;
    }
  }
  @media (max-width: 560px) {
    .row {
      grid-template-columns: 1fr;
    }
    .status {
      margin-left: 0;
    }
  }

  /* ───────── Accesibilidad: reduce el movimiento ───────── */
  @media (prefers-reduced-motion: reduce) {
    .rise,
    .word-in,
    .hours-row,
    .spinner,
    .map-skeleton,
    .sk-block,
    .status.open .status-dot {
      animation: none;
    }
    .check circle,
    .check path {
      animation: none;
      stroke-dashoffset: 0;
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