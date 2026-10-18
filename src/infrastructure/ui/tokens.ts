/** Design tokens as TS constants for use in components if needed */
export const colors = {
  bg: 'var(--color-bg)',
  surface: 'var(--color-surface)',
  surface2: 'var(--color-surface-2)',
  text: 'var(--color-text)',
  muted: 'var(--color-muted)',
  primary: 'var(--color-primary)',
  primary2: 'var(--color-primary-2)',
  primaryHover: 'var(--color-primary-hover)',
  accent: 'var(--color-accent)',
  border: 'var(--color-border)',
} as const;

export const radius = {
  sm: 'var(--radius-sm)',
  md: 'var(--radius-md)',
  lg: 'var(--radius-lg)',
  xl: 'var(--radius-xl)',
  '2xl': 'var(--radius-2xl)',
} as const;
