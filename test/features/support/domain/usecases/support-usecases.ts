import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { SupportTicket, TicketMessage } from '$features/support/domain/entities';
import type { SupportRepository } from '$features/support/domain/repository/support-repository';
import {
  CreateSupportTicket,
  GetSupportTicketByTrackingCode,
  GetPublicTicketMessagesByTrackingCode,
  ListSupportTickets,
  ListTicketMessages,
  AddAgentTicketMessage,
  UpdateSupportTicketStatus
} from '$features/support/domain/usecases/support-usecases';

const sampleTicket = (overrides: Partial<SupportTicket> = {}): SupportTicket => ({
  id: 't-1',
  trackingCode: 'SLX-TIX00001',
  customerName: 'Luis',
  customerEmail: 'luis@test.com',
  customerPhone: '8091111111',
  subject: 'Inversor',
  description: 'No enciende',
  status: 'open',
  priority: 'medium',
  source: 'soporte',
  intent: 'maintain',
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-01T00:00:00Z',
  ...overrides
});

const sampleMessage = (overrides: Partial<TicketMessage> = {}): TicketMessage => ({
  id: 'm-1',
  ticketId: 't-1',
  author: 'agent',
  authorName: 'Agente',
  body: 'Revisamos el caso',
  isInternal: false,
  createdAt: '2026-01-01T00:00:00Z',
  ...overrides
});

describe('support-usecases', () => {
  let repo: SupportRepository;

  beforeEach(() => {
    repo = {
      createTicket: vi.fn(),
      getByTrackingCode: vi.fn(),
      getMessagesByTrackingCode: vi.fn(),
      listAll: vi.fn(),
      listMessages: vi.fn(),
      addAgentMessage: vi.fn(),
      updateStatus: vi.fn()
    };
  });

  it('CreateSupportTicket delega createTicket', async () => {
    const input = {
      customerName: 'Luis',
      customerEmail: 'luis@test.com',
      subject: 'Inversor',
      description: 'No enciende',
      source: 'soporte',
      intent: 'maintain'
    };
    vi.mocked(repo.createTicket).mockResolvedValue(sampleTicket());

    const result = await new CreateSupportTicket(repo).execute(input);

    expect(repo.createTicket).toHaveBeenCalledWith(input);
    expect(result.trackingCode).toMatch(/^SLX-/);
  });

  it('GetSupportTicketByTrackingCode busca por código', async () => {
    vi.mocked(repo.getByTrackingCode).mockResolvedValue(sampleTicket());

    const result = await new GetSupportTicketByTrackingCode(repo).execute('SLX-TIX00001');

    expect(result?.id).toBe('t-1');
  });

  it('GetPublicTicketMessagesByTrackingCode lista mensajes públicos', async () => {
    vi.mocked(repo.getMessagesByTrackingCode).mockResolvedValue([sampleMessage()]);

    const result = await new GetPublicTicketMessagesByTrackingCode(repo).execute('SLX-TIX00001');

    expect(result).toHaveLength(1);
  });

  it('ListSupportTickets lista tickets', async () => {
    vi.mocked(repo.listAll).mockResolvedValue([sampleTicket()]);

    const result = await new ListSupportTickets(repo).execute();

    expect(result[0].status).toBe('open');
  });

  it('ListTicketMessages lista por ticketId', async () => {
    vi.mocked(repo.listMessages).mockResolvedValue([sampleMessage()]);

    await new ListTicketMessages(repo).execute('t-1');

    expect(repo.listMessages).toHaveBeenCalledWith('t-1');
  });

  it('AddAgentTicketMessage usa addAgentMessage con isInternal', async () => {
    vi.mocked(repo.addAgentMessage).mockResolvedValue(sampleMessage({ isInternal: true }));

    const result = await new AddAgentTicketMessage(repo).execute(
      't-1',
      'Agente',
      'Nota interna',
      true
    );

    expect(repo.addAgentMessage).toHaveBeenCalledWith('t-1', 'Agente', 'Nota interna', true);
    expect(result.isInternal).toBe(true);
  });

  it('UpdateSupportTicketStatus actualiza estado', async () => {
    vi.mocked(repo.updateStatus).mockResolvedValue(sampleTicket({ status: 'resolved' }));

    const result = await new UpdateSupportTicketStatus(repo).execute('t-1', 'resolved');

    expect(repo.updateStatus).toHaveBeenCalledWith('t-1', 'resolved');
    expect(result.status).toBe('resolved');
  });
});
