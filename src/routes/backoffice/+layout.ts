import { redirect } from '@sveltejs/kit';
import type { LayoutLoad } from './$types';
import { getAuthRepository } from '$features/auth/di';

export const ssr = false;

export const load: LayoutLoad = async ({ url }) => {
  // Login es público dentro de /backoffice
  if (url.pathname === '/backoffice/login') {
    return { user: null };
  }

  const repo = getAuthRepository();
  const user = await repo.getSessionUser();

  if (!user) {
    throw redirect(303, `/backoffice/login?redirect=${encodeURIComponent(url.pathname)}`);
  }

  return { user };
};
