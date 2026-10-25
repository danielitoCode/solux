import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { BackofficeUser } from '$features/users/domain/entities/backoffice-user';
import type { UsersRepository } from '$features/users/domain/repository/users-repository';
import { ListUsers, UpdateUser, SetUserActive } from '$features/users/domain/usecases/users-usecases';

const user = (o: Partial<BackofficeUser> = {}): BackofficeUser =>
  ({ id: 'u-1', fullName: 'Admin', email: 'a@t.com', role: 'admin', isActive: true, ...o }) as BackofficeUser;

describe('users-usecases', () => {
  let repo: UsersRepository;
  beforeEach(() => { repo = { list: vi.fn(), update: vi.fn(), setActive: vi.fn() }; });
  it('ListUsers', async () => {
    vi.mocked(repo.list).mockResolvedValue([user()]);
    expect(await new ListUsers(repo).execute()).toHaveLength(1);
  });
  it('UpdateUser', async () => {
    const data = { fullName: 'N', phone: null, role: 'sales' as const, isActive: true };
    vi.mocked(repo.update).mockResolvedValue(user(data));
    await new UpdateUser(repo).execute('u-1', data);
    expect(repo.update).toHaveBeenCalledWith('u-1', data);
  });
  it('SetUserActive', async () => {
    vi.mocked(repo.setActive).mockResolvedValue(user({ isActive: false }));
    await new SetUserActive(repo).execute('u-1', false);
    expect(repo.setActive).toHaveBeenCalledWith('u-1', false);
  });
});
