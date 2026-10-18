<script lang="ts">
  import { onDestroy } from 'svelte';
  import { fade, fly, scale, slide } from 'svelte/transition';
  import { cubicOut } from 'svelte/easing';
  import { getSupportRepository } from '$features/support/di';
  import { getReservationRepository } from '$features/reservations/di';
  import { devLog, devError } from '$infrastructure/ui/dev-logger';
  import { ms, reveal, scrollDepth } from '$infrastructure/ui/util/motion';
  import Ambient from "$infrastructure/ui/component/Ambient.svelte";

  const SUBJECTS = [
    { value: 'Fallo en instalación solar', label: 'Fallo en instalación solar' },
    { value: 'Problema eléctrico', label: 'Problema eléctrico' },
    { value: 'Consulta de mantenimiento', label: 'Consulta de mantenimiento' },
    { value: 'Seguimiento de reserva', label: 'Seguimiento de reserva' },
    { value: 'Otro', label: 'Otro' }
  ] as const;

  const EMAIL_RE = /[^\s@]+@[^\s@]+\.[^\s@]+/;

  /* ─────────── Estado del formulario ─────────── */
  let name = $state('');
  let email = $state('');
  let phone = $state('');
  let subject = $state<(typeof SUBJECTS)[number]['value']>('Fallo en instalación solar');
  let description = $state('');
  let reservationCode = $state('');

  let submitting = $state(false);
  let formError = $state('');
  let reservationError = $state('');
  let touched = $state({ name: false, email: false, description: false });

  let createdCode = $state<string | null>(null);
  let copied = $state(false);

  // Validación en línea: se muestra al salir del campo o al intentar enviar
  const errors = $derived({
    name: name.trim() ? '' : 'Indica tu nombre.',
    email: !email.trim() ? 'Indica tu correo.' : EMAIL_RE.test(email.trim()) ? '' : 'Indica un correo válido.',
    description: description.trim() ? '' : 'Describe el problema.'
  });

  /* ─────────── Aviso (toast) ─────────── */
  let toastText = $state('');
  let toastShow = $state(false);
  let toastTimer: ReturnType<typeof setTimeout> | undefined;
  let copiedTimer: ReturnType<typeof setTimeout> | undefined;

  function showToast(text: string) {
    toastText = text;
    toastShow = true;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => (toastShow = false), 4200);
  }

  onDestroy(() => {
    clearTimeout(toastTimer);
    clearTimeout(copiedTimer);
  });

  /* ─────────── Envío ─────────── */
  async function submit(event: SubmitEvent) {
    event.preventDefault();
    if (submitting) return;
    formError = '';
    reservationError = '';

    touched = { name: true, email: true, description: true };
    const firstInvalid = (['name', 'email', 'description'] as const).find((k) => errors[k]);
    if (firstInvalid) {
      showToast('Revisa los campos marcados.');
      const ids = { name: 'sup-name', email: 'sup-email', description: 'sup-desc' };
      document.getElementById(ids[firstInvalid])?.focus();
      return;
    }

    submitting = true;
    try {
      let relatedReservationId: string | undefined;
      const code = reservationCode.trim().toUpperCase();
      if (code) {
        const reservation = await getReservationRepository().getByTrackingCode(code);
        if (!reservation) {
          reservationError = 'No encontramos una reserva con ese código. Déjalo vacío o corrígelo.';
          showToast(reservationError);
          document.getElementById('sup-res')?.focus();
          return;
        }
        relatedReservationId = reservation.id;
      }

      const ticket = await getSupportRepository().createTicket({
        customerName: name.trim(),
        customerEmail: email.trim(),
        customerPhone: phone.trim() || undefined,
        subject: subject.trim(),
        description: description.trim(),
        relatedReservationId
      });

      devLog('soporte-public', 'created', ticket.trackingCode);
      createdCode = ticket.trackingCode;
      showToast(`Ticket creado. Código ${ticket.trackingCode}`);
    } catch (e) {
      devError('soporte-public', 'create failed', e, { file: 'SupportPage.svelte' });
      formError = e instanceof Error ? e.message : 'No se pudo crear el ticket.';
      showToast(formError);
    } finally {
      submitting = false;
    }
  }

  function resetForm() {
    createdCode = null;
    copied = false;
    name = '';
    email = '';
    phone = '';
    subject = 'Fallo en instalación solar';
    description = '';
    reservationCode = '';
    formError = '';
    reservationError = '';
    touched = { name: false, email: false, description: false };
  }

  async function copyCode() {
    if (!createdCode || typeof navigator === 'undefined') return;
    try {
      await navigator.clipboard.writeText(createdCode);
      copied = true;
      clearTimeout(copiedTimer);
      copiedTimer = setTimeout(() => (copied = false), 2200);
      showToast('Código copiado al portapapeles');
    } catch {
      showToast(createdCode);
    }
  }

  function focusOnMount(node: HTMLElement) {
    node.focus();
  }

  /* ─────────── Encabezado ─────────── */
  const title = 'Abre un ticket técnico.';
  const words = title.split(/\s+/);
