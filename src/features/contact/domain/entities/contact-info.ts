/**
 * Domain entity: Public business contact information.
 */
export interface ContactInfo {
  id: string;
  email: string;
  phone: string;
  whatsapp?: string;
  address: string;
  city: string;
  country: string;
  mapUrl?: string;
}
