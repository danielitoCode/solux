<script lang="ts">
  let toastText = $state('');
  let toastShow = $state(false);

  function send() {
    toastText = 'Mensaje preparado. En producción se conectará con Supabase.';
    toastShow = true;
    setTimeout(() => (toastShow = false), 3200);
  }
</script>

<section class="page">
  <div class="section-head">
    <div>
      <div class="eyebrow">Contacto</div>
      <h2>Hablemos de tu proyecto.</h2>
    </div>
    <p>Estamos en Guantánamo y listos para ayudarte a convertir una necesidad energética en un proyecto concreto.</p>
  </div>

  <div class="contact-grid">
    <div>
      <div class="contact-list">
        <div class="contact-item">
          <span>⌖</span>
          <div><strong>Ubicación</strong><br /><small>Guantánamo, Cuba</small></div>
        </div>
        <div class="contact-item">
          <span>☎</span>
          <div><strong>Teléfono</strong><br /><small>+53 5 XXX XXXX</small></div>
        </div>
        <div class="contact-item">
          <span>✉</span>
          <div><strong>Correo</strong><br /><small>hola@solux.cu</small></div>
        </div>
        <div class="contact-item">
          <span>◷</span>
          <div><strong>Horario</strong><br /><small>Lun – Vie · 8:00 – 17:00</small></div>
        </div>
      </div>
      <div class="map">Mapa / ubicación de SOLUX · Guantánamo</div>
    </div>

    <div class="card">
      <h3>Envíanos un mensaje</h3>
      <p style="margin-bottom: 22px">¿Tienes una idea, una duda o quieres un presupuesto?</p>
      <div class="field">
        <label>Nombre completo</label>
        <input placeholder="Tu nombre" />
      </div>
      <div class="field">
        <label>Correo o teléfono</label>
        <input placeholder="Cómo podemos contactarte" />
      </div>
      <div class="field">
        <label>Mensaje</label>
        <textarea placeholder="Cuéntanos sobre tu proyecto..."></textarea>
      </div>
      <button class="btn btn-primary" onclick={send}>Enviar mensaje →</button>
    </div>
  </div>
</section>

<div class="toast" class:show={toastShow} role="status">{toastText}</div>

<style>
  .contact-grid {
    display: grid;
    grid-template-columns: 0.8fr 1.2fr;
    gap: 18px;
  }
  .contact-list {
    display: grid;
    gap: 10px;
    margin-top: 25px;
  }
  .contact-item {
    display: flex;
    gap: 14px;
    align-items: center;
    padding: 15px;
    background: var(--color-surface);
    border: 1px solid var(--color-border);
    border-radius: 16px;
  }
  .contact-item span:first-child {
    width: 40px;
    height: 40px;
    display: grid;
    place-items: center;
    border-radius: 12px;
    background: var(--color-surface-2);
  }
  .map {
    min-height: 220px;
    border-radius: 20px;
    background:
      radial-gradient(circle at 70% 30%, rgba(53, 184, 90, 0.25), transparent 35%),
      linear-gradient(135deg, var(--color-surface-2), var(--color-surface));
    border: 1px solid var(--color-border);
    display: grid;
    place-items: center;
    color: var(--color-muted);
    margin-top: 18px;
  }
  @media (max-width: 900px) {
    .contact-grid {
      grid-template-columns: 1fr;
    }
  }
</style>
