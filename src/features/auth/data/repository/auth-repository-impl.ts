import type { AuthRepository } from '../../domain/repository/auth-repository';
import type { User } from '../../domain/entities';
import { AuthRemoteDataSource } from '../datasources/remote/auth-remote-datasource';
import { mapProfileToUser } from '../mappers/profile.mapper';

export class AuthRepositoryImpl implements AuthRepository {
  constructor(private readonly remote = new AuthRemoteDataSource()) {}

  async signIn(email: string, password: string): Promise<User> {
    const { user } = await this.remote.signIn(email, password);
    if (!user) throw new Error('No user returned');
    const profile = await this.remote.getProfile(user.id);
    if (!profile) throw new Error('Perfil staff no encontrado o inactivo');
    return mapProfileToUser(profile);
  }

  async signOut(): Promise<void> {
    await this.remote.signOut();
  }

  async getSessionUser(): Promise<User | null> {
    const session = await this.remote.getSession();
    if (!session?.user) return null;
    const profile = await this.remote.getProfile(session.user.id);
    if (!profile) return null;
    return mapProfileToUser(profile);
  }

  onAuthStateChange(cb: (user: User | null) => void): () => void {
    return this.remote.onAuthStateChange(async (userId) => {
      if (!userId) {
        cb(null);
        return;
      }
      try {
        const profile = await this.remote.getProfile(userId);
        cb(profile ? mapProfileToUser(profile) : null);
      } catch {
        cb(null);
      }
    });
  }
}
