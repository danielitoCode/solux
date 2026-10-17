import type { ContactMessage } from '../entities';
import type { ContactMessageRepository } from '../repository/contact-message-repository';

export class ListContactMessages {
  constructor(private readonly repository: ContactMessageRepository) {}

  execute(): Promise<ContactMessage[]> {
    return this.repository.listAll();
  }
}

export class MarkContactMessageRead {
  constructor(private readonly repository: ContactMessageRepository) {}

  execute(id: string, isRead = true): Promise<ContactMessage> {
    return this.repository.markRead(id, isRead);
  }
}
