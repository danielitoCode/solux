import { PublicContactRemoteDataSource } from '../datasources/remote/public-contact-remote-datasource';
import type { PublicContactRepository } from '../../domain/repository/public-contact-repository';
import type { CreateContactMessageDto } from '../datasources/remote/public-contact-remote-datasource';

export class PublicContactRepositoryImpl implements PublicContactRepository {
  constructor(private readonly remote = new PublicContactRemoteDataSource()) {}
  getContactInfo() { return this.remote.getContactInfo(); }
  getBusinessHours() { return this.remote.getBusinessHours(); }
  sendMessage(input: CreateContactMessageDto) { return this.remote.sendMessage(input); }
  getCompanyProfile() { return this.remote.getCompanyProfile(); }
}
