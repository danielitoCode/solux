import { AuthRepositoryImpl } from '../data/repository/auth-repository-impl';
import type { AuthRepository } from '../domain/repository/auth-repository';

let authRepository: AuthRepository | null = null;

export function getAuthRepository(): AuthRepository {
  if (!authRepository) {
    authRepository = new AuthRepositoryImpl();
  }
  return authRepository;
}
