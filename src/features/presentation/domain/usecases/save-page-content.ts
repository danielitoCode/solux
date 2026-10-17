import type { PageContent, PageSlug } from '../entities/page-content';
import type { PresentationRepository } from '../repository/presentation-repository';

export class SavePageContent {
  constructor(private readonly repository: PresentationRepository) {}

  execute(slug: PageSlug, content: PageContent): Promise<PageContent> {
    return this.repository.savePageContent(slug, content);
  }
}
