import type { CompanyProfile } from '../entities/company-profile';
import type { PresentationRepository } from '../repository/presentation-repository';

export class GetCompanyProfile {
  constructor(private readonly repository: PresentationRepository) {}

  execute(): Promise<CompanyProfile | null> {
    return this.repository.getCompanyProfile();
  }
}
