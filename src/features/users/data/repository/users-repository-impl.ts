import type { BackofficeUser } from '../../domain/entities/backoffice-user';
import type { UsersRepository } from '../../domain/repository/users-repository';
import { UsersRemoteDataSource } from '../datasources/remote/users-remote-datasource';
import { mapUserDto } from '../mappers/user.mapper';

export class UsersRepositoryImpl implements UsersRepository {
  constructor(private readonly remote = new UsersRemoteDataSource()) {}
  async list() { return (await this.remote.list()).map(mapUserDto); }
  async update(id: string, data: { fullName: string; phone: string | null; role: BackofficeUser['role']; isActive: boolean }) { return mapUserDto(await this.remote.update(id, { full_name: data.fullName, phone: data.phone, role: data.role, is_active: data.isActive })); }
  async setActive(id: string, active: boolean) { return mapUserDto(await this.remote.setActive(id, active)); }
}
