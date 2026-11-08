import type { FeatureKey, UserPermissionGrant } from '$features/auth/domain/entities';
import type { BackofficeUser } from '../entities/backoffice-user';
import type { FeatureCatalogItem } from '../entities/feature-permission';

export type SaveUserPermissionInput = {
  featureKey: FeatureKey;
  canRead: boolean;
  canWrite: boolean;
  expiresAt: string | null;
};

export interface UsersRepository {
  list(): Promise<BackofficeUser[]>;
  update(
    id: string,
    data: { fullName: string; phone: string | null; role: BackofficeUser['role']; isActive: boolean }
  ): Promise<BackofficeUser>;
  setActive(id: string, active: boolean): Promise<BackofficeUser>;
  listFeatures(): Promise<FeatureCatalogItem[]>;
  listUserPermissions(userId: string): Promise<UserPermissionGrant[]>;
  saveUserPermissions(
    userId: string,
    grants: SaveUserPermissionInput[],
    grantedBy: string | null
  ): Promise<UserPermissionGrant[]>;
}
