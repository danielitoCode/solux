import { redirect } from '@sveltejs/kit';
import type { LayoutLoad } from './$types';
import { getAuthRepository } from '$features/auth/di';
import { devLog, devError } from '$infrastructure/ui/dev-logger';

export const ssr = false;

/**
 * Guard de sesión BO.
 * getSessionUser está cacheado ~45s en el repository para no bloquear cada navegación
 * con un round-trip a profiles.
 */
export const load: LayoutLoad = async ({ url }) => {
  if (url.pathname === '/backoffice/login') {
    return { user: null };
  }

  const allowedRoles: Record<string, string[]> = {
    '/backoffice': ['admin', 'support', 'sales'],
    '/backoffice/reservas': ['admin', 'sales'],
    '/backoffice/soporte': ['admin', 'support'],
    '/backoffice/mensajes': ['admin', 'support', 'sales'],
    '/backoffice/catalogo': ['admin', 'sales'],
    '/backoffice/consumibles': ['admin', 'sales'],
    '/backoffice/inventario': ['admin', 'sales'],
    '/backoffice/finanzas': ['admin'],
    '/backoffice/presentacion': ['admin'],
    '/backoffice/equipo': ['admin'],
    '/backoffice/proyectos': ['admin'],
    '/backoffice/usuarios': ['admin']
  };

  const route = Object.keys(allowedRoles)
    .filter((path) => path !== '/backoffice')
    .sort((a, b) => b.length - a.length)
    .find((path) => url.pathname === path || url.pathname.startsWith(path + '/'));

  try {
    const repo = getAuthRepository();
    const user = await repo.getSessionUser();

    if (!user) {
      throw redirect(303, `/backoffice/login?redirect=${encodeURIComponent(url.pathname)}`);
    }

    const requiredRoles = route ? allowedRoles[route] : allowedRoles['/backoffice'];
    if (!requiredRoles.includes(user.role)) {
      throw redirect(303, '/backoffice');
    }

    return { user };
  } catch (e) {
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
