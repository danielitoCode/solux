import type { HandleServerError } from '@sveltejs/kit';

export const handleError: HandleServerError = ({ error, event, status, message }) => {
  const err = error instanceof Error ? error : new Error(message ?? 'Server error');
  console.error('[solux:server]', status, event.url.pathname, err);

  const file =
    err.stack
      ?.split('\n')
      .map((l) => l.trim())
      .find((l) => /src\//.test(l)) ?? undefined;

  return {
    message: message ?? err.message,
    file
  };
};
