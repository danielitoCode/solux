import { loadSiteContent, type SitePageContent } from '$infrastructure/data/site-content';
import { supabaseConfigured } from '$infrastructure/data/supabase-client';

export type ServicesPageContent = SitePageContent & {
  eyebrow: string;
  title: string;
  description: string;
  secondary_title: string;
  secondary_description: string;
  image_1: string;
};

const DEFAULTS: ServicesPageContent = {
  eyebrow: 'Servicios',
  title: 'Todo lo necesario en un solo lugar.',
  description:
    'Soluciones integrales para producir, almacenar, convertir y distribuir energía con seguridad.',
  secondary_title: 'Diseñado para tu realidad.',
  secondary_description:
    'No vendemos una solución estándar. Evaluamos consumo, espacio, respaldo y crecimiento antes de recomendar un sistema.',
  image_1:
    'https://images.unsplash.com/photo-1497435334941-8c899ee9e8e9?auto=format&fit=crop&w=1400&q=85'
};

/** Contenido de Servicios en load (prerender). */
export const load = async () => {
  if (!supabaseConfigured) {
    return { pageContent: DEFAULTS };
  }

  try {
    const pageContent = await loadSiteContent('servicios', DEFAULTS);
    return { pageContent };
  } catch {
    return { pageContent: DEFAULTS };
  }
};
