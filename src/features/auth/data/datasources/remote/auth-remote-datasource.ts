import { assertSupabaseConfigured, supabase } from '$infrastructure/data/supabase-client';
import { devLog, devError } from '$infrastructure/ui/dev-logger';
import type { ProfileDto } from '../../dto/profile.dto';

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
