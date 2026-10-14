import { SupportRepositoryImpl } from '../data/repository/support-repository-impl';
import type { SupportRepository } from '../domain/repository/support-repository';

let repo: SupportRepository | null = null;

export function getSupportRepository(): SupportRepository {
  if (!repo) repo = new SupportRepositoryImpl();
  return repo;
}
