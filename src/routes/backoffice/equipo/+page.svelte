<script lang="ts">
  import BackofficeTeamPanel from '$features/presentation/ui/pages/BackofficeTeamPanel.svelte';
</script>

<svelte:head><title>Equipo | SOLUX Backoffice</title></svelte:head>

<div class="page-wrap">
  <BackofficeTeamPanel />
</div>

<style>
  .page-wrap {
    min-height: 100%;
    background: var(--color-background);
  }
</style>
