import type { SupportTicket, TicketMessage } from '../entities';
import type {
  CreateTicketInput,
  SupportRepository
} from '../repository/support-repository';

export class CreateSupportTicket {
  constructor(private readonly repository: SupportRepository) {}

  execute(input: CreateTicketInput): Promise<SupportTicket> {
    return this.repository.createTicket(input);
  }
}

export class GetSupportTicketByTrackingCode {
  constructor(private readonly repository: SupportRepository) {}

  execute(code: string): Promise<SupportTicket | null> {
    return this.repository.getByTrackingCode(code);
  }
}

export class GetPublicTicketMessagesByTrackingCode {
  constructor(private readonly repository: SupportRepository) {}

  execute(code: string): Promise<TicketMessage[]> {
    return this.repository.getMessagesByTrackingCode(code);
  }
}

export class ListSupportTickets {
  constructor(private readonly repository: SupportRepository) {}

  execute(): Promise<SupportTicket[]> {
    return this.repository.listAll();
  }
}

export class ListTicketMessages {
  constructor(private readonly repository: SupportRepository) {}

  execute(ticketId: string): Promise<TicketMessage[]> {
    return this.repository.listMessages(ticketId);
  }
}

export class AddAgentTicketMessage {
  constructor(private readonly repository: SupportRepository) {}

  execute(
    ticketId: string,
    authorName: string,
    body: string,
    isInternal = false
  ): Promise<TicketMessage> {
    return this.repository.addAgentMessage(ticketId, authorName, body, isInternal);
  }
}

export class UpdateSupportTicketStatus {
  constructor(private readonly repository: SupportRepository) {}

  execute(id: string, status: SupportTicket['status']): Promise<SupportTicket> {
    return this.repository.updateStatus(id, status);
  }
}
