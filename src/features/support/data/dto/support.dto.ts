import type { TicketPriority, TicketStatus } from '../../domain/entities';
import type { MessageAuthor } from '../../domain/entities/ticket-message';

export interface SupportTicketDto {
  id: string;
  tracking_code: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string | null;
  subject: string;
  description: string;
  status: TicketStatus;
  priority: TicketPriority;
  related_reservation_id: string | null;
  assigned_to: string | null;
  created_at: string;
  updated_at: string;
  resolved_at: string | null;
}

export interface TicketMessageDto {
  id: string;
  ticket_id: string;
  author: MessageAuthor;
  author_name: string;
  body: string;
  is_internal: boolean;
  created_at: string;
}
