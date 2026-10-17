import { supabase } from '$infrastructure/data/supabase-client';
import type { UserDto } from '../dto/user.dto';
import type { UserRole } from '$infrastructure/data/database.types';

export class UsersRemoteDataSource {
  async list(): Promise<UserDto[]> { const { data, error } = await supabase.from('profiles').select('*').order('created_at', { ascending: false }); if (error) throw error; return (data ?? []) as UserDto[]; }
  async update(id: string, data: { full_name: string; phone: string | null; role: UserRole; is_active: boolean }): Promise<UserDto> { const { data: row, error } = await supabase.from('profiles').update(data).eq('id', id).select('*').maybeSingle(); if (error) throw error; if (!row) throw new Error('No se actualizó ningún usuario. Verifica permisos y vuelve a cargar la lista.'); return row as UserDto; }
  async setActive(id: string, active: boolean): Promise<UserDto> { const { data, error } = await supabase.from('profiles').update({ is_active: active }).eq('id', id).select('*').maybeSingle(); if (error) throw error; if (!data) throw new Error('No se actualizó ningún usuario. Verifica permisos y vuelve a cargar la lista.'); return data as UserDto; }
}
