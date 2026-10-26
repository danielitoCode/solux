import { getPresentationUseCases } from '$features/presentation/di';
import { emptyPageContent } from '$features/presentation/domain/entities/page-content';
import { supabaseConfigured } from '$infrastructure/data/supabase-client';

export type HomeCompany = {
  name: string;
  tagline: string;
  about: string;
  years_of_experience: number;
  completed_projects: number;
};

const FALLBACK_COMPANY: HomeCompany = {
  name: 'SOLUX',
  tagline: 'Energía limpia para un mejor mañana.',
  about:
    'Diseñamos e instalamos soluciones solares y eléctricas para hogares, negocios e industrias. Ingeniería cercana, tecnología y resultados medibles.',
  years_of_experience: 5,
  completed_projects: 120
};

/**
 * Contenido de Home en load (prerender): sin waterfall onMount → Supabase.
 */
export const load = async () => {
  if (!supabaseConfigured) {
    return {
      company: FALLBACK_COMPANY,
      pageContent: emptyPageContent()
    };
  }

  const presentation = getPresentationUseCases();

  try {
    const [profile, savedContent] = await Promise.all([
      presentation.getCompanyProfile.execute(),
      presentation.getPageContent.execute('inicio')
    ]);

    const company: HomeCompany = profile
      ? {
          name: profile.name,
          tagline: profile.tagline,
          about: profile.about,
          years_of_experience: profile.yearsOfExperience,
          completed_projects: profile.completedProjects
        }
      : FALLBACK_COMPANY;

    return {
      company,
      pageContent: savedContent
    };
  } catch {
    return {
      company: FALLBACK_COMPANY,
      pageContent: emptyPageContent()
    };
  }
};
