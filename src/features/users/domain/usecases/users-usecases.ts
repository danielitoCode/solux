import type { UserPermissionGrant } from '$features/auth/domain/entities';
import type { BackofficeUser } from '../entities/backoffice-user';
import type { FeatureCatalogItem } from '../entities/feature-permission';
import type { SaveUserPermissionInput, UsersRepository } from '../repository/users-repository';

export class ListUsers {
  constructor(private readonly repository: UsersRepository) {}
  execute() {
    return this.repository.list();
  }
}

export class UpdateUser {
  constructor(private readonly repository: UsersRepository) {}
  execute(
    id: string,
    data: { fullName: string; phone: string | null; role: BackofficeUser['role']; isActive: boolean }
  ) {
    return this.repository.update(id, data);
  }
}

export class SetUserActive {
  constructor(private readonly repository: UsersRepository) {}
  execute(id: string, active: boolean) {
    return this.repository.setActive(id, active);
  }
}

export class ListFeatures {
  constructor(private readonly repository: UsersRepository) {}
  execute(): Promise<FeatureCatalogItem[]> {
    return this.repository.listFeatures();
  }
}

export class ListUserPermissions {
  constructor(private readonly repository: UsersRepository) {}
  execute(userId: string): Promise<UserPermissionGrant[]> {
    return this.repository.listUserPermissions(userId);
  }
}

export class SaveUserPermissions {
  constructor(private readonly repository: UsersRepository) {}
  execute(userId: string, grants: SaveUserPermissionInput[], grantedBy: string | null) {
    return this.repository.saveUserPermissions(userId, grants, grantedBy);
  }
}
