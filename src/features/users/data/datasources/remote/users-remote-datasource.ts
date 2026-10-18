import { supabase } from '$infrastructure/data/supabase-client';
import type { UserDto } from '../../dto/user.dto';
import type { UserRole } from '$infrastructure/data/database.types';

export class UsersRemoteDataSource {
  async list(): Promise<UserDto[]> {
    const { data, error } = await supabase
      .from('profiles')
      .select('id,email,full_name,phone,role,is_active,created_at')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return (data ?? []) as UserDto[];
  }

  async update(
    id: string,
    payload: { full_name: string; phone: string | null; role: UserRole; is_active: boolean }
  ): Promise<void> {
    const { error } = await supabase.from('profiles').update(payload).eq('id', id);
    if (error) throw error;
  }
}
