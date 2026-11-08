import type { User, UserPermissionGrant } from '../entities';

export interface AuthRepository {
  signIn(email: string, password: string): Promise<User>;
  signOut(): Promise<void>;
  getSessionUser(): Promise<User | null>;
  getUserPermissions(userId: string): Promise<UserPermissionGrant[]>;
  onAuthStateChange(cb: (user: User | null) => void): () => void;
}
