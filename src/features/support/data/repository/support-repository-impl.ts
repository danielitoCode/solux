import type { CreateTicketInput, SupportRepository } from '../../domain/repository/support-repository';
import type { SupportTicket, TicketMessage } from '../../domain/entities';
import { SupportRemoteDataSource } from '../datasources/remote/support-remote-datasource';
import { mapMessageDto, mapTicketDto } from '../mappers/support.mapper';

export class SupportRepositoryImpl implements SupportRepository {
  constructor(private readonly remote = new SupportRemoteDataSource()) {}

  async createTicket(input: CreateTicketInput): Promise<SupportTicket> {
    return mapTicketDto(await this.remote.createTicket(input));
  }

  async getByTrackingCode(code: string): Promise<SupportTicket | null> {
    const dto = await this.remote.getByTrackingCode(code);
    return dto ? mapTicketDto(dto) : null;
  }

  async getMessagesByTrackingCode(code: string): Promise<TicketMessage[]> {
    const list = await this.remote.getMessagesByTrackingCode(code);
    return list.map(mapMessageDto);
  }

  async listAll(): Promise<SupportTicket[]> {
    const list = await this.remote.listAll();
    return list.map(mapTicketDto);
  }

  async listMessages(ticketId: string): Promise<TicketMessage[]> {
    const list = await this.remote.listMessagesByTicketId(ticketId);
    return list.map(mapMessageDto);
  }

  async addAgentMessage(
    ticketId: string,
    authorName: string,
    body: string,
    isInternal = false
  ): Promise<TicketMessage> {
    return mapMessageDto(
      await this.remote.addAgentMessage(ticketId, authorName, body, isInternal)
    );
  }

  async updateStatus(id: string, status: SupportTicket['status']): Promise<SupportTicket> {
    return mapTicketDto(await this.remote.updateStatus(id, status));
  }
}
