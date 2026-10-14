import type { User } from '../entities';

export interface AuthRepository {
  signIn(email: string, password: string): Promise<User>;
  signOut(): Promise<void>;
  getSessionUser(): Promise<User | null>;
  onAuthStateChange(cb: (user: User | null) => void): () => void;
}
