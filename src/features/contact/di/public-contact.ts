import {
  GetBusinessHours,
  GetCompanyProfile,
  GetPublicContactInfo,
  SendContactMessage
} from '../domain/usecases/public-contact-usecases';

export const publicContactUseCases = {
  getContactInfo: new GetPublicContactInfo(),
  getBusinessHours: new GetBusinessHours(),
  sendMessage: new SendContactMessage(),
  getCompanyProfile: new GetCompanyProfile()
};
