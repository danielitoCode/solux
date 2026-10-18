import type { SupportTicket, TicketMessage } from '../entities';

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
  listMessages(ticketId: string): Promise<TicketMessage[]>;
  addAgentMessage(
    ticketId: string,
    authorName: string,
    body: string,
    isInternal?: boolean
  ): Promise<TicketMessage>;
  updateStatus(id: string, status: SupportTicket['status']): Promise<SupportTicket>;
}
