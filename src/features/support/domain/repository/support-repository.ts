import type { SupportTicket } from '../entities';
import type { TicketMessage } from '../entities/ticket-message';

export interface CreateTicketInput {
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  subject: string;
  description: string;
  relatedReservationId?: string;
}

export interface SupportRepository {
  createTicket(input: CreateTicketInput): Promise<SupportTicket>;
  getByTrackingCode(code: string): Promise<SupportTicket | null>;
  getMessagesByTrackingCode(code: string): Promise<TicketMessage[]>;
  listAll(): Promise<SupportTicket[]>;
  updateStatus(id: string, status: SupportTicket['status']): Promise<SupportTicket>;
}
