import { CatalogRepositoryImpl } from '../data/repository/catalog-repository-impl';
import type { CatalogRepository } from '../domain/repository/catalog-repository';

let repo: CatalogRepository | null = null;

export function getCatalogRepository(): CatalogRepository {
  if (!repo) repo = new CatalogRepositoryImpl();
  return repo;
}
