import { describe, it, expect } from 'vitest';
import { mapTicketDto, mapMessageDto } from '$features/support/data/mappers/support.mapper';
import type { SupportTicketDto, TicketMessageDto } from '$features/support/data/dto/support.dto';

describe('support.mapper', () => {
  it('defaults source/intent', () => {
    const t = mapTicketDto({
      id: 't1', tracking_code: 'SLX-1', customer_name: 'L', customer_email: 'l@t.com',
      customer_phone: null, subject: 'S', description: 'D', status: 'open', priority: 'medium',
      related_reservation_id: null, assigned_to: null, source: null, intent: '  ',
      created_at: '2026-01-01', updated_at: '2026-01-02', resolved_at: null
    } as SupportTicketDto);
    expect(t.source).toBe('direct');
    expect(t.intent).toBe('maintain');
  });
  it('mapMessageDto', () => {
    const m = mapMessageDto({
      id: 'm1', ticket_id: 't1', author: 'agent', author_name: 'A', body: 'Hi',
      is_internal: true, created_at: '2026-01-01'
    } as TicketMessageDto);
    expect(m.ticketId).toBe('t1');
    expect(m.isInternal).toBe(true);
  });
});
