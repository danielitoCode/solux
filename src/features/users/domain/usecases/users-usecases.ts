import type { BackofficeUser } from '../entities/backoffice-user';
import type { UsersRepository } from '../repository/users-repository';

export class ListUsers { constructor(private readonly repository: UsersRepository) {} execute() { return this.repository.list(); } }
export class UpdateUser { constructor(private readonly repository: UsersRepository) {} execute(id: string, data: { fullName: string; phone: string | null; role: BackofficeUser['role']; isActive: boolean }) { return this.repository.update(id, data); } }
export class SetUserActive { constructor(private readonly repository: UsersRepository) {} execute(id: string, active: boolean) { return this.repository.setActive(id, active); } }
