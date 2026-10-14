import type { UserRole } from '../../domain/entities';

export interface ProfileDto {
  id: string;
  email: string;
  full_name: string;
  phone: string | null;
  role: UserRole;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}
