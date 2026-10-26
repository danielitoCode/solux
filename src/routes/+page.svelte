<script lang="ts">
  import HomePage from '$features/presentation/ui/pages/HomePage.svelte';

  let { data } = $props();
</script>

<HomePage company={data.company} pageContent={data.pageContent} />
