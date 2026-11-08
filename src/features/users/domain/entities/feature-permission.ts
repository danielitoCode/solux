import type { FeatureKey } from '$features/auth/domain/entities';

export type FeatureCatalogItem = {
  key: FeatureKey;
  label: string;
  description: string;
  sortOrder: number;
};

/** Estado editable de un grant en el formulario de usuarios. */
export type EditableUserPermission = {
  featureKey: FeatureKey;
  enabled: boolean;
  canRead: boolean;
  canWrite: boolean;
  /** datetime-local value o '' si sin caducidad */
  expiresAtLocal: string;
};
