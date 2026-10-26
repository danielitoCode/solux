<script lang="ts">
  import AboutPage from '$features/presentation/ui/pages/AboutPage.svelte';

  let { data } = $props();
</script>

<AboutPage pageContent={data.pageContent} />
