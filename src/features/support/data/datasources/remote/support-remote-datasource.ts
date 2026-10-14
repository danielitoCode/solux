import { assertSupabaseConfigured, supabase } from '$infrastructure/data/supabase-client';
import { devLog, devError } from '$infrastructure/ui/dev-logger';
import type { CreateTicketInput } from '../../../domain/repository/support-repository';
import type { SupportTicketDto, TicketMessageDto } from '../../dto/support.dto';

export class SupportRemoteDataSource {
  async createTicket(input: CreateTicketInput): Promise<SupportTicketDto> {
    assertSupabaseConfigured();
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
    if (error) {
      devError('support-remote', 'createTicket failed', error);
      throw error;
    }
    return data as SupportTicketDto;
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

  async updateStatus(id: string, status: string): Promise<SupportTicketDto> {
    assertSupabaseConfigured();
    devLog('support-remote', 'updateStatus', { id, status });
    const patch: Record<string, unknown> = { status };
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
