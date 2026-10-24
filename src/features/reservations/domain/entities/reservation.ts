export type ReservationStatus =
  | 'pending'
  | 'confirmed'
  | 'in_progress'
  | 'completed'
  | 'cancelled';

export interface Reservation {
  id: string;
  trackingCode: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  serviceCategory: string;
  preferredDate: string;
  preferredTimeSlot: string;
  address: string;
  notes?: string;
  status: ReservationStatus;
  assignedTo?: string;
  /** Canal de origen del lead (home, direct, catalog, …) */
  source: string;
  /** Intención comercial (buy | install | maintain | …) */
  intent: string;
  createdAt: string;
  updatedAt: string;
}
