import { describe, it, expect } from 'vitest';
import { mapUserDto } from '$features/users/data/mappers/user.mapper';
import type { UserDto } from '$features/users/data/dto/user.dto';

describe('user.mapper', () => {
  it('mapea UserDto a BackofficeUser', () => {
    const dto: UserDto = {
      id: 'u1',
      email: 'sales@solux.test',
      full_name: 'Ventas',
      phone: null,
      role: 'sales',
      is_active: true,
      created_at: '2026-01-01',
      updated_at: '2026-01-02'
    };
    const u = mapUserDto(dto);
    expect(u.fullName).toBe('Ventas');
    expect(u.role).toBe('sales');
    expect(u.phone).toBeNull();
  });
});
