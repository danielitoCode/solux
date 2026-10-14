<script lang="ts">
  import { goto } from '$app/navigation';
  import { login, getAuthUser, initAuth, isAuthLoading } from '../stores/auth.store';
  import { onMount } from 'svelte';

  let email = $state('');
  let password = $state('');
  let error = $state('');
  let submitting = $state(false);

  onMount(async () => {
    await initAuth();
    if (getAuthUser()) {
      goto('/backoffice');
    }
  });

  async function handleSubmit(e: Event) {
    e.preventDefault();
    error = '';
    submitting = true;
    try {
      await login(email.trim(), password);
      goto('/backoffice');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error al iniciar sesión';
      error = msg.includes('Invalid') ? 'Email o contraseña incorrectos' : msg;
    } finally {
      submitting = false;
    }
  }
</script>

<section class="login-page">
  <div class="login-card card">
    <div class="brand-row">
      <span class="brand-mark"><span></span></span>
      <div>
        <div class="eyebrow">SOLUX Backoffice</div>
        <h1>Acceso staff</h1>
      </div>
    </div>

    <p class="lead">Solo personal autorizado (admin, support, sales).</p>

    <form onsubmit={handleSubmit}>
      <div class="field">
        <label for="email">Email</label>
        <input
          id="email"
          type="email"
          autocomplete="username"
          placeholder="admin@solux.cu"
          bind:value={email}
          required
        />
      </div>
      <div class="field">
        <label for="password">Contraseña</label>
        <input
          id="password"
          type="password"
          autocomplete="current-password"
          placeholder="••••••••"
          bind:value={password}
          required
        />
      </div>

      {#if error}
        <div class="error" role="alert">{error}</div>
      {/if}

      <button class="btn btn-primary" type="submit" style="width: 100%" disabled={submitting || isAuthLoading()}>
        {submitting ? 'Entrando…' : 'Entrar →'}
      </button>
    </form>

    <a class="back-link" href="/">← Volver al sitio</a>
  </div>
</section>

<style>
  .login-page {
    min-height: calc(100vh - var(--header-height) - 120px);
    display: grid;
    place-items: center;
    padding: 40px 20px;
  }
  .login-card {
    width: 100%;
    max-width: 420px;
    padding: 36px 32px;
  }
  .brand-row {
    display: flex;
    align-items: center;
    gap: 14px;
    margin-bottom: 8px;
  }
  .brand-mark {
    width: 40px;
    height: 40px;
    display: grid;
    place-items: center;
    border-radius: 12px;
    background: linear-gradient(145deg, var(--color-primary), var(--color-primary-2));
    position: relative;
    overflow: hidden;
    transform: rotate(-5deg);
    flex-shrink: 0;
  }
  .brand-mark::before {
    content: '';
    width: 16px;
    height: 16px;
    border-radius: 50%;
    background: var(--color-accent);
    position: absolute;
    top: 3px;
    right: 2px;
  }
  .brand-mark span {
    width: 18px;
    height: 9px;
    border: 4px solid white;
    border-top: 0;
    border-radius: 0 0 12px 12px;
    position: relative;
    z-index: 1;
  }
  h1 {
    font-size: 28px;
    margin: 4px 0 0;
    letter-spacing: -0.04em;
  }
  .lead {
    color: var(--color-muted);
    font-size: 14px;
    margin: 12px 0 28px;
  }
  .error {
    background: color-mix(in srgb, #c0392b 12%, var(--color-surface));
    border: 1px solid color-mix(in srgb, #c0392b 35%, var(--color-border));
    color: #a93226;
    padding: 12px 14px;
    border-radius: var(--radius-sm);
    font-size: 13px;
    margin-bottom: 16px;
  }
  .back-link {
    display: block;
    text-align: center;
    margin-top: 22px;
    font-size: 13px;
    color: var(--color-muted);
    font-weight: 600;
  }
  .back-link:hover {
    color: var(--color-primary);
  }
  button:disabled {
    opacity: 0.65;
    cursor: not-allowed;
    transform: none;
  }
</style>
