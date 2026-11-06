import { Link } from 'react-router-dom';
import { useDocTitle } from '@/hooks/useDocTitle';

export default function NotFound() {
  useDocTitle('404');

  return (
    <section className="mx-auto flex min-h-[60vh] max-w-7xl flex-col justify-center px-4 py-24 sm:px-6">
      <p className="hud-label mb-4 text-xs text-accent-2">[ ERROR ] &gt; signal perdu</p>
      <h1 className="hud-title text-6xl font-bold glow-text sm:text-8xl">404</h1>
      <p className="mt-6 max-w-md font-mono text-sm text-[color:var(--text-dim)]">
        &gt; Coordonnées hors secteur.
      </p>
      <Link
        to="/"
        className="mt-8 w-fit border border-line px-4 py-2 font-mono text-sm uppercase tracking-hud text-accent transition-colors hover:bg-accent hover:text-base-900"
      >
        [ ← retour base ]
      </Link>
    </section>
  );
}
