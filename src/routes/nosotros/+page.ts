import { loadSiteContent, type SitePageContent } from '$infrastructure/data/site-content';
import { loadActiveTeamMembers } from '$infrastructure/data/team-members';
import { supabaseConfigured } from '$infrastructure/data/supabase-client';

export type AboutPageContent = SitePageContent & {
  eyebrow: string;
  title: string;
  description: string;
  secondary_title: string;
  secondary_description: string;
  image_1: string;
};

const DEFAULTS: AboutPageContent = {
  eyebrow: 'Nosotros',
  title: 'Ingeniería, experiencia y pasión por la energía.',
  description:
    'En SOLUX creemos en el poder de la energía limpia para transformar hogares y negocios. Combinamos criterio técnico, instalación profesional y atención cercana.',
  secondary_title: 'Nuestros valores',
  secondary_description: 'Hecho con criterio.',
  image_1:
    'https://images.unsplash.com/photo-1497435334941-8c899ee9e8e9?auto=format&fit=crop&w=1400&q=85'
};

/** Contenido de Nosotros + equipo activo (prerender). */
export const load = async () => {
  if (!supabaseConfigured) {
    return { pageContent: DEFAULTS, team: [] };
  }

  try {
    const [pageContent, team] = await Promise.all([
      loadSiteContent('nosotros', DEFAULTS),
      loadActiveTeamMembers()
    ]);
    return { pageContent, team };
  } catch {
    return { pageContent: DEFAULTS, team: [] };
  }
};
