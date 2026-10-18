export type DevLogEntry = {
  id: string;
  ts: number;
  scope: string;
  message: string;
  detail?: unknown;
  route?: string;
  file?: string;
};

const MAX = 80;
const listeners = new Set<(entries: DevLogEntry[]) => void>();
let entries: DevLogEntry[] = [];

function isDev() {
  return import.meta.env.DEV;
}

function notify() {
  for (const l of listeners) l(entries);
}

export function subscribeDevLogs(cb: (entries: DevLogEntry[]) => void) {
  listeners.add(cb);
  cb(entries);
  return () => listeners.delete(cb);
}

export function clearDevLogs() {
  entries = [];
  notify();
}

export function getDevLogs() {
  return entries;
}

/** Solo desarrollo — no-op en producción */
export function devLog(scope: string, message: string, detail?: unknown) {
  if (!isDev()) return;

  let route: string | undefined;
  try {
    route = typeof location !== 'undefined' ? location.pathname + location.search : undefined;
  } catch {
    /* ssr */
  }

  const entry: DevLogEntry = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    ts: Date.now(),
    scope,
    message,
    detail,
    route
  };

  entries = [entry, ...entries].slice(0, MAX);
  notify();

  const prefix = `[solux:${scope}]`;
  if (detail !== undefined) console.debug(prefix, message, detail);
  else console.debug(prefix, message);
}

export function devError(
  scope: string,
  message: string,
  error: unknown,
  meta?: { route?: string; file?: string }
) {
  if (!isDev()) return;

  const errMsg =
    error instanceof Error
      ? `${error.name}: ${error.message}`
      : typeof error === 'string'
        ? error
        : JSON.stringify(error);

  let stack: string | undefined;
  if (error instanceof Error && error.stack) stack = error.stack;

  let route = meta?.route;
  if (!route) {
    try {
      route = typeof location !== 'undefined' ? location.pathname + location.search : undefined;
    } catch {
      /* */
    }
  }

  const file =
    meta?.file ??
    (stack
      ? stack
          .split('\n')
          .map((l) => l.trim())
          .find((l) => l.includes('.svelte') || l.includes('.ts') || l.includes('.js'))
      : undefined);

  const entry: DevLogEntry = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    ts: Date.now(),
    scope: `ERROR:${scope}`,
    message: `${message} — ${errMsg}`,
    detail: { error: errMsg, stack, file },
    route,
    file
  };

  entries = [entry, ...entries].slice(0, MAX);
  notify();
  console.error(`[solux:ERROR:${scope}]`, message, error);
}
