import type { ContactSubject } from '../../domain/entities';

export interface ContactMessageDto {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  subject: ContactSubject;
  message: string;
  is_read: boolean;
  assigned_to: string | null;
  created_at: string;
}
