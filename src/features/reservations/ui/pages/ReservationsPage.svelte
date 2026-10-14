<script lang="ts">
  let selectedService = $state('solar');
  let name = $state('');
  let date = $state('');
  let phone = $state('');
  let address = $state('');
  let message = $state('');
  let toastText = $state('');
  let toastShow = $state(false);

  function selectService(id: string) {
    selectedService = id;
  }

  function submit() {
    if (!name.trim() || !date) {
      showToast('Completa al menos tu nombre y fecha preferida.');
      return;
    }
    showToast('Solicitud recibida. SOLUX se pondrá en contacto contigo.');
  }

  function showToast(text: string) {
    toastText = text;
    toastShow = true;
    setTimeout(() => (toastShow = false), 3200);
  }
</script>

<section class="page">
  <div class="section-head">
    <div>
      <div class="eyebrow">Reservas</div>
      <h2>Solicita tu visita técnica.</h2>
    </div>
    <p>Cuéntanos qué necesitas. Priorizamos visitas a domicilio en Guantánamo para evaluar el proyecto en el lugar.</p>
  </div>

  <div class="reservation">
    <div class="card form-card">
      <div class="steps">
        <div class="step active">1 · Servicio</div>
        <div class="step">2 · Fecha y hora</div>
        <div class="step">3 · Tus datos</div>
      </div>

      <div class="field">
        <label>¿Qué necesitas?</label>
        <div class="choice-grid">
          <button
            type="button"
            class="choice"
            class:selected={selectedService === 'solar'}
            onclick={() => selectService('solar')}
          >
            <strong>☀ Instalación solar</strong>
            <small>Hogar o negocio</small>
          </button>
          <button
            type="button"
            class="choice"
            class:selected={selectedService === 'electric'}
            onclick={() => selectService('electric')}
          >
            <strong>⌁ Instalación eléctrica</strong>
            <small>Residencial o comercial</small>
          </button>
          <button
            type="button"
            class="choice"
            class:selected={selectedService === 'maintenance'}
            onclick={() => selectService('maintenance')}
          >
            <strong>✓ Mantenimiento</strong>
            <small>Revisión y soporte</small>
          </button>
          <button
            type="button"
            class="choice"
            class:selected={selectedService === 'advice'}
            onclick={() => selectService('advice')}
          >
            <strong>✦ Asesoría / presupuesto</strong>
            <small>Evaluación técnica</small>
          </button>
        </div>
      </div>

      <div class="two">
        <div class="field">
          <label>Fecha preferida</label>
          <input type="date" bind:value={date} />
        </div>
        <div class="field">
          <label>Horario</label>
          <select>
            <option>08:00 – 10:00</option>
            <option>10:00 – 12:00</option>
            <option>13:00 – 15:00</option>
            <option>15:00 – 17:00</option>
          </select>
        </div>
      </div>

      <div class="two">
        <div class="field">
          <label>Nombre</label>
          <input placeholder="Tu nombre" bind:value={name} />
        </div>
        <div class="field">
          <label>Teléfono</label>
          <input placeholder="+53 ..." bind:value={phone} />
        </div>
      </div>

      <div class="field">
        <label>Zona / dirección aproximada</label>
        <input placeholder="Municipio, reparto o referencia" bind:value={address} />
      </div>

      <div class="field">
        <label>Cuéntanos brevemente</label>
        <textarea
          placeholder="Por ejemplo: necesito paneles para una vivienda con refrigerador, bombas y ventiladores..."
          bind:value={message}
        ></textarea>
      </div>

      <button class="btn btn-primary" style="width: 100%" onclick={submit}>
        Solicitar visita técnica →
      </button>
      <p class="hint">
        La solicitud no confirma automáticamente la visita. SOLUX se pondrá en contacto para coordinarla.
      </p>
    </div>

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
  .choice:hover,
  .choice.selected {
    border-color: var(--color-primary);
    background: color-mix(in srgb, var(--color-primary) 8%, var(--color-surface));
  }
  .choice strong {
    display: block;
    font-size: 13px;
  }
  .choice small {
    color: var(--color-muted);
  }
  .reserve-side {
    position: sticky;
    top: 95px;
  }
  .check-list {
    list-style: none;
    padding: 0;
    margin: 20px 0 0;
  }
  .check-list li {
    margin: 12px 0;
    color: var(--color-muted);
    font-size: 13px;
  }
  .check-list li::before {
    content: '✓';
    color: var(--color-primary-2);
    font-weight: 800;
    margin-right: 9px;
  }
  .notice {
    padding: 15px;
    border-radius: 15px;
    background: color-mix(in srgb, var(--color-accent) 12%, var(--color-surface));
    border: 1px solid color-mix(in srgb, var(--color-accent) 35%, var(--color-border));
    font-size: 12px;
    line-height: 1.5;
    margin-top: 18px;
  }
  .hint {
    font-size: 11px;
    color: var(--color-muted);
    text-align: center;
    margin: 12px 0 0;
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
    .choice-grid {
      grid-template-columns: 1fr;
    }
  }
</style>
