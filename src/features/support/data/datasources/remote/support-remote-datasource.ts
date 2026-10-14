import { supabase } from '$infrastructure/di/supabase';
import type { CreateTicketInput } from '../../../domain/repository/support-repository';

export class SupportRemoteDataSource {
  async createTicket(input: CreateTicketInput) {
    const { data, error } = await supabase
      .from('support_tickets')
      .insert({
        customer_name: input.customerName,
        customer_email: input.customerEmail,
        customer_phone: input.customerPhone ?? null,
        subject: input.subject,
        description: input.description,
        related_reservation_id: input.relatedReservationId ?? null
      })
      .select()
      .single();
    if (error) throw error;
    return data;
  }

  async getByTrackingCode(code: string) {
    const { data, error } = await supabase.rpc('get_ticket_by_tracking', { p_code: code });
    if (error) throw error;
    return Array.isArray(data) ? data[0] ?? null : data;
  }

  async getMessagesByTrackingCode(code: string) {
    const { data, error } = await supabase.rpc('get_ticket_messages_by_tracking', {
      p_code: code
    });
    if (error) throw error;
    return data ?? [];
  }

  async listAll() {
    const { data, error } = await supabase
      .from('support_tickets')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data ?? [];
  }

  async updateStatus(id: string, status: string) {
    const { data, error } = await supabase
      .from('support_tickets')
      .update({ status })
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  }
}
