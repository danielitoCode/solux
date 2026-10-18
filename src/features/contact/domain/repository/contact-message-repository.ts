import type { ContactMessage } from '../entities';

export interface ContactMessageRepository {
  listAll(): Promise<ContactMessage[]>;
  markRead(id: string, isRead?: boolean): Promise<ContactMessage>;
}
