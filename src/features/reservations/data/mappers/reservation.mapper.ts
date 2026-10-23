import type { Reservation } from '../../domain/entities';
import type { ReservationDto } from '../dto/reservation.dto';

export function mapReservationDto(dto: ReservationDto): Reservation {
  return {
    id: dto.id,
    trackingCode: dto.tracking_code,
    customerName: dto.customer_name,
    customerEmail: dto.customer_email,
    customerPhone: dto.customer_phone,
    serviceCategory: dto.service_category,
    preferredDate: dto.preferred_date,
    preferredTimeSlot: dto.preferred_time_slot,
    address: dto.address,
    notes: dto.notes ?? undefined,
    status: dto.status,
    assignedTo: dto.assigned_to ?? undefined,
    source: dto.source?.trim() || 'direct',
    intent: dto.intent?.trim() || 'install',
    createdAt: dto.created_at,
    updatedAt: dto.updated_at
  };
}
