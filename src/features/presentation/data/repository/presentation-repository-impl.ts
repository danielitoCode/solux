import type { CompanyProfile } from '../../domain/entities/company-profile';
import type { PageContent, PageSlug } from '../../domain/entities/page-content';
import type { PresentationRepository } from '../../domain/repository/presentation-repository';
import { PresentationRemoteDataSource } from '../datasources/remote/presentation-remote-datasource';
import { mapCompanyProfileDto } from '../mappers/company-profile.mapper';
import { mapPageContentDto, toPageContentDto } from '../mappers/page-content.mapper';

export class PresentationRepositoryImpl implements PresentationRepository {
  constructor(private readonly remote = new PresentationRemoteDataSource()) {}

  async getCompanyProfile(): Promise<CompanyProfile | null> {
    return mapCompanyProfileDto(await this.remote.getCompanyProfile());
  }

  async getPageContent(slug: PageSlug): Promise<PageContent> {
    return mapPageContentDto(await this.remote.getPageContent(slug));
  }

  async savePageContent(slug: PageSlug, content: PageContent): Promise<PageContent> {
    return mapPageContentDto(await this.remote.savePageContent(slug, toPageContentDto(content)));
  }
}
