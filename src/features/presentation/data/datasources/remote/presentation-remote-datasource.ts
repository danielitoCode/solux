import { supabase } from '$infrastructure/data/supabase-client';
import type { CompanyProfileDto } from '../../dto/company-profile.dto';
import type { PageContentDto, SiteContentDto } from '../../dto/page-content.dto';
import type { ProjectCardDto } from '../../dto/project-card.dto';

export class PresentationRemoteDataSource {
  async getCompanyProfile(): Promise<CompanyProfileDto | null> {
    const { data, error } = await supabase
      .from('company_profile')
      .select('id,name,tagline,about,mission,vision,years_of_experience,completed_projects')
      .limit(1)
      .maybeSingle();
    if (error) throw error;
    return data as CompanyProfileDto | null;
  }

  async getPageContent(slug: string): Promise<SiteContentDto | null> {
    const { data, error } = await supabase
      .from('site_content')
      .select('page_slug,content,updated_at')
      .eq('page_slug', slug)
      .maybeSingle();
    if (error) throw error;
    return data as SiteContentDto | null;
  }

  async getPublishedProjects(): Promise<ProjectCardDto[]> {
    const { data, error } = await supabase
      .from('site_projects')
      .select('*')
      .eq('is_published', true)
      .order('sort_order')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return (data ?? []) as unknown as ProjectCardDto[];
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
