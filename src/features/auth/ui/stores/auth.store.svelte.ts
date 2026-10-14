import { getAuthRepository } from '$features/auth/di';
import type { User } from '$features/auth/domain/entities';
import { devLog } from '$infrastructure/ui/dev-logger';

let user = $state<User | null>(null);
let loading = $state(true);
let initialized = false;
let unsubscribe: (() => void) | null = null;

function repo() {
  return getAuthRepository();
}

export function getAuthUser() {
  return user;
}

export function isAuthLoading() {
  return loading;
}

export function isStaff() {
  return user !== null && user.isActive;
}

export async function initAuth() {
  if (initialized) return user;
  initialized = true;
  loading = true;
  devLog('auth', 'initAuth start');
  try {
    user = await repo().getSessionUser();
    devLog('auth', 'session user', user?.email ?? null);
  } catch (e) {
    devLog('auth', 'initAuth error', e);
    user = null;
  } finally {
    loading = false;
  }

  unsubscribe = repo().onAuthStateChange((u) => {
    user = u;
    devLog('auth', 'auth state change', u?.email ?? null);
  });

  return user;
}

export async function login(email: string, password: string) {
  loading = true;
  devLog('auth', 'login attempt', email);
  try {
    user = await repo().signIn(email, password);
    devLog('auth', 'login ok', user.email);
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
}

export function destroyAuthListener() {
  unsubscribe?.();
  unsubscribe = null;
  initialized = false;
}
