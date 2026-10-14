import { getAuthRepository } from '$features/auth/di';
import type { User } from '$features/auth/domain/entities';

let user = $state<User | null>(null);
let loading = $state(true);
let initialized = false;
let unsubscribe: (() => void) | null = null;

const repo = getAuthRepository();

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
  try {
    user = await repo.getSessionUser();
  } catch {
    user = null;
  } finally {
    loading = false;
  }

  unsubscribe = repo.onAuthStateChange((u) => {
    user = u;
  });

  return user;
}

export async function login(email: string, password: string) {
  loading = true;
  try {
    user = await repo.signIn(email, password);
    return user;
  } finally {
    loading = false;
  }
}

export async function logout() {
  await repo.signOut();
  user = null;
}

export function destroyAuthListener() {
  unsubscribe?.();
  unsubscribe = null;
  initialized = false;
}
