import type { SupportTicket, TicketMessage } from '../../domain/entities';
import type { SupportTicketDto, TicketMessageDto } from '../dto/support.dto';

export function mapTicketDto(dto: SupportTicketDto): SupportTicket {
  return {
    id: dto.id,
    trackingCode: dto.tracking_code,
    customerName: dto.customer_name,
    customerEmail: dto.customer_email,
    customerPhone: dto.customer_phone ?? undefined,
    subject: dto.subject,
    description: dto.description,
    status: dto.status,
    priority: dto.priority,
    relatedReservationId: dto.related_reservation_id ?? undefined,
    assignedTo: dto.assigned_to ?? undefined,
    source: dto.source?.trim() || 'direct',
    intent: dto.intent?.trim() || 'maintain',
    createdAt: dto.created_at,
    updatedAt: dto.updated_at,
    resolvedAt: dto.resolved_at ?? undefined
  };
}

export function mapMessageDto(dto: TicketMessageDto): TicketMessage {
  return {
    id: dto.id,
    ticketId: dto.ticket_id,
    author: dto.author,
    authorName: dto.author_name,
    body: dto.body,
    isInternal: dto.is_internal,
    createdAt: dto.created_at
  };
}
