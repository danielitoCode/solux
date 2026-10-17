import type { BackofficeUser } from '../entities/backoffice-user';

export interface UsersRepository {
  list(): Promise<BackofficeUser[]>;
  update(id: string, data: { fullName: string; phone: string | null; role: BackofficeUser['role']; isActive: boolean }): Promise<BackofficeUser>;
  setActive(id: string, active: boolean): Promise<BackofficeUser>;
}
