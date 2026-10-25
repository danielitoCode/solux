import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { User } from '$features/auth/domain/entities';
import type { AuthRepository } from '$features/auth/domain/repository/auth-repository';
import {
  SignIn,
  SignOut,
  GetSessionUser,
  ObserveAuthState
} from '$features/auth/domain/usecases/auth-usecases';

const sampleUser = (overrides: Partial<User> = {}): User => ({
  id: 'u-1',
  email: 'admin@solux.test',
  fullName: 'Admin SOLUX',
  role: 'admin',
  isActive: true,
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-01T00:00:00Z',
  ...overrides
});

describe('auth-usecases', () => {
  let repo: AuthRepository;

  beforeEach(() => {
    repo = {
      signIn: vi.fn(),
      signOut: vi.fn(),
      getSessionUser: vi.fn(),
      onAuthStateChange: vi.fn()
    };
  });

  it('SignIn delega credenciales', async () => {
    vi.mocked(repo.signIn).mockResolvedValue(sampleUser());

    const result = await new SignIn(repo).execute('admin@solux.test', 'secret');

    expect(repo.signIn).toHaveBeenCalledWith('admin@solux.test', 'secret');
    expect(result.role).toBe('admin');
  });

  it('SignOut llama repository.signOut', async () => {
    vi.mocked(repo.signOut).mockResolvedValue(undefined);

    await new SignOut(repo).execute();

    expect(repo.signOut).toHaveBeenCalledOnce();
  });

  it('GetSessionUser devuelve usuario de sesión', async () => {
    vi.mocked(repo.getSessionUser).mockResolvedValue(sampleUser());

    const result = await new GetSessionUser(repo).execute();

    expect(result?.email).toBe('admin@solux.test');
  });

  it('GetSessionUser devuelve null sin sesión', async () => {
    vi.mocked(repo.getSessionUser).mockResolvedValue(null);

    const result = await new GetSessionUser(repo).execute();

    expect(result).toBeNull();
  });

  it('ObserveAuthState registra callback y devuelve unsubscribe', () => {
    const unsub = vi.fn();
    vi.mocked(repo.onAuthStateChange).mockReturnValue(unsub);
    const cb = vi.fn();

    const stop = new ObserveAuthState(repo).execute(cb);

    expect(repo.onAuthStateChange).toHaveBeenCalledWith(cb);
    stop();
    expect(unsub).toHaveBeenCalledOnce();
  });
});
