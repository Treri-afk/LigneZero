import type { ReactNode } from 'react';
import { useBrand } from '@/lib/useBrand';
import { NavLink } from 'react-router-dom';
import { navFor, SECTION_ORDER } from '@/lib/nav';
import { useAuth } from '@/auth/AuthProvider';
import { Button } from '@/components/ui';

/** Coquille du manager : sidebar (sections filtrées par rôle) + contenu. */
export function Layout({ children }: { children: ReactNode }) {
  const brand = useBrand();
  const { session, role, signOut } = useAuth();
  const items = navFor(role);

  return (
    <div className="relative z-10 flex min-h-screen">
      <aside className="sticky top-0 flex h-screen w-60 shrink-0 flex-col border-r border-line-strong bg-base-800">
        <div className="border-b border-line-strong px-5 py-4">
          <p className="font-display text-lg font-bold uppercase tracking-hud">{brand.name}</p>
          <p className="hud-label text-[10px]">Console de gestion</p>
        </div>

        <nav className="flex-1 overflow-y-auto py-2">
          {SECTION_ORDER.map((section) => {
            const secItems = items.filter((n) => n.section === section);
            if (secItems.length === 0) return null;
            return (
              <div key={section} className="mb-1">
                <p className="px-5 pb-1 pt-3 font-mono text-[9px] uppercase tracking-hud text-[color:var(--text-mute)]">
                  {section}
                </p>
                {secItems.map((n) => (
                  <NavLink
                    key={n.path}
                    to={n.path}
                    end={n.path === '/'}
                    className={({ isActive }) =>
                      `flex items-center gap-3 px-5 py-2 font-mono text-xs uppercase tracking-hud transition-colors ${
                        isActive
                          ? 'border-l-2 border-[color:var(--accent)] bg-base-700 text-[color:var(--text)]'
                          : 'border-l-2 border-transparent text-[color:var(--text-mute)] hover:text-[color:var(--text)]'
                      }`
                    }
                  >
                    <span className="w-8 text-[color:var(--text-mute)]">{n.code}</span>
                    {n.label}
                  </NavLink>
                ))}
              </div>
            );
          })}
        </nav>

        <div className="border-t border-line-strong px-5 py-3">
          <p className="truncate font-mono text-[11px] text-[color:var(--text-dim)]">{session?.user.email}</p>
          <p className="hud-label mb-2 text-[10px]">rôle · {role ?? '—'}</p>
          <Button variant="ghost" className="w-full" onClick={() => signOut()}>
            Déconnexion
          </Button>
        </div>
      </aside>

      <main className="flex-1 overflow-x-hidden px-8 py-8">{children}</main>
    </div>
  );
}
