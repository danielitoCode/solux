<script lang="ts">
  import { page } from '$app/stores';

  const isDev = import.meta.env.DEV;
</script>

<section class="page err-page">
  <div class="eyebrow">Error {$page.status}</div>
  <h1>Algo salió mal</h1>
  <p class="lead">{$page.error?.message ?? 'Error inesperado'}</p>

  {#if isDev && $page.error}
    <div class="dev-box card">
      <strong>Dev info</strong>
      <div>Ruta: {$page.url.pathname}</div>
      {#if ($page.error as { file?: string }).file}
        <div>Archivo: {($page.error as { file?: string }).file}</div>
      {/if}
      <pre>{JSON.stringify($page.error, null, 2)}</pre>
    </div>
  {/if}

  <a class="btn btn-primary" href="/">Volver al inicio</a>
</section>

<style>
  .err-page {
    max-width: 640px;
  }
  .dev-box {
    margin: 24px 0;
    font-family: ui-monospace, monospace;
    font-size: 12px;
  }
  .dev-box pre {
    margin-top: 10px;
    overflow: auto;
    background: var(--color-surface-2);
    padding: 12px;
    border-radius: 10px;
  }
</style>
