/**
 * Domain entity: Message inside a support ticket thread.
 */
export type MessageAuthor = 'customer' | 'agent' | 'system';

export interface TicketMessage {
  id: string;
  ticketId: string;
  author: MessageAuthor;
  authorName: string;
  body: string;
  createdAt: string; // ISO date
  isInternal: boolean;
}
