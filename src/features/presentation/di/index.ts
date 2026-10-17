import { GetCompanyProfile } from '../domain/usecases/get-company-profile';
import { GetPageContent } from '../domain/usecases/get-page-content';
import { SavePageContent } from '../domain/usecases/save-page-content';
import { PresentationRepositoryImpl } from '../data/repository/presentation-repository-impl';

const repository = new PresentationRepositoryImpl();

export function getPresentationRepository() {
  return repository;
}

export function getPresentationUseCases() {
  return {
    getCompanyProfile: new GetCompanyProfile(repository),
    getPageContent: new GetPageContent(repository),
    savePageContent: new SavePageContent(repository)
  };
}
