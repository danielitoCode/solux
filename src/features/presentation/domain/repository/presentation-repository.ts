import type { PageContent, PageSlug } from '../entities/page-content';

export interface PresentationRepository {
  getPageContent(slug: PageSlug): Promise<PageContent>;
  savePageContent(slug: PageSlug, content: PageContent): Promise<PageContent>;
}
