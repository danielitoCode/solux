export type UserDto = { id: string; email: string; full_name: string; phone: string | null; role: 'admin' | 'support' | 'sales'; is_active: boolean; created_at: string; updated_at: string };
