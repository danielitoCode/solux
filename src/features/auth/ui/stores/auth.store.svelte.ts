import { getAuthRepository } from '$features/auth/di';
import type { FeatureAccess, FeatureKey, User, UserPermissionGrant } from '$features/auth/domain/entities';
import { ALL_FEATURE_KEYS } from '$features/auth/domain/entities';
import { devLog } from '$infrastructure/ui/dev-logger';

let user = $state<User | null>(null);
let permissions = $state<UserPermissionGrant[]>([]);
let loading = $state(true);
let initialized = false;
let unsubscribe: (() => void) | null = null;

function repo() {
  return getAuthRepository();
}

async function loadPermissionsFor(u: User | null) {
  if (!u) {
    permissions = [];
    return;
  }
  // Admin: acceso total en cliente (RLS también lo respeta vía has_feature)
  if (u.role === 'admin') {
    permissions = ALL_FEATURE_KEYS.map((featureKey) => ({
      featureKey,
      canRead: true,
      canWrite: true,
      expiresAt: null
    }));
    return;
  }
  try {
    permissions = await repo().getUserPermissions(u.id);
  } catch (e) {
    devLog('auth', 'loadPermissions error', e);
    permissions = [];
  }
}

export function getAuthUser() {
  return user;
}

export function getAuthPermissions() {
  return permissions;
}

export function isAuthLoading() {
  return loading;
}

export function isStaff() {
  return user !== null && user.isActive;
}

/** Comprueba permiso de módulo para el usuario en sesión. */
export function hasFeature(feature: FeatureKey, access: FeatureAccess = 'read'): boolean {
  if (!user || !user.isActive) return false;
  if (user.role === 'admin') return true;
  const grant = permissions.find((p) => p.featureKey === feature);
  if (!grant) return false;
  if (access === 'write') return grant.canWrite;
  return grant.canRead || grant.canWrite;
}

export async function initAuth() {
  if (initialized) return user;
  initialized = true;
  loading = true;
  devLog('auth', 'initAuth start');
  try {
    user = await repo().getSessionUser();
    await loadPermissionsFor(user);
    devLog('auth', 'session user', user?.email ?? null, 'perms', permissions.length);
  } catch (e) {
    devLog('auth', 'initAuth error', e);
    user = null;
    permissions = [];
  } finally {
    loading = false;
  }

  unsubscribe = repo().onAuthStateChange(async (u) => {
    user = u;
    await loadPermissionsFor(u);
    devLog('auth', 'auth state change', u?.email ?? null);
  });

  return user;
}

export async function login(email: string, password: string) {
  loading = true;
  devLog('auth', 'login attempt', email);
  try {
    user = await repo().signIn(email, password);
    await loadPermissionsFor(user);
    devLog('auth', 'login ok', user.email, 'perms', permissions.length);
    return user;
  } catch (e) {
    devLog('auth', 'login error', e);
    throw e;
  } finally {
    loading = false;
  }
}

export async function logout() {
  devLog('auth', 'logout');
  await repo().signOut();
  user = null;
  permissions = [];
}

export function destroyAuthListener() {
  unsubscribe?.();
  unsubscribe = null;
  initialized = false;
}
