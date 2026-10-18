import type { PageContent, PageSlug } from '../entities/page-content';
import type { PresentationRepository } from '../repository/presentation-repository';

export class GetPageContent {
  constructor(private readonly repository: PresentationRepository) {}

  execute(slug: PageSlug): Promise<PageContent> {
    return this.repository.getPageContent(slug);
  }
}
