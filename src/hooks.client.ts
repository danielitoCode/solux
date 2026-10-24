import type { HandleClientError } from '@sveltejs/kit';
import { devError, devLog } from '$infrastructure/ui/dev-logger';
import { registerAnimateIcons } from '$infrastructure/ui/animate-icons-registry';

// Registrar custom element cuanto antes en el cliente
registerAnimateIcons();

export const handleError: HandleClientError = ({ error, event, status, message }) => {
  const err = error instanceof Error ? error : new Error(message ?? 'Client error');
  const file =
    err.stack
      ?.split('\n')
      .map((l) => l.trim())
      .find((l) => /\.svelte|\.ts|\.js/.test(l)) ?? undefined;

  devError('client', message ?? err.message, err, {
    route: event.url.pathname + event.url.search,
    file
  });

  devLog('client', `status ${status}`, { path: event.url.pathname });

  return {
    message: message ?? err.message,
    file
  };
};
