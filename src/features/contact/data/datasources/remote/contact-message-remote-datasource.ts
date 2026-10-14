import { assertSupabaseConfigured, supabase } from '$infrastructure/data/supabase-client';
import { devLog, devError } from '$infrastructure/ui/dev-logger';
import type { ContactMessageDto } from '../../dto/contact-message.dto';

export class ContactMessageRemoteDataSource {
  async listAll(): Promise<ContactMessageDto[]> {
    assertSupabaseConfigured();
    devLog('contact-remote', 'listAll');
    const { data, error } = await supabase
      .from('contact_messages')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) {
      devError('contact-remote', 'listAll failed', error);
      throw error;
    }
    return (data ?? []) as ContactMessageDto[];
  }

  async markRead(id: string, isRead = true): Promise<ContactMessageDto> {
    assertSupabaseConfigured();
    devLog('contact-remote', 'markRead', { id, isRead });
    const { data, error } = await supabase
      .from('contact_messages')
      .update({ is_read: isRead })
      .eq('id', id)
      .select()
      .single();
    if (error) {
      devError('contact-remote', 'markRead failed', error);
      throw error;
    }
    return data as ContactMessageDto;
  }
}
