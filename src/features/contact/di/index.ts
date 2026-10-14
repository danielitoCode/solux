import { ContactMessageRepositoryImpl } from '../data/repository/contact-message-repository-impl';
import type { ContactMessageRepository } from '../domain/repository/contact-message-repository';

let repo: ContactMessageRepository | null = null;

export function getContactMessageRepository(): ContactMessageRepository {
  if (!repo) repo = new ContactMessageRepositoryImpl();
  return repo;
}