</script>

<svelte:head>
  <title>Soporte técnico | SOLUX</title>
</svelte:head>

<section class="page" use:scrollDepth>
  <Ambient />

  <!-- ───────── Encabezado ───────── -->
  <div class="section-head intro">
    <div>
      <div class="eyebrow rise" style="--i: 0">Soporte</div>
      <h2 class="headline" aria-label={title}>
        {#each words as word, i}
          <span class="word" aria-hidden="true"
          ><span class="word-in" style="--w: {i}">{word}</span></span
          >{' '}
        {/each}
      </h2>
    </div>
    <p class="rise" style="--i: 4">
      Reporta fallos, dudas de mantenimiento o incidencias. Recibirás un código de seguimiento para consultar el
      estado sin necesidad de cuenta.
    </p>
  </div>

  <div class="layout">
    {#if createdCode}
      <!-- ───────── Confirmación ───────── -->
      <div
              class="card form-card success-card"
              role="status"
              in:scale={{ start: 0.96, duration: ms(400), easing: cubicOut }}
      >
        <svg class="check" viewBox="0 0 52 52" aria-hidden="true">
          <circle cx="26" cy="26" r="24" />
          <path d="M14 27l8 8 16-17" />
        </svg>
        <h3 tabindex="-1" use:focusOnMount>Ticket registrado</h3>
        <p class="success-lead">
          Nuestro equipo revisará tu caso. Conserva el código para seguir la conversación en cualquier momento.
        </p>

        <div class="code-box">
          <span class="code-label">Código de seguimiento</span>
          <strong class="code-value" aria-label={createdCode}>
            {#each createdCode.split('') as ch, i}
              <span class="ch" aria-hidden="true" style="--i: {i}">{ch}</span>
            {/each}
          </strong>
          <button type="button" class="btn btn-ghost btn-copy" onclick={copyCode}>
            {copied ? 'Copiado ✓' : 'Copiar'}
          </button>
        </div>

        <div class="success-actions">
          <a class="btn btn-primary" href={`/seguimiento?code=${encodeURIComponent(createdCode)}`}>
            Ver seguimiento <span class="arrow" aria-hidden="true">→</span>
          </a>
          <button type="button" class="btn btn-ghost" onclick={resetForm}>Abrir otro ticket</button>
        </div>
      </div>
    {:else}
      <!-- ───────── Formulario ───────── -->
      <form class="card form-card rv" use:reveal onsubmit={submit} novalidate>
        <div class="grid-2">
          <div class="field" class:invalid={touched.name && errors.name}>
            <label for="sup-name">Nombre completo</label>
            <input
                    id="sup-name"
                    bind:value={name}
                    onblur={() => (touched.name = true)}
                    autocomplete="name"
                    placeholder="Tu nombre"
                    aria-invalid={touched.name && !!errors.name}
                    aria-describedby={touched.name && errors.name ? 'err-name' : undefined}
            />
            {#if touched.name && errors.name}
              <p class="field-error" id="err-name" transition:slide={{ duration: ms(200) }}>{errors.name}</p>
            {/if}
          </div>
          <div class="field" class:invalid={touched.email && errors.email}>
            <label for="sup-email">Correo</label>
            <input
                    id="sup-email"
                    type="email"
                    bind:value={email}
                    onblur={() => (touched.email = true)}
                    autocomplete="email"
                    placeholder="tu@correo.com"
                    aria-invalid={touched.email && !!errors.email}
                    aria-describedby={touched.email && errors.email ? 'err-email' : undefined}
            />
            {#if touched.email && errors.email}
              <p class="field-error" id="err-email" transition:slide={{ duration: ms(200) }}>{errors.email}</p>
            {/if}
          </div>
        </div>

        <div class="field">
          <label for="sup-phone">Teléfono / WhatsApp (opcional)</label>
          <input id="sup-phone" type="tel" bind:value={phone} autocomplete="tel" placeholder="+53 ..." />
        </div>

        <fieldset class="field subjects">
          <legend>Tipo de incidencia</legend>
          <div class="pills">
            {#each SUBJECTS as s (s.value)}
              <label class="pill">
                <input type="radio" name="subject" value={s.value} bind:group={subject} />
                <span>{s.label}</span>
              </label>
            {/each}
          </div>
        </fieldset>

        <div class="field" class:invalid={!!reservationError}>
          <label for="sup-res">Código de reserva relacionado (opcional)</label>
          <input
                  id="sup-res"
                  bind:value={reservationCode}
                  oninput={() => {
              reservationCode = reservationCode.toUpperCase();
              reservationError = '';
            }}
                  placeholder="SLX-XXXXXXXX"
                  spellcheck="false"
                  autocomplete="off"
                  aria-invalid={!!reservationError}
                  aria-describedby={reservationError ? 'err-res' : 'hint-res'}
          />
          {#if reservationError}
            <p class="field-error" id="err-res" transition:slide={{ duration: ms(200) }}>{reservationError}</p>
          {:else}
            <p class="field-hint" id="hint-res">Si el problema es de una visita ya registrada, indícalo aquí.</p>
          {/if}
        </div>

        <div class="field" class:invalid={touched.description && errors.description}>
          <label for="sup-desc">Describe el problema</label>
          <textarea
                  id="sup-desc"
                  bind:value={description}
                  onblur={() => (touched.description = true)}
                  placeholder="Qué ocurre, desde cuándo, equipos involucrados, mensajes de error..."
                  rows="5"
                  aria-invalid={touched.description && !!errors.description}
                  aria-describedby={touched.description && errors.description ? 'err-desc' : undefined}
          ></textarea>
          {#if touched.description && errors.description}
            <p class="field-error" id="err-desc" transition:slide={{ duration: ms(200) }}>{errors.description}</p>
          {/if}
        </div>

        {#if formError}
          <p class="form-error" role="alert" transition:slide={{ duration: ms(200) }}>{formError}</p>
        {/if}

        <button class="btn btn-primary submit" type="submit" disabled={submitting}>
          {#if submitting}
            <span class="spinner" aria-hidden="true"></span>Enviando…
          {:else}
            Abrir ticket de soporte <span class="arrow" aria-hidden="true">→</span>
          {/if}
        </button>
        <p class="hint">
          Esto crea un ticket técnico con historial. Para presupuestos o consultas comerciales usa
          <a href="/contacto">Contacto</a>.
        </p>
      </form>
    {/if}

    <!-- ───────── Qué pasa después ───────── -->
    <aside class="card side rv" use:reveal={120}>
      <h3>¿Qué pasa después?</h3>
      <ol class="timeline">
        <li style="--i: 0">
          <span class="node" aria-hidden="true">1</span>
          <span>Recibes un código <strong>SLX-…</strong></span>
        </li>
        <li style="--i: 1">
          <span class="node" aria-hidden="true">2</span>
          <span>El equipo de soporte revisa el caso</span>
        </li>
        <li style="--i: 2">
          <span class="node" aria-hidden="true">3</span>
          <span>Consultas respuestas en <a href="/seguimiento">Seguimiento</a></span>
        </li>
      </ol>
      <div class="notice">
        <span class="live" aria-hidden="true"></span>
        <span>
          Tiempo orientativo de primera respuesta: <strong>menos de 24 horas</strong> en días laborables.
        </span>
      </div>
    </aside>
  </div>
</section>

{#if toastShow}
  <div
          class="toast"
          role="status"
          in:fly={{ y: 24, duration: ms(300), easing: cubicOut }}
          out:fade={{ duration: ms(200) }}
  >
    {toastText}
  </div>
{/if}

<style>
  .page {
    --ease: cubic-bezier(0.22, 1, 0.36, 1);
    isolation: isolate;
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

  /* ───────── Layout ───────── */
  .layout {
    display: grid;
    grid-template-columns: 1fr 0.7fr;
    gap: 22px;
    align-items: start;
  }
  .form-card {
    padding: clamp(20px, 3vw, 30px);
  }
  .grid-2 {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 12px;
  }

  /* ───────── Campos ───────── */
  .field {
    margin: 0 0 16px;
    padding: 0;
    border: 0;
    min-width: 0;
  }
  .field label,
  .field legend {
    display: block;
    margin-bottom: 8px;
    padding: 0;
    font-size: 12px;
    font-weight: 700;
    color: var(--color-muted);
  }
  .field input:not([type='radio']),
  .field textarea {
    width: 100%;
    box-sizing: border-box;
    border: 1px solid var(--color-border);
    background: var(--color-bg);
    color: var(--color-text);
    padding: 12px 14px;
    border-radius: 12px;
    font: inherit;
    font-size: 14px;
    transition:
            border-color 0.25s var(--ease),
            box-shadow 0.25s var(--ease);
  }
  .field textarea {
    resize: vertical;
    min-height: 120px;
  }
  .field input:not([type='radio']):focus,
  .field textarea:focus {
    outline: none;
    border-color: var(--color-primary);
    box-shadow: 0 0 0 3px color-mix(in srgb, var(--color-primary) 20%, transparent);
  }
  .field.invalid input,
  .field.invalid textarea {
    border-color: #c0392b;
  }
  .field.invalid input:focus,
  .field.invalid textarea:focus {
    box-shadow: 0 0 0 3px color-mix(in srgb, #c0392b 20%, transparent);
  }
  .field-error {
    margin: 6px 0 0;
    font-size: 12px;
    color: #a93226;
  }
  .field-hint {
    margin: 6px 0 0;
    font-size: 12px;
    color: var(--color-muted);
  }

  /* Tipo de incidencia: opciones tipo pastilla */
  .pills {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }
  .pill {
    position: relative;
    margin: 0 !important;
    cursor: pointer;
  }
  .pill input {
    position: absolute;
    opacity: 0;
    inset: 0;
    margin: 0;
    cursor: pointer;
  }
  .pill span {
    display: inline-block;
    padding: 8px 14px;
    border: 1px solid var(--color-border);
    border-radius: 999px;
    color: var(--color-muted);
    font-size: 12px;
    font-weight: 700;
    transition:
            transform 0.25s var(--ease),
            border-color 0.25s var(--ease),
            color 0.25s var(--ease),
            background 0.25s var(--ease);
  }
  .pill:hover span {
    transform: translateY(-2px);
    border-color: var(--color-primary);
  }
  .pill input:checked + span {
    border-color: var(--color-primary);
    color: var(--color-primary);
    background: color-mix(in srgb, var(--color-primary) 12%, transparent);
  }
  .pill input:focus-visible + span {
    outline: 2px solid var(--color-primary);
    outline-offset: 2px;
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
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    width: 100%;
    transition:
            transform 0.25s var(--ease),
            opacity 0.25s var(--ease);
  }
  .submit:not(:disabled):hover {
    transform: translateY(-2px);
  }
  .submit:not(:disabled):active {
    transform: scale(0.99);
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
  .hint {
    margin: 12px 0 0;
    font-size: 12px;
    color: var(--color-muted);
    line-height: 1.45;
  }
  .hint a {
    color: var(--color-primary);
    font-weight: 700;
  }

  /* ───────── Panel lateral ───────── */
  .side {
    position: sticky;
    top: 24px;
    padding: 24px;
  }
  .side h3 {
    margin: 0 0 18px;
    font-size: 18px;
  }
  .side a {
    color: var(--color-primary);
    font-weight: 700;
  }

  /* Línea de tiempo: se dibuja al aparecer */
  .timeline {
    position: relative;
    list-style: none;
    margin: 0 0 18px;
    padding: 0;
    display: grid;
    gap: 18px;
    color: var(--color-muted);
    font-size: 14px;
    line-height: 1.5;
  }
  .timeline::before {
    content: '';
    position: absolute;
    left: 13px;
    top: 14px;
    bottom: 14px;
    width: 2px;
    border-radius: 2px;
    background: linear-gradient(var(--color-primary), var(--color-accent));
    transform: scaleY(0);
    transform-origin: top;
    transition: transform 1.2s var(--ease) 0.4s;
  }
  .side:global(.in) .timeline::before {
    transform: scaleY(1);
  }
  .timeline li {
    position: relative;
    display: flex;
    gap: 12px;
    align-items: flex-start;
    opacity: 0;
    transform: translateX(-8px);
    transition:
            opacity 0.5s var(--ease),
            transform 0.5s var(--ease);
    transition-delay: calc(350ms + var(--i) * 220ms);
  }
  .side:global(.in) .timeline li {
    opacity: 1;
    transform: none;
  }
  .node {
    flex: 0 0 28px;
    width: 28px;
    height: 28px;
    display: grid;
    place-items: center;
    border-radius: 50%;
    background: var(--color-primary);
    color: white;
    font-size: 12px;
    font-weight: 800;
  }
  .timeline li > span:last-child {
    padding-top: 3px;
  }
  .notice {
    display: flex;
    gap: 10px;
    align-items: flex-start;
    padding: 12px 14px;
    border-radius: 12px;
    background: var(--color-surface-2, var(--color-border));
    font-size: 13px;
  }
  .live {
    flex: 0 0 8px;
    width: 8px;
    height: 8px;
    margin-top: 5px;
    border-radius: 50%;
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

  /* ───────── Confirmación ───────── */
  .success-card {
    text-align: center;
  }
  .check {
    width: 68px;
    height: 68px;
    margin: 0 auto 10px;
    display: block;
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
  .success-card h3 {
    margin: 0 0 8px;
    outline: none;
  }
  .success-lead {
    margin: 0 0 18px;
    color: var(--color-muted);
    font-size: 14px;
    line-height: 1.5;
  }
  .code-box {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8px;
    padding: 18px;
    border-radius: 16px;
    border: 1px dashed color-mix(in srgb, var(--color-primary) 40%, var(--color-border));
    background: color-mix(in srgb, var(--color-primary) 8%, var(--color-surface));
    margin-bottom: 18px;
  }
  .code-label {
    font-size: 12px;
    font-weight: 700;
    color: var(--color-muted);
  }
  .code-value {
    display: inline-flex;
    flex-wrap: wrap;
    justify-content: center;
    font-size: 28px;
    letter-spacing: 0.08em;
    color: var(--color-primary);
    font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
  }
  /* El código aparece carácter a carácter */
  .ch {
    display: inline-block;
    animation: ch-in 0.5s var(--ease) both;
    animation-delay: calc(0.9s + var(--i) * 45ms);
  }
  @keyframes ch-in {
    from {
      opacity: 0;
      transform: translateY(10px) scale(0.8);
    }
  }
  .btn-copy {
    font-size: 12px;
    padding: 6px 12px;
  }
  .success-actions {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  /* ───────── Aviso (toast) ───────── */
  .toast {
    position: fixed;
    left: 50%;
    bottom: 24px;
    translate: -50% 0;
    z-index: 50;
    max-width: min(92vw, 420px);
    padding: 12px 18px;
    border-radius: 999px;
    background: var(--color-text);
    color: var(--color-bg);
    font-size: 13px;
    font-weight: 600;
    text-align: center;
    box-shadow: var(--color-shadow);
  }

  /* ───────── Responsive ───────── */
  @media (max-width: 900px) {
    .layout {
      grid-template-columns: 1fr;
    }
    .side {
      position: static;
    }
  }
  @media (max-width: 600px) {
    .grid-2 {
      grid-template-columns: 1fr;
      gap: 0;
    }
  }

  /* ───────── Accesibilidad: reduce el movimiento ───────── */
  @media (prefers-reduced-motion: reduce) {
    .rise,
    .word-in,
    .spinner,
    .live,
    .ch {
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
    .timeline::before {
      transform: scaleY(1);
      transition: none;
    }
    .timeline li {
      opacity: 1;
      transform: none;
      transition: none;
    }
    .pill span,
    .submit,
    .arrow,
    .field input,
    .field textarea {
      transition: none;
    }
  }
</style>