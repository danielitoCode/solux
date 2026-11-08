import type { AuthRepository } from '../../domain/repository/auth-repository';
import type { User, UserPermissionGrant } from '../../domain/entities';
import { AuthRemoteDataSource } from '../datasources/remote/auth-remote-datasource';
import { mapProfileToUser } from '../mappers/profile.mapper';

/** Evita getProfile en cada navegación del layout BO. */
const SESSION_TTL_MS = 45_000;

export class AuthRepositoryImpl implements AuthRepository {
  private sessionCache: { user: User | null; at: number } | null = null;

  constructor(private readonly remote = new AuthRemoteDataSource()) {}

  private writeCache(user: User | null) {
    this.sessionCache = { user, at: Date.now() };
  }

  invalidateSessionCache() {
    this.sessionCache = null;
  }

  async signIn(email: string, password: string): Promise<User> {
    this.invalidateSessionCache();
    const { user } = await this.remote.signIn(email, password);
    if (!user) throw new Error('No user returned');
    const profile = await this.remote.getProfile(user.id);
    if (!profile) throw new Error('Perfil staff no encontrado o inactivo');
    const mapped = mapProfileToUser(profile);
    this.writeCache(mapped);
    return mapped;
  }

  async signOut(): Promise<void> {
    this.invalidateSessionCache();
    await this.remote.signOut();
  }

  async getSessionUser(): Promise<User | null> {
    const now = Date.now();
    if (this.sessionCache && now - this.sessionCache.at < SESSION_TTL_MS) {
      return this.sessionCache.user;
    }

    const session = await this.remote.getSession();
    if (!session?.user) {
      this.writeCache(null);
      return null;
    }
    const profile = await this.remote.getProfile(session.user.id);
    if (!profile) {
      this.writeCache(null);
      return null;
    }
    const mapped = mapProfileToUser(profile);
    this.writeCache(mapped);
    return mapped;
  }

  getUserPermissions(userId: string): Promise<UserPermissionGrant[]> {
    return this.remote.getUserPermissions(userId);
  }

  onAuthStateChange(cb: (user: User | null) => void): () => void {
    return this.remote.onAuthStateChange(async (userId) => {
      this.invalidateSessionCache();
      if (!userId) {
        this.writeCache(null);
        cb(null);
        return;
      }
      try {
        const profile = await this.remote.getProfile(userId);
        const mapped = profile ? mapProfileToUser(profile) : null;
        this.writeCache(mapped);
        cb(mapped);
      } catch {
        this.writeCache(null);
        cb(null);
      }
    });
  }
}
