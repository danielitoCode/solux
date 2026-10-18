import type { User } from '../entities';
import type { AuthRepository } from '../repository/auth-repository';

export class SignIn {
  constructor(private readonly repository: AuthRepository) {}

  execute(email: string, password: string): Promise<User> {
    return this.repository.signIn(email, password);
  }
}

export class SignOut {
  constructor(private readonly repository: AuthRepository) {}

  execute(): Promise<void> {
    return this.repository.signOut();
  }
}

export class GetSessionUser {
  constructor(private readonly repository: AuthRepository) {}

  execute(): Promise<User | null> {
    return this.repository.getSessionUser();
  }
}

export class ObserveAuthState {
  constructor(private readonly repository: AuthRepository) {}

  execute(callback: (user: User | null) => void): () => void {
    return this.repository.onAuthStateChange(callback);
  }
}
