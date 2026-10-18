import { assertSupabaseConfigured, supabase } from '$infrastructure/data/supabase-client';
import { devLog, devError } from '$infrastructure/ui/dev-logger';
import type { ReservationDto } from '../../dto/reservation.dto';
import type { CreateReservationInput } from '../../../domain/repository/reservation-repository';
import type { ReservationStatus } from '../../../domain/entities';

export class ReservationRemoteDataSource {
  async create(input: CreateReservationInput): Promise<ReservationDto> {
    assertSupabaseConfigured();
    devLog('reservations-remote', 'create');
    const { data, error } = await supabase
      .from('reservations')
      .insert({
        customer_name: input.customerName,
        customer_email: input.customerEmail,
        customer_phone: input.customerPhone,
        service_category: input.serviceCategory,
        preferred_date: input.preferredDate,
        preferred_time_slot: input.preferredTimeSlot,
        address: input.address,
        notes: input.notes ?? null
      })
      .select()
      .single();
    if (error) {
      devError('reservations-remote', 'create failed', error);
      throw error;
    }
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
