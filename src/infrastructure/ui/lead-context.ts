/** Origen e intención de leads (captura comercial). */
export type LeadIntent = 'buy' | 'install' | 'maintain' | 'advisory' | 'contact' | 'general';
export type LeadSource =
  | 'home'
  | 'catalog'
  | 'services'
  | 'reservas'
  | 'soporte'
  | 'contacto'
  | 'facebook'
  | 'direct';

const INTENTS = new Set<string>(['buy', 'install', 'maintain', 'advisory', 'contact', 'general']);
const SOURCES = new Set<string>([
  'home',
  'catalog',
  'services',
  'reservas',
  'soporte',
  'contacto',
  'facebook',
  'direct'
]);

export function parseLeadIntent(raw: string | null | undefined, fallback: LeadIntent = 'general'): LeadIntent {
  const v = (raw ?? '').trim().toLowerCase();
  return (INTENTS.has(v) ? v : fallback) as LeadIntent;
}

export function parseLeadSource(raw: string | null | undefined, fallback: LeadSource = 'direct'): LeadSource {
  const v = (raw ?? '').trim().toLowerCase();
  return (SOURCES.has(v) ? v : fallback) as LeadSource;
}

/** Lee ?intent= & ?source= de la URL actual (cliente). */
export function readLeadFromLocation(defaults?: {
  intent?: LeadIntent;
  source?: LeadSource;
}): { intent: LeadIntent; source: LeadSource } {
  if (typeof location === 'undefined') {
    return { intent: defaults?.intent ?? 'general', source: defaults?.source ?? 'direct' };
  }
  const q = new URLSearchParams(location.search);
  return {
    intent: parseLeadIntent(q.get('intent'), defaults?.intent ?? 'general'),
    source: parseLeadSource(q.get('source'), defaults?.source ?? 'direct')
  };
}
