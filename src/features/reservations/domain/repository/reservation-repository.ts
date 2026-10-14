import type { Reservation } from '../entities';

export interface CreateReservationInput {
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  serviceCategory: string;
  preferredDate: string;
  preferredTimeSlot: string;
  address: string;
  notes?: string;
}

export interface ReservationRepository {
  create(input: CreateReservationInput): Promise<Reservation>;
  getByTrackingCode(code: string): Promise<Reservation | null>;
  listAll(): Promise<Reservation[]>;
  updateStatus(id: string, status: Reservation['status']): Promise<Reservation>;
}
