import { assertSupabaseConfigured, supabase } from '$infrastructure/data/supabase-client';
import { devLog, devError } from '$infrastructure/ui/dev-logger';
import type { ProfileDto } from '../../dto/profile.dto';
import type { UserPermissionGrant } from '../../../domain/entities';
import { isFeatureKey } from '../../../domain/entities';

type PermissionRow = {
  feature_key: string;
  can_read: boolean;
  can_write: boolean;
  expires_at: string | null;
  revoked_at: string | null;
};

export class AuthRemoteDataSource {
  async signIn(email: string, password: string) {
    assertSupabaseConfigured();
    devLog('auth-remote', 'signInWithPassword');
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      devError('auth-remote', 'signIn failed', error, {
        file: 'auth-remote-datasource.ts'
      });
      throw error;
    }
    return data;
  }

  async signOut() {
    assertSupabaseConfigured();
    const { error } = await supabase.auth.signOut();
    if (error) {
      devError('auth-remote', 'signOut failed', error);
      throw error;
    }
  }

  async getSession() {
    if (!import.meta.env.VITE_SUPABASE_URL) return null;
    const { data, error } = await supabase.auth.getSession();
    if (error) {
      devError('auth-remote', 'getSession failed', error);
      throw error;
    }
    return data.session;
  }

  async getProfile(userId: string): Promise<ProfileDto | null> {
    assertSupabaseConfigured();
    devLog('auth-remote', 'getProfile', userId);

    let { data, error } = await this.fetchProfile(userId);
    if (!error) return data as ProfileDto | null;

    if (!this.isExpiredJwt(error)) {
      devError('auth-remote', 'getProfile failed', error, {
        file: 'auth-remote-datasource.ts'
      });
      throw error;
    }

    devLog('auth-remote', 'JWT expired; attempting session refresh');
    const { data: refreshed, error: refreshError } = await supabase.auth.refreshSession();

    if (refreshError || !refreshed.session) {
      devError('auth-remote', 'session refresh failed; clearing local session', refreshError ?? error);
      await this.clearLocalSession();
      return null;
    }

    ({ data, error } = await this.fetchProfile(userId));
    if (!error) return data as ProfileDto | null;

    if (this.isExpiredJwt(error)) {
      devError('auth-remote', 'JWT expired after refresh; clearing local session', error);
      await this.clearLocalSession();
      return null;
    }

    devError('auth-remote', 'getProfile failed after session refresh', error, {
      file: 'auth-remote-datasource.ts'
    });
    throw error;
  }

  /** Grants vigentes del usuario (no revocados; caducados se filtran en app). */
  async getUserPermissions(userId: string): Promise<UserPermissionGrant[]> {
    assertSupabaseConfigured();
    const { data, error } = await (supabase as any)
      .from('user_permissions')
      .select('feature_key, can_read, can_write, expires_at, revoked_at')
      .eq('user_id', userId)
      .is('revoked_at', null);

    if (error) {
      if (
        error.code === 'PGRST205' ||
        /user_permissions|schema cache|does not exist/i.test(error.message ?? '')
      ) {
        devLog('auth-remote', 'user_permissions no disponible aún', error.message);
        return [];
      }
      devError('auth-remote', 'getUserPermissions failed', error);
      throw error;
    }

    const now = Date.now();
    const rows = (data ?? []) as PermissionRow[];
    return rows
      .filter((row) => {
        if (!isFeatureKey(row.feature_key)) return false;
        if (row.expires_at && new Date(row.expires_at).getTime() <= now) return false;
        return true;
      })
      .map((row) => ({
        featureKey: row.feature_key as UserPermissionGrant['featureKey'],
        canRead: Boolean(row.can_read),
        canWrite: Boolean(row.can_write),
        expiresAt: row.expires_at
      }));
  }

  private fetchProfile(userId: string) {
    return supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .eq('is_active', true)
      .maybeSingle();
  }

  private isExpiredJwt(error: { code?: string; message?: string }): boolean {
    return error.code === 'PGRST303' || /jwt expired/i.test(error.message ?? '');
  }

  private async clearLocalSession(): Promise<void> {
    const { error } = await supabase.auth.signOut({ scope: 'local' });
    if (error) {
      devError('auth-remote', 'failed to clear local session', error);
    }
  }

  onAuthStateChange(cb: (userId: string | null) => void) {
    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      cb(session?.user?.id ?? null);
    });
    return () => data.subscription.unsubscribe();
  }
}
