import { getAuthRepository } from '$features/auth/di';
import type { FeatureAccess, FeatureKey, User, UserPermissionGrant } from '$features/auth/domain/entities';
import { ALL_FEATURE_KEYS } from '$features/auth/domain/entities';
import { supabase } from '$infrastructure/data/supabase-client';
import { devLog } from '$infrastructure/ui/dev-logger';
import type { RealtimeChannel } from '@supabase/supabase-js';

let user = $state<User | null>(null);
let permissions = $state<UserPermissionGrant[]>([]);
let loading = $state(true);
let initialized = false;
let unsubscribe: (() => void) | null = null;
let permissionsChannel: RealtimeChannel | null = null;
let focusHandler: (() => void) | null = null;
let refreshInFlight: Promise<void> | null = null;
let lastFocusRefresh = 0;

function repo() {
  return getAuthRepository();
}

async function loadPermissionsFor(u: User | null) {
  if (!u) {
    permissions = [];
    return;
  }
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

function teardownPermissionsLive() {
  if (permissionsChannel) {
    void supabase.removeChannel(permissionsChannel);
    permissionsChannel = null;
  }
  if (focusHandler && typeof document !== 'undefined') {
    document.removeEventListener('visibilitychange', focusHandler);
    window.removeEventListener('focus', focusHandler);
    focusHandler = null;
  }
}

function setupPermissionsLive(u: User | null) {
  teardownPermissionsLive();
  if (!u || typeof window === 'undefined') return;

  // No refrescar en cada focus de ventana: solo si pasaron ≥8s (evita jank al cambiar de pestaña)
  focusHandler = () => {
    if (document.visibilityState !== 'visible') return;
    const now = Date.now();
    if (now - lastFocusRefresh < 8_000) return;
    lastFocusRefresh = now;
    void refreshAuthPermissions();
  };
  document.addEventListener('visibilitychange', focusHandler);
  window.addEventListener('focus', focusHandler);

  permissionsChannel = supabase
    .channel(`user-permissions:${u.id}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'user_permissions',
        filter: `user_id=eq.${u.id}`
      },
      () => {
        devLog('auth', 'user_permissions change → refresh');
        void refreshAuthPermissions();
      }
    )
    .subscribe((status) => {
      devLog('auth', 'permissions channel', status);
    });
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

export function hasFeature(feature: FeatureKey, access: FeatureAccess = 'read'): boolean {
  if (!user || !user.isActive) return false;
  if (user.role === 'admin') return true;
  const grant = permissions.find((p) => p.featureKey === feature);
  if (!grant) return false;
  if (access === 'write') return grant.canWrite;
  return grant.canRead || grant.canWrite;
}

export async function refreshAuthPermissions() {
  if (refreshInFlight) return refreshInFlight;

  refreshInFlight = (async () => {
    try {
      // Forzar perfil fresco al refrescar permisos explícitamente
      const impl = repo() as { invalidateSessionCache?: () => void };
      impl.invalidateSessionCache?.();
      const sessionUser = await repo().getSessionUser();
      user = sessionUser;
      await loadPermissionsFor(sessionUser);
      devLog('auth', 'permissions refreshed', sessionUser?.email ?? null, permissions.length);
    } catch (e) {
      devLog('auth', 'refreshAuthPermissions error', e);
    } finally {
      refreshInFlight = null;
    }
  })();

  return refreshInFlight;
}

export async function initAuth() {
  if (initialized) return user;
  initialized = true;
  loading = true;
  devLog('auth', 'initAuth start');
  try {
    user = await repo().getSessionUser();
    await loadPermissionsFor(user);
    setupPermissionsLive(user);
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
    setupPermissionsLive(u);
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
    setupPermissionsLive(user);
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
  teardownPermissionsLive();
  await repo().signOut();
  user = null;
  permissions = [];
}

export function destroyAuthListener() {
  unsubscribe?.();
  unsubscribe = null;
  teardownPermissionsLive();
  initialized = false;
}
