import { supabase, supabaseConfigured } from '$infrastructure/data/supabase-client';

export type SitePageContent = {
  eyebrow?: string;
  title?: string;
  description?: string;
  secondary_title?: string;
  secondary_description?: string;
  image_1?: string;
  image_2?: string;
  image_3?: string;
  image_4?: string;
};

const cache = new Map<string, { value: SitePageContent; at: number }>();
const TTL_MS = 60_000;

export async function loadSiteContent<T extends SitePageContent>(
  pageSlug: string,
  defaults: T
): Promise<T> {
  if (!supabaseConfigured) return defaults;

  const hit = cache.get(pageSlug);
  if (hit && Date.now() - hit.at < TTL_MS) {
    return { ...defaults, ...hit.value } as T;
  }

  const { data, error } = await supabase
    .from('site_content')
    .select('content')
    .eq('page_slug', pageSlug)
    .maybeSingle();

  if (error) {
    console.error(`No se pudo cargar contenido de la vista "${pageSlug}":`, error);
    return defaults;
  }

  const content = (data?.content ?? {}) as SitePageContent;
  cache.set(pageSlug, { value: content, at: Date.now() });
  return { ...defaults, ...content } as T;
}
