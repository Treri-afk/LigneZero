import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useDocTitle } from '@/hooks/useDocTitle';
import { AdminGuard } from './AdminGuard';
import { db } from '@/lib/supabase';
import type { Tournament, TournamentFormat } from '@/types';
import { DEFAULT_POINT_RULES, TOURNAMENT_FORMATS } from '@/types';

/** Slug URL depuis un nom libre (accents retirés, espaces → tirets). */
export function slugify(s: string): string {
  return s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60);
}

export default function AdminTournamentsPage() {
  useDocTitle('Admin · Tournois');
  return (
    <AdminGuard>
      <Inner />
    </AdminGuard>
  );
}

function Inner() {
  const [list, setList] = useState<Tournament[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [name, setName] = useState('');
  const [format, setFormat] = useState<TournamentFormat>('single_elim');
  const [teamSize, setTeamSize] = useState(3);

  const load = () =>
    db.listTournaments().then(setList).catch((e) => setError(e instanceof Error ? e.message : 'Erreur'));

  useEffect(() => {
    load();
  }, []);

  async function create() {
    const n = name.trim();
    if (!n) return;
    setBusy(true);
    setError(null);
    try {
      // Statut 'draft' : invisible du public tant que ce n'est pas publié (RLS).
      await db.upsertTournament({
        id: '',
        slug: slugify(n),
        name: n,
        format,
        status: 'draft',
        teamSize,
        groupCount: 4,
        qualifiersPerGroup: 2,
        playoffFormat: 'single_elim',
        groupRounds: 4,
        teamsPerLobby: 4,
        pointRules: DEFAULT_POINT_RULES,
        reseedMode: 'by_rank',
      });
      setName('');
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-16 sm:px-6">
      <p className="hud-label mb-2 text-[11px] text-accent">[ ADMIN ]</p>
      <h1 className="hud-title text-4xl font-bold leading-none">Tournois</h1>
      <p className="mt-3 font-mono text-xs text-[color:var(--text-mute)]">
        &gt; création, équipes, génération d'arbre et saisie des scores.
      </p>

      {/* Création */}
      <section className="mt-10 border-2 border-line-strong bg-base-900/55 p-5">
        <p className="hud-label mb-4 text-[10px]">[ Nouveau tournoi ]</p>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-[2fr_1.4fr_auto_auto]">
          <label className="block">
            <span className="mb-1 block font-mono text-[10px] uppercase tracking-hud text-[color:var(--text-mute)]">Nom</span>
            <input
              className="w-full border-2 border-line-strong bg-base-900 px-3 py-2 font-mono text-sm outline-none focus:border-accent"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="LIGNE ZERO OPEN #2"
            />
          </label>
          <label className="block">
            <span className="mb-1 block font-mono text-[10px] uppercase tracking-hud text-[color:var(--text-mute)]">Format</span>
            <select
              className="w-full border-2 border-line-strong bg-base-900 px-3 py-2 font-mono text-sm outline-none focus:border-accent"
              value={format}
              onChange={(e) => setFormat(e.target.value as TournamentFormat)}
            >
              {TOURNAMENT_FORMATS.map((f) => (
                <option key={f.id} value={f.id}>{f.label}</option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="mb-1 block font-mono text-[10px] uppercase tracking-hud text-[color:var(--text-mute)]">Joueurs</span>
            <input
              type="number"
              min={1}
              max={10}
              className="w-20 border-2 border-line-strong bg-base-900 px-3 py-2 font-mono text-sm outline-none focus:border-accent"
              value={teamSize}
              onChange={(e) => setTeamSize(Number(e.target.value) || 1)}
            />
          </label>
          <button
            type="button"
            onClick={create}
            disabled={busy || !name.trim()}
            className="self-end border-2 border-accent bg-accent px-5 py-2 font-mono text-xs font-bold uppercase tracking-hud text-[color:var(--ink)] transition-opacity disabled:opacity-40"
          >
            {busy ? '…' : 'Créer'}
          </button>
        </div>
        {name.trim() && (
          <p className="mt-2 font-mono text-[10px] text-[color:var(--text-mute)]">url : /tournoi/{slugify(name)}</p>
        )}
      </section>

      {error && <p className="mt-4 border-2 border-accent px-3 py-2 font-mono text-xs text-accent">{error}</p>}

      {/* Liste */}
      <div className="mt-8 space-y-2">
        {list?.map((t) => (
          <Link
            key={t.id}
            to={`/admin/tournois/${t.slug}`}
            className="flex items-center gap-4 border-2 border-line-strong bg-base-900/55 px-4 py-3 transition-colors hover:border-accent"
          >
            <span
              className="shrink-0 border px-2 py-0.5 font-mono text-[10px] uppercase tracking-hud"
              style={{ color: t.status === 'draft' ? 'var(--text-mute)' : 'var(--signal-ok)' }}
            >
              {t.status}
            </span>
            <span className="min-w-0 flex-1">
              <span className="hud-title block truncate text-lg font-bold leading-none">{t.name}</span>
              <span className="mt-1 block font-mono text-[10px] text-[color:var(--text-mute)]">
                {TOURNAMENT_FORMATS.find((f) => f.id === t.format)?.label} · {t.teamSize}v{t.teamSize}
              </span>
            </span>
            <span className="shrink-0 font-mono text-[10px] uppercase tracking-hud text-accent">éditer ↗</span>
          </Link>
        ))}
        {list?.length === 0 && (
          <p className="border-2 border-dashed border-line-strong px-4 py-10 text-center font-mono text-xs text-[color:var(--text-mute)]">
            &gt; aucun tournoi
          </p>
        )}
      </div>
    </div>
  );
}
