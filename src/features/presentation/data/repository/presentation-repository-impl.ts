import type { PageContent, PageSlug } from '../../domain/entities/page-content';
import type { PresentationRepository } from '../../domain/repository/presentation-repository';
import { mapPageContentDto, toPageContentDto } from '../mappers/page-content.mapper';
import { PresentationRemoteDataSource } from '../datasources/remote/presentation-remote-datasource';

export class PresentationRepositoryImpl implements PresentationRepository {
  constructor(private readonly remote = new PresentationRemoteDataSource()) {}

  async getPageContent(slug: PageSlug): Promise<PageContent> {
    return mapPageContentDto(await this.remote.getPageContent(slug));
  }

  async savePageContent(slug: PageSlug, content: PageContent): Promise<PageContent> {
    return mapPageContentDto(await this.remote.savePageContent(slug, toPageContentDto(content)));
  }
}
