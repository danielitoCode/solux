/**
 * Domain entity: Technical support ticket.
 */
export type TicketStatus =
  | 'open'
  | 'in_progress'
  | 'waiting_customer'
  | 'resolved'
  | 'closed';

export type TicketPriority = 'low' | 'medium' | 'high' | 'urgent';

export interface SupportTicket {
  id: string;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  subject: string;
  description: string;
  status: TicketStatus;
  priority: TicketPriority;
  relatedReservationId?: string;
  createdAt: string; // ISO date
  updatedAt: string; // ISO date
  resolvedAt?: string; // ISO date
}
