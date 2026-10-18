import type { ReservationStatus } from '../../domain/entities';

export interface ReservationDto {
  id: string;
  tracking_code: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  service_category: string;
  preferred_date: string;
  preferred_time_slot: string;
  address: string;
  notes: string | null;
  status: ReservationStatus;
  assigned_to: string | null;
  created_at: string;
  updated_at: string;
}
