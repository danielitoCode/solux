/** Etiquetas legibles para source / intent en backoffice y UI. */

export const INTENT_LABELS: Record<string, string> = {
  buy: 'Comprar',
  install: 'Instalar',
  maintain: 'Mantener',
  contact: 'Contacto',
  advisory: 'Asesoría',
  general: 'General'
};

export const SOURCE_LABELS: Record<string, string> = {
  home: 'Home',
  direct: 'Directo',
  catalog: 'Catálogo',
  facebook: 'Facebook',
  reservas: 'Reservas',
  soporte: 'Soporte',
  contacto: 'Contacto'
};

export function intentLabel(value: string | undefined | null): string {
  if (!value) return '—';
  return INTENT_LABELS[value] ?? value;
}

export function sourceLabel(value: string | undefined | null): string {
  if (!value) return '—';
  return SOURCE_LABELS[value] ?? value;
}
