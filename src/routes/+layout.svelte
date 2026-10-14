<script lang="ts">
  import '../app.css';
  import Header from '$features/presentation/ui/components/Header.svelte';
  import Footer from '$features/presentation/ui/components/Footer.svelte';
  import { onMount } from 'svelte';

  let { children } = $props();

  onMount(() => {
    const saved = localStorage.getItem('solux-theme') || 'light';
    document.documentElement.dataset.theme = saved;
  });
</script>

<div class="ambient ambient-a"></div>
<div class="ambient ambient-b"></div>

<Header />

<main>
  {@render children()}
</main>

<Footer />
