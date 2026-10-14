/**
 * Domain entity: Reservation / booking for a solar or electrical service.
 */
export type ReservationStatus =
  | 'pending'
  | 'confirmed'
  | 'in_progress'
  | 'completed'
  | 'cancelled';

export interface Reservation {
  id: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  serviceCategory: string;
  preferredDate: string; // ISO date
  preferredTimeSlot: string;
  address: string;
  notes?: string;
  status: ReservationStatus;
  createdAt: string; // ISO date
  updatedAt: string; // ISO date
}
