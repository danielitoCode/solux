import { getPresentationUseCases } from '$features/presentation/di';
import { supabaseConfigured } from '$infrastructure/data/supabase-client';
import type { ProjectCardDto } from '$features/presentation/data/dto/project-card.dto';

export type ProjectsHeader = {
  eyebrow: string;
  title: string;
  description: string;
};

const DEFAULT_HEADER: ProjectsHeader = {
  eyebrow: 'Proyectos',
  title: 'Instalaciones reales. Soluciones diseñadas para cada necesidad.',
  description: 'Equipos, características y resultados de instalaciones solares ejecutadas por SOLUX.'
};

/**
 * Contenido + listado de proyectos publicados en load (prerender).
 */
export const load = async () => {
  if (!supabaseConfigured) {
    return {
      header: DEFAULT_HEADER,
      projects: [] as ProjectCardDto[],
      loadError: false
    };
  }

  const presentation = getPresentationUseCases();

  try {
    const [content, publishedProjects] = await Promise.all([
      presentation.getPageContent.execute('proyectos'),
      presentation.getPublishedProjects.execute()
    ]);

    const header: ProjectsHeader = {
      eyebrow: content.eyebrow || DEFAULT_HEADER.eyebrow,
      title: content.title || DEFAULT_HEADER.title,
      description: content.description || DEFAULT_HEADER.description
    };

    return {
      header,
      projects: publishedProjects,
      loadError: false
    };
  } catch {
    return {
      header: DEFAULT_HEADER,
      projects: [] as ProjectCardDto[],
      loadError: true
    };
  }
};
