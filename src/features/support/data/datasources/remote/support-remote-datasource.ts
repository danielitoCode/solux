import { assertSupabaseConfigured, supabase } from '$infrastructure/data/supabase-client';
import { devLog, devError } from '$infrastructure/ui/dev-logger';
import type { CreateTicketInput } from '../../../domain/repository/support-repository';
import type { SupportTicketDto, TicketMessageDto } from '../../dto/support.dto';
import type { Database } from '$infrastructure/data/database.types';
import type { TicketStatus } from '../../../domain/entities';

export class SupportRemoteDataSource {
  async createTicket(input: CreateTicketInput): Promise<SupportTicketDto> {
    assertSupabaseConfigured();
    // RPC security definer: evita 42501 (insert+select sin policy SELECT para anon)
    const { data, error } = await supabase.rpc('create_support_ticket', {
      p_customer_name: input.customerName,
      p_customer_email: input.customerEmail,
      p_customer_phone: input.customerPhone ?? null,
      p_subject: input.subject,
      p_description: input.description,
      p_related_reservation_id: input.relatedReservationId ?? null
    });
    if (error) {
      devError('support-remote', 'createTicket failed', error);
      throw error;
    }
    const row = Array.isArray(data) ? data[0] : data;
    if (!row) throw new Error('No se pudo crear el ticket.');
    return row as SupportTicketDto;
  }

  async getByTrackingCode(code: string): Promise<SupportTicketDto | null> {
    assertSupabaseConfigured();
    const { data, error } = await supabase.rpc('get_ticket_by_tracking', { p_code: code });
    if (error) {
      devError('support-remote', 'getByTracking failed', error);
      throw error;
    }
    const row = Array.isArray(data) ? data[0] : data;
    return (row as SupportTicketDto) ?? null;
  }

  async getMessagesByTrackingCode(code: string): Promise<TicketMessageDto[]> {
    assertSupabaseConfigured();
    const { data, error } = await supabase.rpc('get_ticket_messages_by_tracking', {
      p_code: code
    });
    if (error) {
      devError('support-remote', 'getMessagesByTracking failed', error);
      throw error;
    }
    return (data ?? []) as TicketMessageDto[];
  }

  async listAll(): Promise<SupportTicketDto[]> {
    assertSupabaseConfigured();
    devLog('support-remote', 'listAll');
    const { data, error } = await supabase
      .from('support_tickets')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) {
      devError('support-remote', 'listAll failed', error);
      throw error;
    }
    return (data ?? []) as SupportTicketDto[];
  }

  async listMessagesByTicketId(ticketId: string): Promise<TicketMessageDto[]> {
    assertSupabaseConfigured();
    const { data, error } = await supabase
      .from('ticket_messages')
      .select('*')
      .eq('ticket_id', ticketId)
      .order('created_at', { ascending: true });
    if (error) {
      devError('support-remote', 'listMessages failed', error);
      throw error;
    }
    return (data ?? []) as TicketMessageDto[];
  }

  async addAgentMessage(
    ticketId: string,
    authorName: string,
    body: string,
    isInternal: boolean
  ): Promise<TicketMessageDto> {
    assertSupabaseConfigured();
    const { data, error } = await supabase
      .from('ticket_messages')
      .insert({
        ticket_id: ticketId,
        author: 'agent',
        author_name: authorName,
        body,
        is_internal: isInternal
      })
      .select()
      .single();
    if (error) {
      devError('support-remote', 'addAgentMessage failed', error);
      throw error;
    }
    return data as TicketMessageDto;
  }

  async updateStatus(id: string, status: TicketStatus): Promise<SupportTicketDto> {
    assertSupabaseConfigured();
    devLog('support-remote', 'updateStatus', { id, status });
    const patch: Database['public']['Tables']['support_tickets']['Update'] = { status };
    if (status === 'resolved' || status === 'closed') {
      patch.resolved_at = new Date().toISOString();
    }
    const { data, error } = await supabase
      .from('support_tickets')
      .update(patch)
      .eq('id', id)
      .select()
      .single();
    if (error) {
      devError('support-remote', 'updateStatus failed', error);
      throw error;
    }
    return data as SupportTicketDto;
  }
}
