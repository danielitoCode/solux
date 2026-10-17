import { assertSupabaseConfigured, supabase } from '$infrastructure/data/supabase-client';

export interface PublicContactInfoDto {
  email: string;
  phone: string;
  whatsapp: string | null;
  address: string;
  city: string;
  country: string;
  map_url: string | null;
}
export interface BusinessHourDto {
  day: string;
  open_time: string | null;
  close_time: string | null;
  is_closed: boolean;
}
export interface CreateContactMessageDto {
  name: string;
  email: string;
  phone: string | null;
  subject: 'general';
  message: string;
}
export interface CompanyProfileDto {
  name: string | null;
  logo_url: string | null;
}

export class PublicContactRemoteDataSource {
  async getContactInfo(): Promise<PublicContactInfoDto | null> {
    assertSupabaseConfigured();
    const { data, error } = await supabase.from('contact_info')
      .select('email,phone,whatsapp,address,city,country,map_url').limit(1).maybeSingle();
    if (error) throw error;
    return data as PublicContactInfoDto | null;
  }

  async getBusinessHours(): Promise<BusinessHourDto[]> {
    assertSupabaseConfigured();
    const { data, error } = await supabase.from('business_hours')
      .select('day,open_time,close_time,is_closed').order('day');
    if (error) throw error;
    return (data ?? []) as BusinessHourDto[];
  }

  async sendMessage(input: CreateContactMessageDto): Promise<void> {
    assertSupabaseConfigured();
    const { error } = await supabase.from('contact_messages').insert(input);
    if (error) throw error;
  }

  async getCompanyProfile(): Promise<CompanyProfileDto | null> {
    assertSupabaseConfigured();
    const { data, error } = await supabase.from('company_profile')
      .select('name,logo_url').limit(1).maybeSingle();
    if (error) throw error;
    return data as CompanyProfileDto | null;
  }
}
