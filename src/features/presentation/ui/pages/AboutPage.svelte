<script lang="ts">
  import { onMount } from 'svelte';
  import { loadSiteContent, type SitePageContent } from '$infrastructure/data/site-content';
  let pageContent = $state<SitePageContent>({});
  onMount(async () => {
    pageContent = await loadSiteContent('nosotros', {
      eyebrow: 'Nosotros',
      title: 'Ingeniería, experiencia y pasión por la energía.',
      description: 'En SOLUX creemos en el poder de la energía limpia para transformar hogares y negocios. Combinamos criterio técnico, instalación profesional y atención cercana.',
      secondary_title: 'Nuestros valores',
      secondary_description: 'Hecho con criterio.',
      image_1: 'https://images.unsplash.com/photo-1497435334941-8c899ee9e8e9?auto=format&fit=crop&w=1400&q=85'
    });
  });
</script>
<section class="page">
  <div class="about-hero" style={`background:linear-gradient(110deg,rgba(0,55,30,.92),rgba(0,55,30,.25)),url("${pageContent.image_1}") center / cover;`}>
    <div>
      <div class="eyebrow" style="color: var(--color-accent)">{pageContent.eyebrow || 'Nosotros'}</div>
      <h2>{pageContent.title || 'Ingeniería, experiencia y pasión por la energía.'}</h2>
      <p class="lead" style="color: rgba(255, 255, 255, 0.8)">{pageContent.description || 'En SOLUX creemos en el poder de la energía limpia para transformar hogares y negocios. Combinamos criterio técnico, instalación profesional y atención cercana.'}</p>
    </div>
  </div>

  <div class="section-head values">
    <div>
      <div class="eyebrow">{pageContent.secondary_title || 'Nuestros valores'}</div>
      <h2>{pageContent.secondary_description || 'Hecho con criterio.'}</h2>
    </div>
  </div>

  <div class="grid grid-4">
    {#each [['♻', 'Sostenibilidad', 'Cuidamos el planeta'], ['◈', 'Calidad', 'Cuidamos cada detalle'], ['♥', 'Compromiso', 'Construimos confianza'], ['✦', 'Innovación', 'Pensamos para el futuro']] as [icon, title, text]}
      <div class="card">
        <div class="icon">{icon}</div>
        <h3>{title}</h3>
        <p>{text}</p>
      </div>
    {/each}
  </div>
</section>

<style>
  .about-hero {
    border-radius: 30px;
    min-height: 460px;
    padding: 55px;
    display: flex;
    align-items: end;
    color: white;
    overflow: hidden;
    position: relative;
    background:
      linear-gradient(110deg, rgba(0, 55, 30, 0.92), rgba(0, 55, 30, 0.25)),
      url('https://images.unsplash.com/photo-1497435334941-8c899ee9e8e9?auto=format&fit=crop&w=1400&q=85')
        center / cover;
  }
  .values {
    margin-top: 35px;
  }
  @media (max-width: 600px) {
    .about-hero {
      padding: 30px;
      min-height: 400px;
    }
  }
</style>
