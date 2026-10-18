import type { BackofficeUser } from '../../domain/entities/backoffice-user';
import type { UserDto } from '../dto/user.dto';

export function mapUserDto(dto: UserDto): BackofficeUser { return { id: dto.id, email: dto.email, fullName: dto.full_name, phone: dto.phone, role: dto.role, isActive: dto.is_active, createdAt: dto.created_at, updatedAt: dto.updated_at }; }
