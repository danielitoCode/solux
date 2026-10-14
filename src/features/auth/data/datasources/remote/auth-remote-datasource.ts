import { supabase } from '$infrastructure/di/supabase';
import type { ProfileDto } from '../../dto/profile.dto';

export class AuthRemoteDataSource {
  async signIn(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    return data;
  }

  async signOut() {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  }

  async getSession() {
    const { data, error } = await supabase.auth.getSession();
    if (error) throw error;
    return data.session;
  }

  async getProfile(userId: string): Promise<ProfileDto | null> {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .eq('is_active', true)
      .maybeSingle();
    if (error) throw error;
    return data as ProfileDto | null;
  }

  onAuthStateChange(cb: (userId: string | null) => void) {
    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      cb(session?.user?.id ?? null);
    });
    return () => data.subscription.unsubscribe();
  }
}
