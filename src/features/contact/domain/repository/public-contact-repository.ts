import type {
  BusinessHourDto,
  CompanyProfileDto,
  CreateContactMessageDto,
  PublicContactInfoDto
} from '../../data/datasources/remote/public-contact-remote-datasource';

export interface PublicContactRepository {
  getContactInfo(): Promise<PublicContactInfoDto | null>;
  getBusinessHours(): Promise<BusinessHourDto[]>;
  sendMessage(input: CreateContactMessageDto): Promise<void>;
  getCompanyProfile(): Promise<CompanyProfileDto | null>;
}
