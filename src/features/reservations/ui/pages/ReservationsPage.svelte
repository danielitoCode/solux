<script lang="ts">
  import { onMount } from 'svelte';
  import { getReservationRepository } from '$features/reservations/di';
  import { devLog, devError } from '$infrastructure/ui/dev-logger';
  import { readLeadFromLocation, type LeadIntent, type LeadSource } from '$infrastructure/ui/lead-context';

  const SERVICE_OPTIONS = [
    {
      id: 'solar',
      category: 'solar_kits',
      title: '☀ Instalación solar',
      subtitle: 'Hogar o negocio'
    },
    {
      id: 'electric',
      category: 'electrical_installation',
      title: '⌁ Instalación eléctrica',
      subtitle: 'Residencial o comercial'
    },
    {
      id: 'maintenance',
      category: 'maintenance',
      title: '✓ Mantenimiento',
      subtitle: 'Revisión y soporte'
    },
    {
      id: 'advice',
      category: 'advisory',
      title: '◎ Asesoría',
      subtitle: 'Dimensionamiento'
    }
  ] as const;

  const TIME_SLOTS = [
    { value: 'morning', label: 'Mañana (8:00 – 12:00)' },
    { value: 'afternoon', label: 'Tarde (12:00 – 17:00)' },
    { value: 'evening', label: 'Final del día (17:00 – 19:00)' },
    { value: 'flexible', label: 'Flexible / a convenir' }
  ] as const;

  let selectedService = $state<(typeof SERVICE_OPTIONS)[number]['id']>('solar');
  let name = $state('');
  let email = $state('');
  let date = $state('');
  let timeSlot = $state<(typeof TIME_SLOTS)[number]['value']>('flexible');
  let phone = $state('');
  let address = $state('');
  let message = $state('');

  let leadIntent = $state<LeadIntent>('install');
  let leadSource = $state<LeadSource>('direct');

  let submitting = $state(false);
  let formError = $state('');
  let toastText = $state('');
  let toastShow = $state(false);

  let createdCode = $state<string | null>(null);
  let createdService = $state('');

  function selectService(id: (typeof SERVICE_OPTIONS)[number]['id']) {
    selectedService = id;
  }

  function showToast(text: string) {
    toastText = text;
    toastShow = true;
    setTimeout(() => (toastShow = false), 4200);
  }

  function categoryForService(id: string) {
    return SERVICE_OPTIONS.find((s) => s.id === id)?.category ?? 'advisory';
  }

  function labelForService(id: string) {
    return SERVICE_OPTIONS.find((s) => s.id === id)?.title ?? id;
  }

  async function submit() {
    formError = '';
    if (!name.trim() || !email.trim() || !date || !phone.trim()) {
      formError = 'Completa nombre, correo, teléfono y fecha preferida.';
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
      const reservation = await getReservationRepository().create({
        customerName: name.trim(),
        customerEmail: email.trim(),
        customerPhone: phone.trim(),
        serviceCategory: categoryForService(selectedService),
        preferredDate: date,
        preferredTimeSlot: timeSlot,
        address: address.trim() || 'Guantánamo',
        notes: message.trim() || undefined,
        source: leadSource,
        intent: leadIntent
      });
      devLog('reservas-public', 'created', reservation.trackingCode);
      createdCode = reservation.trackingCode;
      createdService = labelForService(selectedService);
      showToast(`Solicitud registrada. Código ${reservation.trackingCode}`);
    } catch (e) {
      devError('reservas-public', 'create failed', e, {
        file: 'ReservationsPage.svelte'
      });
      formError =
        e instanceof Error ? e.message : 'No se pudo enviar la solicitud. Intenta de nuevo.';
      showToast(formError);
    } finally {
      submitting = false;
    }
  }

  function resetForm() {
    createdCode = null;
    createdService = '';
    name = '';
    email = '';
    date = '';
    timeSlot = 'flexible';
    phone = '';
    address = '';
    message = '';
    formError = '';
    selectedService = 'solar';
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

  onMount(() => {
    const lead = readLeadFromLocation({ intent: 'install', source: 'direct' });
    leadIntent = lead.intent;
    leadSource = lead.source;
    const q = new URLSearchParams(location.search);
    const itemName = q.get('name')?.trim();
    if (itemName && !message.trim()) {
      message = `Interesado en instalar / kit: ${itemName}`;
    }
    // Prefer solar kit service when coming from catalog install
    if (lead.source === 'catalog' && lead.intent === 'install') {
      selectedService = 'solar';
    } else if (lead.intent === 'maintain') {
      selectedService = 'maintenance';
    } else if (lead.intent === 'advisory') {
      selectedService = 'advice';
    }
  });
</script>

<section class="page">
  <div class="section-head">
    <div>
      <div class="eyebrow">Reservas</div>
      <h2>Solicita tu visita técnica.</h2>
    </div>
    <p>
      Cuéntanos qué necesitas. Priorizamos visitas a domicilio en Guantánamo para evaluar el proyecto en el lugar.
    </p>
  </div>

  <div class="reservation">
    {#if createdCode}
      <div class="card form-card success-card">
        <div class="success-icon">✓</div>
        <h3>Solicitud registrada</h3>
        <p class="success-lead">
          Guardamos tu pedido de visita. Conserva este código de seguimiento para consultar el estado de tu reserva.
        </p>
        <div class="code-box">
          <span class="code-label">Código de seguimiento</span>
          <strong class="code-value">{createdCode}</strong>
          <button type="button" class="btn btn-ghost btn-copy" onclick={copyCode}>Copiar</button>
        </div>
        <ul class="success-meta">
          <li><span>Servicio</span><strong>{createdService}</strong></li>
          <li><span>Estado inicial</span><strong>Pendiente de confirmación</strong></li>
        </ul>
        <p class="hint">
          SOLUX se pondrá en contacto contigo en menos de 24 horas. La solicitud no confirma automáticamente la visita.
        </p>
        <div class="success-actions">
          <a class="btn btn-primary" href={`/seguimiento?code=${encodeURIComponent(createdCode)}`}>
            Ver seguimiento
          </a>
          <button type="button" class="btn btn-ghost" style="width: 100%" onclick={resetForm}>
            Hacer otra solicitud
          </button>
        </div>
      </div>
    {:else}
      <div class="card form-card">
        <div class="steps">
          <div class="step active">1 · Servicio</div>
          <div class="step">2 · Fecha y hora</div>
          <div class="step">3 · Tus datos</div>
        </div>

        <div class="field">
          <p class="field-label" id="service-label">¿Qué necesitas?</p>
          <div class="choice-grid" role="group" aria-labelledby="service-label">
            {#each SERVICE_OPTIONS as opt}
              <button
                type="button"
                class="choice"
                class:selected={selectedService === opt.id}
                onclick={() => selectService(opt.id)}
              >
                <strong>{opt.title}</strong>
                <small>{opt.subtitle}</small>
              </button>
            {/each}
          </div>
        </div>

        <div class="grid-2">
          <div class="field">
            <label for="preferred-date">Fecha preferida</label>
            <input id="preferred-date" type="date" bind:value={date} />
          </div>
          <div class="field">
            <label for="preferred-slot">Franja horaria</label>
            <select id="preferred-slot" bind:value={timeSlot}>
              {#each TIME_SLOTS as slot}
                <option value={slot.value}>{slot.label}</option>
              {/each}
            </select>
          </div>
        </div>

        <div class="grid-2">
          <div class="field">
            <label for="customer-name">Nombre completo</label>
            <input id="customer-name" placeholder="Tu nombre" bind:value={name} autocomplete="name" />
          </div>
          <div class="field">
            <label for="customer-email">Correo</label>
            <input
              id="customer-email"
              type="email"
              placeholder="tu@correo.com"
              bind:value={email}
              autocomplete="email"
            />
          </div>
        </div>

        <div class="grid-2">
          <div class="field">
            <label for="customer-phone">Teléfono / WhatsApp</label>
            <input id="customer-phone" placeholder="+53 ..." bind:value={phone} autocomplete="tel" />
          </div>
          <div class="field">
            <label for="customer-address">Zona / dirección aproximada</label>
            <input
              id="customer-address"
              placeholder="Municipio, reparto o referencia"
              bind:value={address}
            />
          </div>
        </div>

        <div class="field">
          <label for="reservation-message">Cuéntanos brevemente</label>
          <textarea
            id="reservation-message"
            placeholder="Por ejemplo: necesito paneles para una vivienda con refrigerador, bombas y ventiladores..."
            bind:value={message}
          ></textarea>
        </div>

        {#if formError}
          <p class="form-error" role="alert">{formError}</p>
        {/if}

        <button
          class="btn btn-primary"
          style="width: 100%"
          type="button"
          disabled={submitting}
          onclick={submit}
        >
          {submitting ? 'Enviando…' : 'Solicitar visita técnica →'}
        </button>
        <p class="hint">
          La solicitud no confirma automáticamente la visita. SOLUX se pondrá en contacto para coordinarla. Recibirás un
          código de seguimiento al enviar.
        </p>
      </div>
    {/if}

    <aside class="card reserve-side">
      <div class="icon">⌖</div>
      <h3>Visita técnica en Guantánamo</h3>
      <p>
        Preferimos conocer el lugar antes de recomendar equipos. Así dimensionamos correctamente el sistema y evitamos
        gastos innecesarios.
      </p>
      <ul class="check-list">
        <li>Evaluación del espacio disponible</li>
        <li>Revisión de instalación eléctrica</li>
        <li>Estimación de consumo y respaldo</li>
        <li>Recomendación de configuración</li>
      </ul>
      <div class="notice">Tiempo estimado de respuesta: <strong>menos de 24 horas</strong>.</div>
    </aside>
  </div>
</section>

<div class="toast" class:show={toastShow} role="status">{toastText}</div>

<style>
  .reservation {
    display: grid;
    grid-template-columns: 1fr 0.72fr;
    gap: 22px;
    align-items: start;
  }
  .form-card {
    padding: 30px;
  }
  .steps {
    display: flex;
    gap: 8px;
    margin-bottom: 28px;
  }
  .step {
    flex: 1;
    padding: 11px;
    border-radius: 12px;
    background: var(--color-surface-2);
    color: var(--color-muted);
    font-size: 11px;
    font-weight: 700;
    text-align: center;
  }
  .step.active {
    background: var(--color-primary);
    color: white;
  }
  .choice-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 10px;
  }
  .choice {
    border: 1px solid var(--color-border);
    background: var(--color-surface);
    padding: 14px;
    border-radius: 14px;
    text-align: left;
    color: var(--color-text);
    transition: 0.2s;
  }
  .choice strong {
    display: block;
    font-size: 13px;
    margin-bottom: 4px;
  }
  .choice small {
    color: var(--color-muted);
    font-size: 11px;
  }
  .choice.selected {
    border-color: var(--color-primary);
    background: color-mix(in srgb, var(--color-primary) 10%, var(--color-surface));
    box-shadow: 0 0 0 1px color-mix(in srgb, var(--color-primary) 35%, transparent);
  }
  .field {
    margin-bottom: 16px;
  }
  .field-label,
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
    min-height: 100px;
    resize: vertical;
  }
  .grid-2 {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 12px;
  }
  .hint {
    margin: 12px 0 0;
    font-size: 12px;
    color: var(--color-muted);
    line-height: 1.45;
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
  .reserve-side {
    padding: 28px;
    position: sticky;
    top: 24px;
  }
  .reserve-side .icon {
    width: 44px;
    height: 44px;
    border-radius: 14px;
    display: grid;
    place-items: center;
    background: color-mix(in srgb, var(--color-primary) 14%, transparent);
    color: var(--color-primary);
    font-size: 20px;
    margin-bottom: 14px;
  }
  .reserve-side h3 {
    margin: 0 0 10px;
    font-size: 18px;
  }
  .reserve-side p {
    margin: 0 0 14px;
    color: var(--color-muted);
    font-size: 14px;
    line-height: 1.5;
  }
  .check-list {
    margin: 0 0 16px;
    padding: 0;
    list-style: none;
  }
  .check-list li {
    position: relative;
    padding: 6px 0 6px 22px;
    font-size: 13px;
  }
  .check-list li::before {
    content: '✓';
    position: absolute;
    left: 0;
    color: var(--color-primary);
    font-weight: 800;
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
    font-size: 22px;
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
  .success-meta {
    list-style: none;
    margin: 0 0 16px;
    padding: 0;
    text-align: left;
  }
  .success-meta li {
    display: flex;
    justify-content: space-between;
    gap: 12px;
    padding: 10px 0;
    border-bottom: 1px solid var(--color-border);
    font-size: 13px;
  }
  .success-meta span {
    color: var(--color-muted);
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
    .reservation {
      grid-template-columns: 1fr;
    }
    .reserve-side {
      position: static;
    }
  }
  @media (max-width: 600px) {
    .choice-grid,
    .grid-2 {
      grid-template-columns: 1fr;
    }
  }
</style>
