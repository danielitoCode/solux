import { describe, it, expect } from 'vitest';
import { mapProfileToUser } from '$features/auth/data/mappers/profile.mapper';
import type { ProfileDto } from '$features/auth/data/dto/profile.dto';

describe('profile.mapper', () => {
  it('mapea ProfileDto a User de dominio', () => {
    const dto: ProfileDto = {
      id: 'u1',
      email: 'admin@solux.test',
      full_name: 'Admin SOLUX',
      phone: null,
      role: 'admin',
      is_active: true,
      created_at: '2026-01-01',
      updated_at: '2026-01-02'
    };
    const user = mapProfileToUser(dto);
    expect(user.fullName).toBe('Admin SOLUX');
    expect(user.phone).toBeUndefined();
    expect(user.role).toBe('admin');
    expect(user.isActive).toBe(true);
  });

  it('conserva phone si viene', () => {
    const user = mapProfileToUser({
      id: 'u1',
      email: 's@t.com',
      full_name: 'Soporte',
      phone: '809',
      role: 'support',
      is_active: false,
      created_at: '2026-01-01',
      updated_at: '2026-01-02'
    });
    expect(user.phone).toBe('809');
    expect(user.isActive).toBe(false);
  });
});
