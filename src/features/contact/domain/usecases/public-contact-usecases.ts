import type { PublicContactRepository } from '../repository/public-contact-repository';
import type { CreateContactMessageDto } from '../../data/datasources/remote/public-contact-remote-datasource';

export class GetPublicContactInfo {
  constructor(private readonly repository: PublicContactRepository) {}
  execute() { return this.repository.getContactInfo(); }
}
export class GetBusinessHours {
  constructor(private readonly repository: PublicContactRepository) {}
  execute() { return this.repository.getBusinessHours(); }
}
export class SendContactMessage {
  constructor(private readonly repository: PublicContactRepository) {}
  execute(input: CreateContactMessageDto) { return this.repository.sendMessage(input); }
}
export class GetCompanyProfile {
  constructor(private readonly repository: PublicContactRepository) {}
  execute() { return this.repository.getCompanyProfile(); }
}
