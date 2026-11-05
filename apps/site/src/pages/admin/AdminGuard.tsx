import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/auth/AuthProvider';

/**
 * Garde d'accès de la zone d'administration.
 *
 * Ce n'est qu'un filtre d'INTERFACE : la vraie protection est en base (RLS
 * `is_admin()` sur toutes les tables de tournoi). Même en forçant la route,
 * une écriture sans le rôle admin est rejetée par Postgres.
 */
export function AdminGuard({ children }: { children: ReactNode }) {
  const { session, profile, loading } = useAuth();

  if (loading) {
    return <Shell><p className="font-mono text-sm text-[color:var(--text-mute)]">&gt; vérification…</p></Shell>;
  }
  if (!session) {
    return (
      <Shell>
        <p className="font-mono text-sm text-[color:var(--text-dim)]">&gt; connexion requise</p>
        <Link to="/compte" className="mt-4 inline-block font-mono text-xs uppercase tracking-hud text-accent hover:underline">
          → se connecter
        </Link>
      </Shell>
    );
  }
  if (profile?.role !== 'admin') {
    return (
      <Shell>
        <p className="font-mono text-sm text-accent">&gt; accès refusé — rôle admin requis</p>
        <p className="mt-2 font-mono text-xs text-[color:var(--text-mute)]">
          rôle actuel : {profile?.role ?? 'inconnu'}
        </p>
      </Shell>
    );
  }
  return <>{children}</>;
}

function Shell({ children }: { children: ReactNode }) {
  return <div className="mx-auto max-w-5xl px-4 py-24 sm:px-6">{children}</div>;
}
