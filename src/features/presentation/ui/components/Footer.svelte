<script lang="ts">
  import { onMount } from 'svelte';
  import { supabase } from '$infrastructure/data/supabase-client';
  let companyName = $state('SOLUX');
  let logoUrl = $state('');
  onMount(async () => {
    const { data } = await supabase.from('company_profile').select('name, logo_url').limit(1).maybeSingle();
    if (data) { companyName = data.name || 'SOLUX'; logoUrl = data.logo_url || ''; }
  });
</script>

<footer class="footer">
  <div>
    <div class="brand footer-brand">
      {#if logoUrl}<img class="company-logo" src={logoUrl} alt={`Logo de ${companyName}`} />{:else}<span class="brand-mark"><span></span></span>{/if}
      <span>{companyName}</span>
    </div>
    <p>Energía solar · Ingeniería eléctrica</p>
  </div>
  <div class="footer-links">
    <a href="/servicios">Servicios</a>
    <a href="/catalogo">Catálogo</a>
    <a href="/proyectos">Proyectos</a>
    <a href="/reservas">Reservas</a>
    <a href="/seguimiento">Seguimiento</a>
    <a href="/soporte">Soporte</a>
    <a href="/contacto">Contacto</a>
  </div>
  <span>© {new Date().getFullYear()} SOLUX · Guantánamo, Cuba</span>
</footer>

<style>
  .footer {
    max-width: var(--max-width);
    margin: 0 auto;
    padding: 30px 28px 50px;
    border-top: 1px solid var(--color-border);
    display: flex;
    justify-content: space-between;
    gap: 20px;
    align-items: center;
    color: var(--color-muted);
    flex-wrap: wrap;
  }
  .footer-brand {
    display: inline-flex;
    align-items: center;
    gap: 10px;
    font-weight: 800;
    color: var(--color-text);
    margin-bottom: 6px;
  }
  .company-logo {
    width: 28px;
    height: 28px;
    object-fit: contain;
    border-radius: 8px;
  }
  .brand-mark {
    width: 26px;
    height: 26px;
    display: grid;
    place-items: center;
    border-radius: 8px;
    background: linear-gradient(145deg, var(--color-primary), var(--color-primary-2));
    position: relative;
    overflow: hidden;
  }
  .brand-mark::before {
    content: '';
    width: 10px;
    height: 10px;
    border-radius: 50%;
    background: var(--color-accent);
    position: absolute;
    top: 2px;
    right: 2px;
  }
  .brand-mark span {
    width: 12px;
    height: 6px;
    border: 2px solid white;
    border-top: 0;
    border-radius: 0 0 8px 8px;
    position: relative;
    z-index: 1;
  }
  .footer p {
    margin: 0;
    font-size: 13px;
  }
  .footer-links {
    display: flex;
    flex-wrap: wrap;
    gap: 12px 16px;
  }
  .footer-links a {
    font-size: 13px;
    font-weight: 600;
    color: var(--color-muted);
  }
  .footer-links a:hover {
    color: var(--color-primary);
  }
</style>
