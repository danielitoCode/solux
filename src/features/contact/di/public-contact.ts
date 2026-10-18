import { PublicContactRepositoryImpl } from '../data/repository/public-contact-repository-impl';
import {
  GetBusinessHours,
  GetCompanyProfile,
  GetPublicContactInfo,
  SendContactMessage
} from '../domain/usecases/public-contact-usecases';

const repository = new PublicContactRepositoryImpl();

export const publicContactUseCases = {
  getContactInfo: new GetPublicContactInfo(repository),
  getBusinessHours: new GetBusinessHours(repository),
  sendMessage: new SendContactMessage(repository),
  getCompanyProfile: new GetCompanyProfile(repository)
};
