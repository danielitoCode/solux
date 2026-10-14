import type { User } from '../../domain/entities';
import type { ProfileDto } from '../dto/profile.dto';

export function mapProfileToUser(dto: ProfileDto): User {
  return {
    id: dto.id,
    email: dto.email,
    fullName: dto.full_name,
    phone: dto.phone ?? undefined,
    role: dto.role,
    isActive: dto.is_active,
    createdAt: dto.created_at,
    updatedAt: dto.updated_at
  };
}
