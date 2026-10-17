import { GetPageContent } from '../domain/usecases/get-page-content';
import { SavePageContent } from '../domain/usecases/save-page-content';
import { PresentationRepositoryImpl } from '../data/repository/presentation-repository-impl';

const repository = new PresentationRepositoryImpl();

export function getPresentationRepository() {
  return repository;
}

export function getPresentationUseCases() {
  return {
    getPageContent: new GetPageContent(repository),
    savePageContent: new SavePageContent(repository)
  };
}
