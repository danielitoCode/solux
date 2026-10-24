import { assertSupabaseConfigured, supabase } from '$infrastructure/data/supabase-client';
import { devLog, devError } from '$infrastructure/ui/dev-logger';
import type { ReservationDto } from '../../dto/reservation.dto';
import type { CreateReservationInput } from '../../../domain/repository/reservation-repository';
import type { ReservationStatus } from '../../../domain/entities';

export class ReservationRemoteDataSource {
  async create(input: CreateReservationInput): Promise<ReservationDto> {
    assertSupabaseConfigured();
    devLog('reservations-remote', 'create');
    const { data, error } = await supabase.rpc('create_reservation', {
      p_customer_name: input.customerName,
      p_customer_email: input.customerEmail,
      p_customer_phone: input.customerPhone,
      p_service_category: input.serviceCategory,
      p_preferred_date: input.preferredDate,
      p_preferred_time_slot: input.preferredTimeSlot,
      p_address: input.address,
      p_notes: input.notes ?? null,
      p_source: input.source ?? 'direct',
      p_intent: input.intent ?? 'install'
    });
    if (error) {
      devError('reservations-remote', 'create failed', error);
      throw error;
    }
    if (!data) throw new Error('No se pudo crear la reserva.');
    return data as ReservationDto;
  }

  async getByTrackingCode(code: string): Promise<ReservationDto | null> {
    assertSupabaseConfigured();
    const { data, error } = await supabase.rpc('get_reservation_by_tracking', {
      p_code: code
    });
    if (error) {
      devError('reservations-remote', 'getByTracking failed', error);
      throw error;
    }
    const row = Array.isArray(data) ? data[0] : data;
    return (row as ReservationDto) ?? null;
  }

  async listAll(): Promise<ReservationDto[]> {
    assertSupabaseConfigured();
    devLog('reservations-remote', 'listAll');
    const { data, error } = await supabase
      .from('reservations')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) {
      devError('reservations-remote', 'listAll failed', error);
      throw error;
    }
    return (data ?? []) as ReservationDto[];
  }

  async updateStatus(id: string, status: ReservationStatus): Promise<ReservationDto> {
    assertSupabaseConfigured();
    devLog('reservations-remote', 'updateStatus', { id, status });
    const { data, error } = await supabase
      .from('reservations')
      .update({ status })
      .eq('id', id)
      .select()
      .single();
    if (error) {
      devError('reservations-remote', 'updateStatus failed', error);
      throw error;
    }
    return data as ReservationDto;
  }
}
