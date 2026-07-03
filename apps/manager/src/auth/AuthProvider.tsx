import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import type { Session } from '@supabase/supabase-js';
import type { Profile, UserRole } from '@lignezero/types';
import { supabase } from '@/lib/supabase';

interface AuthState {
  session: Session | null;
  profile: Profile | null;
  role: UserRole | null;
  /** Fiche joueur liée (si compte joueur). */
  playerId: string | null;
  loading: boolean;
  isAdmin: boolean;
  isManager: boolean;
  isPerf: boolean;
  /** Peut noter/évaluer un candidat en tryout : admin/manager/coach/joueur/staff. */
  isEvaluator: boolean;
  isContent: boolean;
  /** Équipe design : peut traiter les demandes graphiques. */
  isDesign: boolean;
  /** true si le compte a un rôle exploitable (pas 'member' en attente). */
  isActive: boolean;
  signIn: (email: string, password: string) => Promise<{ error?: string }>;
  signUp: (email: string, password: string, displayName: string) => Promise<{ error?: string }>;
  signOut: () => Promise<void>;
  refresh: () => Promise<void>;
}

const Ctx = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  // Charge le profil. Robuste : maybeSingle (pas d'exception si 0 ligne) et,
  // en cas d'erreur réseau ponctuelle, on ne DÉGRADE pas un profil déjà chargé
  // (évite un faux "compte en attente" sur un simple hoquet).
  async function loadProfile(uid: string | undefined): Promise<void> {
    if (!uid) {
      setProfile(null);
      return;
    }
    const { data, error } = await supabase.from('profiles').select('*').eq('id', uid).maybeSingle();
    if (error) return; // garde l'état précédent
    setProfile(
      data
        ? { id: data.id, role: data.role as UserRole, displayName: data.display_name ?? undefined, playerId: data.player_id ?? undefined }
        : null,
    );
  }

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data }) => {
      setSession(data.session);
      await loadProfile(data.session?.user.id);
      setLoading(false);
    });
    // À chaque changement d'auth : on repasse en "loading" le temps de
    // (re)charger le profil, pour ne jamais afficher Pending avant de savoir.
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => {
      setSession(s);
      setLoading(true);
      loadProfile(s?.user.id).finally(() => setLoading(false));
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  const role = profile?.role ?? null;
  const value: AuthState = {
    session,
    profile,
    role,
    playerId: profile?.playerId ?? null,
    loading,
    isAdmin: role === 'admin',
    isManager: role === 'admin' || role === 'manager',
    isPerf: role === 'admin' || role === 'manager' || role === 'coach',
    isEvaluator: role === 'admin' || role === 'manager' || role === 'coach' || role === 'joueur' || role === 'staff',
    isContent: role === 'admin' || role === 'manager' || role === 'content',
    isDesign: role === 'admin' || role === 'manager' || role === 'content' || role === 'graphiste',
    isActive: !!role && role !== 'member',
    async signIn(email, password) {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      return error ? { error: error.message } : {};
    },
    async signUp(email, password, displayName) {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { display_name: displayName } },
      });
      return error ? { error: error.message } : {};
    },
    async signOut() {
      await supabase.auth.signOut();
    },
    async refresh() {
      await loadProfile(session?.user.id);
    },
  };

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAuth() {
  const v = useContext(Ctx);
  if (!v) throw new Error('useAuth doit être utilisé dans <AuthProvider>');
  return v;
}
