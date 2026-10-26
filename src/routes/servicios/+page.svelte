<script lang="ts">
  import ServicesPage from '$features/presentation/ui/pages/ServicesPage.svelte';

  let { data } = $props();
</script>

<ServicesPage pageContent={data.pageContent} />
