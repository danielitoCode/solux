import { supabase } from '$infrastructure/data/supabase-client';
import type { PageContentDto, SiteContentDto } from '../../dto/page-content.dto';

export class PresentationRemoteDataSource {
  async getPageContent(slug: string): Promise<SiteContentDto | null> {
    const { data, error } = await supabase
      .from('site_content')
      .select('page_slug,content,updated_at')
      .eq('page_slug', slug)
      .maybeSingle();
    if (error) throw error;
    return data as SiteContentDto | null;
  }

  async savePageContent(slug: string, content: PageContentDto): Promise<SiteContentDto> {
    const { data, error } = await supabase
      .from('site_content')
      .upsert({ page_slug: slug, content, updated_at: new Date().toISOString() }, { onConflict: 'page_slug' })
      .select('page_slug,content,updated_at')
      .single();
    if (error) throw error;
    return data as SiteContentDto;
  }
}
