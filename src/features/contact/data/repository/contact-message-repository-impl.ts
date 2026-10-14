import type { ContactMessageRepository } from '../../domain/repository/contact-message-repository';
import type { ContactMessage } from '../../domain/entities';
import { ContactMessageRemoteDataSource } from '../datasources/remote/contact-message-remote-datasource';
import { mapContactMessageDto } from '../mappers/contact-message.mapper';

export class ContactMessageRepositoryImpl implements ContactMessageRepository {
  constructor(private readonly remote = new ContactMessageRemoteDataSource()) {}

  async listAll(): Promise<ContactMessage[]> {
    const list = await this.remote.listAll();
    return list.map(mapContactMessageDto);
  }

  async markRead(id: string, isRead = true): Promise<ContactMessage> {
    return mapContactMessageDto(await this.remote.markRead(id, isRead));
  }
}
