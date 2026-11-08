/** Módulos del backoffice controlados por permisos por usuario. */
export type FeatureKey =
  | 'dashboard'
  | 'reservations'
  | 'support'
  | 'messages'
  | 'catalog'
  | 'consumables'
  | 'inventory'
  | 'finance'
  | 'presentation'
  | 'team'
  | 'projects'
  | 'users';

export type FeatureAccess = 'read' | 'write';

export type UserPermissionGrant = {
  featureKey: FeatureKey;
  canRead: boolean;
  canWrite: boolean;
  expiresAt: string | null;
};

export const ALL_FEATURE_KEYS: FeatureKey[] = [
  'dashboard',
  'reservations',
  'support',
  'messages',
  'catalog',
  'consumables',
  'inventory',
  'finance',
  'presentation',
  'team',
  'projects',
  'users'
];

export function isFeatureKey(value: string): value is FeatureKey {
  return (ALL_FEATURE_KEYS as string[]).includes(value);
}
