import type { CompanyProfile } from '../entities/company-profile';
import type { PageContent, PageSlug } from '../entities/page-content';

export interface PresentationRepository {
  getCompanyProfile(): Promise<CompanyProfile | null>;
  getPageContent(slug: PageSlug): Promise<PageContent>;
  savePageContent(slug: PageSlug, content: PageContent): Promise<PageContent>;
}
