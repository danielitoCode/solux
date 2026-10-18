/**
 * Domain entity: Incoming contact / inquiry message.
 */
export type ContactSubject =
  | 'quote'
  | 'general'
  | 'partnership'
  | 'other';

export interface ContactMessage {
  id: string;
  name: string;
  email: string;
  phone?: string;
  subject: ContactSubject;
  message: string;
  createdAt: string; // ISO date
  isRead: boolean;
}
