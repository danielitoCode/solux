import type { ContactMessage } from '../../domain/entities';
import type { ContactMessageDto } from '../dto/contact-message.dto';

export function mapContactMessageDto(dto: ContactMessageDto): ContactMessage {
  return {
    id: dto.id,
    name: dto.name,
    email: dto.email,
    phone: dto.phone ?? undefined,
    subject: dto.subject,
    message: dto.message,
    isRead: dto.is_read,
    createdAt: dto.created_at
  };
}
