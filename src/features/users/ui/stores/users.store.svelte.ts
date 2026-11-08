import { getUsersUseCases } from '$features/users/di';
import type { UserPermissionGrant } from '$features/auth/domain/entities';
import type { BackofficeUser } from '../../domain/entities/backoffice-user';
import type { FeatureCatalogItem } from '../../domain/entities/feature-permission';
import type { SaveUserPermissionInput } from '../../domain/repository/users-repository';

const useCases = getUsersUseCases();

let users = $state<BackofficeUser[]>([]);
let features = $state<FeatureCatalogItem[]>([]);
let loading = $state(true);
let saving = $state(false);
let updatingUsers = $state<string[]>([]);
let error = $state('');
let success = $state('');

export function getUsersState() {
  return {
    get users() {
      return users;
    },
    get features() {
      return features;
    },
    get loading() {
      return loading;
    },
    get saving() {
      return saving;
    },
    get updatingUsers() {
      return updatingUsers;
    },
    get error() {
      return error;
    },
    get success() {
      return success;
    }
  };
}

export async function loadUsers() {
  loading = true;
  error = '';
  try {
    const [userRows, featureRows] = await Promise.all([
      useCases.list.execute(),
      useCases.listFeatures.execute().catch(() => [] as FeatureCatalogItem[])
    ]);
    users = userRows;
    features = featureRows;
  } catch (e) {
    error = e instanceof Error ? e.message : 'No se pudieron cargar los usuarios.';
  } finally {
    loading = false;
  }
}

export async function loadUserPermissions(userId: string): Promise<UserPermissionGrant[]> {
  return useCases.listUserPermissions.execute(userId);
}

export async function updateUser(
  id: string,
  data: { fullName: string; phone: string | null; role: BackofficeUser['role']; isActive: boolean }
) {
  if (saving) return;
  saving = true;
  error = '';
  success = '';
  try {
    const updated = await useCases.update.execute(id, data);
    users = users.map((user) => (user.id === updated.id ? updated : user));
    success = 'Usuario actualizado.';
    return updated;
  } catch (e) {
    error = e instanceof Error ? e.message : 'No se pudo guardar el usuario.';
    throw e;
  } finally {
    saving = false;
  }
}

export async function saveUserPermissions(
  userId: string,
  grants: SaveUserPermissionInput[],
  grantedBy: string | null
) {
  if (saving) return;
  saving = true;
  error = '';
  success = '';
  try {
    await useCases.saveUserPermissions.execute(userId, grants, grantedBy);
    success = 'Permisos actualizados.';
  } catch (e) {
    error = e instanceof Error ? e.message : 'No se pudieron guardar los permisos.';
    throw e;
  } finally {
    saving = false;
  }
}

export async function toggleUserActive(user: BackofficeUser) {
  if (saving || updatingUsers.includes(user.id)) return;
  error = '';
  success = '';
  updatingUsers = [...updatingUsers, user.id];
  try {
    const updated = await useCases.setActive.execute(user.id, !user.isActive);
    users = users.map((item) => (item.id === updated.id ? updated : item));
    success = user.isActive ? 'Usuario desactivado.' : 'Usuario activado.';
  } catch (e) {
    error = e instanceof Error ? e.message : 'No se pudo cambiar el estado.';
  } finally {
    updatingUsers = updatingUsers.filter((id) => id !== user.id);
  }
}
