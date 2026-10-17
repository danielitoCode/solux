import { PublicContactRemoteDataSource, type CreateContactMessageDto } from '../../data/datasources/remote/public-contact-remote-datasource';

const remote = new PublicContactRemoteDataSource();

export class GetPublicContactInfo {
  execute() { return remote.getContactInfo(); }
}
export class GetBusinessHours {
  execute() { return remote.getBusinessHours(); }
}
export class SendContactMessage {
  execute(input: CreateContactMessageDto) { return remote.sendMessage(input); }
}
export class GetCompanyProfile {
  execute() { return remote.getCompanyProfile(); }
}
