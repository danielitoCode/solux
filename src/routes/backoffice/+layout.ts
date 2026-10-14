import { redirect } from '@sveltejs/kit';
import type { LayoutLoad } from './$types';
import { getAuthRepository } from '$features/auth/di';
import { devLog, devError } from '$infrastructure/ui/dev-logger';

export const ssr = false;

export const load: LayoutLoad = async ({ url }) => {
  if (url.pathname === '/backoffice/login') {
    devLog('guard', 'login route — skip auth');
    return { user: null };
  }

  devLog('guard', 'checking session', url.pathname);

  try {
    const repo = getAuthRepository();
    const user = await repo.getSessionUser();

    if (!user) {
      devLog('guard', 'no session → redirect login');
      throw redirect(303, `/backoffice/login?redirect=${encodeURIComponent(url.pathname)}`);
    }

    if (url.pathname.startsWith('/backoffice/usuarios') && user.role !== 'admin') {
      devLog('guard', 'users management requires admin', { role: user.role });
      throw redirect(303, '/backoffice');
    }

    devLog('guard', 'ok', { email: user.email, role: user.role });
    return { user };
  } catch (e) {
    // redirect throws; rethrow
    if (e && typeof e === 'object' && 'status' in e && (e as { status: number }).status === 303) {
      throw e;
    }
    devError('guard', 'load failed', e, {
      route: url.pathname,
      file: 'src/routes/backoffice/+layout.ts'
    });
    throw e;
  }
};
