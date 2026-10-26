<script lang="ts">
  import ProjectsPage from '$features/presentation/ui/pages/ProjectsPage.svelte';

  let { data } = $props();
</script>

<ProjectsPage
  header={data.header}
  projects={data.projects}
  loadError={data.loadError}
/>
