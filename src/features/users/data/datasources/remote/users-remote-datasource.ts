import { supabase } from '$infrastructure/data/supabase-client';
import type { UserDto } from '../../dto/user.dto';
import type { UserRole } from '$infrastructure/data/database.types';
import type { FeatureKey, UserPermissionGrant } from '$features/auth/domain/entities';
import { isFeatureKey } from '$features/auth/domain/entities';
import type { FeatureCatalogItem } from '../../domain/entities/feature-permission';
import type { CreateUserInput, SaveUserPermissionInput } from '../../domain/repository/users-repository';

type FeatureRow = {
  key: string;
  label: string;
  description: string;
  sort_order: number;
};

type PermissionRow = {
  feature_key: string;
  can_read: boolean;
  can_write: boolean;
  expires_at: string | null;
  revoked_at: string | null;
};

export class UsersRemoteDataSource {
  async list(): Promise<UserDto[]> {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return (data ?? []) as UserDto[];
  }

  async update(
    id: string,
    data: { full_name: string; phone: string | null; role: UserRole; is_active: boolean }
  ): Promise<UserDto> {
    const { data: row, error } = await supabase
      .from('profiles')
      .update(data)
      .eq('id', id)
      .select('*')
      .maybeSingle();
    if (error) throw error;
    if (!row) throw new Error('No se actualizó ningún usuario. Verifica permisos y vuelve a cargar la lista.');
    return row as UserDto;
  }

  async setActive(id: string, active: boolean): Promise<UserDto> {
    const { data, error } = await supabase
      .from('profiles')
      .update({ is_active: active })
      .eq('id', id)
      .select('*')
      .maybeSingle();
    if (error) throw error;
    if (!data) throw new Error('No se actualizó ningún usuario. Verifica permisos y vuelve a cargar la lista.');
    return data as UserDto;
  }

  async create(input: CreateUserInput): Promise<{ userId: string; email: string }> {
    const { data, error } = await supabase.functions.invoke('admin-create-user', {
      body: {
        email: input.email,
        password: input.password,
        fullName: input.fullName,
        phone: input.phone,
        role: input.role,
        isActive: input.isActive,
        permissions: input.permissions.map((p) => ({
          featureKey: p.featureKey,
          canRead: p.canRead,
          canWrite: p.canWrite,
          expiresAt: p.expiresAt
        }))
      }
    });

    if (error) {
      // functions.invoke a veces mete el body de error en context
      const ctx = (error as { context?: Response }).context;
      if (ctx && typeof ctx.json === 'function') {
        try {
          const payload = await ctx.json();
          if (payload?.error) throw new Error(String(payload.error));
        } catch (e) {
          if (e instanceof Error && e.message !== error.message) throw e;
        }
      }
      throw new Error(error.message || 'No se pudo crear el usuario');
    }

    const payload = data as { error?: string; userId?: string; email?: string; warning?: string };
    if (payload?.error) throw new Error(payload.error);
    if (!payload?.userId) throw new Error('Respuesta inválida al crear usuario');

    return { userId: payload.userId, email: payload.email ?? input.email };
  }

  async listFeatures(): Promise<FeatureCatalogItem[]> {
    const { data, error } = await (supabase as any)
      .from('features')
      .select('key, label, description, sort_order')
      .order('sort_order', { ascending: true });
    if (error) throw error;
    return ((data ?? []) as FeatureRow[])
      .filter((row) => isFeatureKey(row.key))
      .map((row) => ({
        key: row.key as FeatureKey,
        label: row.label,
        description: row.description ?? '',
        sortOrder: row.sort_order ?? 0
      }));
  }

  async listUserPermissions(userId: string): Promise<UserPermissionGrant[]> {
    const { data, error } = await (supabase as any)
      .from('user_permissions')
      .select('feature_key, can_read, can_write, expires_at, revoked_at')
      .eq('user_id', userId)
      .is('revoked_at', null);
    if (error) throw error;

    const now = Date.now();
    return ((data ?? []) as PermissionRow[])
      .filter((row) => {
        if (!isFeatureKey(row.feature_key)) return false;
        if (row.expires_at && new Date(row.expires_at).getTime() <= now) return false;
        return true;
      })
      .map((row) => ({
        featureKey: row.feature_key as FeatureKey,
        canRead: Boolean(row.can_read),
        canWrite: Boolean(row.can_write),
        expiresAt: row.expires_at
      }));
  }

  async saveUserPermissions(
    userId: string,
    grants: SaveUserPermissionInput[],
    grantedBy: string | null
  ): Promise<UserPermissionGrant[]> {
    const table = () => (supabase as any).from('user_permissions');
    const nowIso = new Date().toISOString();

    const { data: current, error: currentError } = await table()
      .select('feature_key')
      .eq('user_id', userId)
      .is('revoked_at', null);
    if (currentError) throw currentError;

    const desiredKeys = new Set(grants.map((g) => g.featureKey));
    const currentKeys = ((current ?? []) as { feature_key: string }[]).map((r) => r.feature_key);

    const toRevoke = currentKeys.filter((key) => !desiredKeys.has(key as FeatureKey));
    if (toRevoke.length) {
      const { error } = await table()
        .update({ revoked_at: nowIso })
        .eq('user_id', userId)
        .in('feature_key', toRevoke)
        .is('revoked_at', null);
      if (error) throw error;
    }

    if (grants.length) {
      const rows = grants.map((g) => ({
        user_id: userId,
        feature_key: g.featureKey,
        can_read: g.canRead || g.canWrite,
        can_write: g.canWrite,
        granted_by: grantedBy,
        granted_at: nowIso,
        expires_at: g.expiresAt,
        revoked_at: null
      }));

      const { error } = await table().upsert(rows, { onConflict: 'user_id,feature_key' });
      if (error) throw error;
    }

    return this.listUserPermissions(userId);
  }
}
