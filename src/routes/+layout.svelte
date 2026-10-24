<script lang="ts">
  import '../app.css';
  import Header from '$features/presentation/ui/components/Header.svelte';
  import Footer from '$features/presentation/ui/components/Footer.svelte';
  import DevDebugPanel from '$infrastructure/ui/DevDebugPanel.svelte';
  import Seo from '$infrastructure/seo/Seo.svelte';
  import { page } from '$app/stores';
  import { onMount } from 'svelte';
  import { devLog } from '$infrastructure/ui/dev-logger';
  import { registerAnimateIcons } from '$infrastructure/ui/animate-icons-registry';

  let { children } = $props();

  const isBackoffice = $derived($page.url.pathname.startsWith('/backoffice'));
  const isHome = $derived($page.url.pathname === '/');

  onMount(() => {
    registerAnimateIcons();
    const saved = localStorage.getItem('solux-theme') || 'light';
    document.documentElement.dataset.theme = saved;
    devLog('app', 'mount', { path: location.pathname });
  });
</script>

<Seo
  noindex={isBackoffice}
  jsonLd={isHome ? 'both' : isBackoffice ? 'none' : 'none'}
/>

{#if !isBackoffice}
  <div class="ambient ambient-a"></div>
  <div class="ambient ambient-b"></div>
  <Header />
{/if}

<main class:bo-full={isBackoffice}>
  {@render children()}
</main>

{#if !isBackoffice}
  <Footer />
{/if}

<DevDebugPanel />

<style>
  .bo-full {
    min-height: 100vh;
  }
</style>
