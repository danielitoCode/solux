<script lang="ts">
  import { getSupportRepository } from '$features/support/di';
  import { getReservationRepository } from '$features/reservations/di';
  import { devLog, devError } from '$infrastructure/ui/dev-logger';

  const SUBJECTS = [
    { value: 'Fallo en instalación solar', label: 'Fallo en instalación solar' },
    { value: 'Problema eléctrico', label: 'Problema eléctrico' },
    { value: 'Consulta de mantenimiento', label: 'Consulta de mantenimiento' },
    { value: 'Seguimiento de reserva', label: 'Seguimiento de reserva' },
    { value: 'Otro', label: 'Otro' }
  ] as const;

  let name = $state('');
  let email = $state('');
  let phone = $state('');
  let subject = $state<(typeof SUBJECTS)[number]['value']>('Fallo en instalación solar');
  let description = $state('');
  let reservationCode = $state('');

  let submitting = $state(false);
  let formError = $state('');
  let toastText = $state('');
  let toastShow = $state(false);

  let createdCode = $state<string | null>(null);

  function showToast(text: string) {
    toastText = text;
    toastShow = true;
    setTimeout(() => (toastShow = false), 4200);
  }

  async function submit() {
    formError = '';
    if (!name.trim() || !email.trim() || !description.trim()) {
      formError = 'Completa nombre, correo y descripción del problema.';
      showToast(formError);
      return;
    }
    if (!/[^\s@]+@[^\s@]+\.[^\s@]+/.test(email.trim())) {
      formError = 'Indica un correo válido.';
      showToast(formError);
      return;
    }

    submitting = true;
    try {
      let relatedReservationId: string | undefined;
      const code = reservationCode.trim().toUpperCase();
      if (code) {
        const reservation = await getReservationRepository().getByTrackingCode(code);
        if (!reservation) {
          formError = 'No encontramos una reserva con ese código. Déjalo vacío o corrígelo.';
          showToast(formError);
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
    name = '';
    email = '';
    phone = '';
    subject = 'Fallo en instalación solar';
    description = '';
    reservationCode = '';
    formError = '';
  }

  async function copyCode() {
    if (!createdCode || typeof navigator === 'undefined') return;
    try {
      await navigator.clipboard.writeText(createdCode);
      showToast('Código copiado al portapapeles');
    } catch {
      showToast(createdCode);
    }
  }
</script>

<svelte:head>
  <title>Soporte técnico | SOLUX</title>
</svelte:head>

<section class="page">
  <div class="section-head">
    <div>
      <div class="eyebrow">Soporte</div>
      <h2>Abre un ticket técnico.</h2>
    </div>
    <p>
      Reporta fallos, dudas de mantenimiento o incidencias. Recibirás un código de seguimiento para consultar el estado
      sin necesidad de cuenta.
    </p>
  </div>

  <div class="layout">
    {#if createdCode}
      <div class="card form-card success-card">
        <div class="success-icon">✓</div>
        <h3>Ticket registrado</h3>
        <p class="success-lead">
          Nuestro equipo revisará tu caso. Conserva el código para seguir la conversación en cualquier momento.
        </p>
        <div class="code-box">
          <span class="code-label">Código de seguimiento</span>
          <strong class="code-value">{createdCode}</strong>
          <button type="button" class="btn btn-ghost btn-copy" onclick={copyCode}>Copiar</button>
        </div>
        <div class="success-actions">
          <a class="btn btn-primary" href={`/seguimiento?code=${encodeURIComponent(createdCode)}`}>
            Ver seguimiento
          </a>
          <button type="button" class="btn btn-ghost" onclick={resetForm}>Abrir otro ticket</button>
        </div>
      </div>
    {:else}
      <div class="card form-card">
        <div class="grid-2">
          <div class="field">
            <label for="sup-name">Nombre completo</label>
            <input id="sup-name" bind:value={name} autocomplete="name" placeholder="Tu nombre" />
          </div>
          <div class="field">
            <label for="sup-email">Correo</label>
            <input id="sup-email" type="email" bind:value={email} autocomplete="email" placeholder="tu@correo.com" />
          </div>
        </div>

        <div class="grid-2">
          <div class="field">
            <label for="sup-phone">Teléfono / WhatsApp (opcional)</label>
            <input id="sup-phone" bind:value={phone} autocomplete="tel" placeholder="+53 ..." />
          </div>
          <div class="field">
            <label for="sup-subject">Tipo de incidencia</label>
            <select id="sup-subject" bind:value={subject}>
              {#each SUBJECTS as s}
                <option value={s.value}>{s.label}</option>
              {/each}
            </select>
          </div>
        </div>

        <div class="field">
          <label for="sup-res">Código de reserva relacionado (opcional)</label>
          <input
            id="sup-res"
            bind:value={reservationCode}
            placeholder="SLX-XXXXXXXX"
            spellcheck="false"
            autocomplete="off"
          />
          <p class="field-hint">Si el problema es de una visita ya registrada, indícalo aquí.</p>
        </div>

        <div class="field">
          <label for="sup-desc">Describe el problema</label>
          <textarea
            id="sup-desc"
            bind:value={description}
            placeholder="Qué ocurre, desde cuándo, equipos involucrados, mensajes de error..."
            rows="5"
          ></textarea>
        </div>

        {#if formError}
          <p class="form-error" role="alert">{formError}</p>
        {/if}

        <button class="btn btn-primary" style="width: 100%" type="button" disabled={submitting} onclick={submit}>
          {submitting ? 'Enviando…' : 'Abrir ticket de soporte →'}
        </button>
        <p class="hint">
          Esto crea un ticket técnico con historial. Para presupuestos o consultas comerciales usa
          <a href="/contacto">Contacto</a>.
        </p>
      </div>
    {/if}

    <aside class="card side">
      <h3>¿Qué pasa después?</h3>
      <ol>
        <li>Recibes un código <strong>SLX-…</strong></li>
        <li>El equipo de soporte revisa el caso</li>
        <li>Consultas respuestas en <a href="/seguimiento">Seguimiento</a></li>
      </ol>
      <div class="notice">
        Tiempo orientativo de primera respuesta: <strong>menos de 24 horas</strong> en días laborables.
      </div>
    </aside>
  </div>
</section>

<div class="toast" class:show={toastShow} role="status">{toastText}</div>

<style>
  .layout {
    display: grid;
    grid-template-columns: 1fr 0.7fr;
    gap: 22px;
    align-items: start;
  }
  .form-card {
    padding: 28px;
  }
  .grid-2 {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 12px;
  }
  .field {
    margin-bottom: 14px;
  }
  .field label {
    display: block;
    margin-bottom: 8px;
    font-size: 12px;
    font-weight: 700;
    color: var(--color-muted);
    text-transform: uppercase;
    letter-spacing: 0.06em;
  }
  .field input,
  .field select,
  .field textarea {
    width: 100%;
    box-sizing: border-box;
    border: 1px solid var(--color-border);
    background: var(--color-bg);
    color: var(--color-text);
    padding: 12px 14px;
    border-radius: 12px;
    font-size: 14px;
  }
  .field textarea {
    resize: vertical;
    min-height: 120px;
  }
  .field-hint {
    margin: 6px 0 0;
    font-size: 12px;
    color: var(--color-muted);
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
  .form-error {
    margin: 0 0 12px;
    padding: 10px 12px;
    border-radius: 10px;
    background: color-mix(in srgb, #c0392b 12%, var(--color-surface));
    border: 1px solid color-mix(in srgb, #c0392b 30%, var(--color-border));
    color: #a93226;
    font-size: 13px;
  }
  .side {
    padding: 24px;
    position: sticky;
    top: 24px;
  }
  .side h3 {
    margin: 0 0 12px;
    font-size: 18px;
  }
  .side ol {
    margin: 0 0 16px;
    padding-left: 18px;
    color: var(--color-muted);
    font-size: 14px;
    line-height: 1.55;
  }
  .side a {
    color: var(--color-primary);
    font-weight: 700;
  }
  .notice {
    padding: 12px 14px;
    border-radius: 12px;
    background: var(--color-surface-2);
    font-size: 13px;
  }
  .success-card {
    text-align: center;
  }
  .success-icon {
    width: 56px;
    height: 56px;
    margin: 0 auto 14px;
    border-radius: 18px;
    display: grid;
    place-items: center;
    background: color-mix(in srgb, #27ae60 18%, transparent);
    color: #1e8449;
    font-size: 26px;
    font-weight: 800;
  }
  .success-card h3 {
    margin: 0 0 8px;
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
    font-size: 11px;
    font-weight: 800;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: var(--color-muted);
  }
  .code-value {
    font-size: 28px;
    letter-spacing: 0.08em;
    color: var(--color-primary);
    font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
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
  .toast {
    position: fixed;
    left: 50%;
    bottom: 24px;
    transform: translateX(-50%) translateY(120%);
    background: var(--color-text);
    color: var(--color-bg);
    padding: 12px 18px;
    border-radius: 999px;
    font-size: 13px;
    font-weight: 600;
    opacity: 0;
    transition: 0.25s ease;
    z-index: 50;
    max-width: min(92vw, 420px);
    text-align: center;
  }
  .toast.show {
    opacity: 1;
    transform: translateX(-50%) translateY(0);
  }
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
    }
  }
</style>
