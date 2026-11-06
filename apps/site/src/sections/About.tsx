import { Link } from 'react-router-dom';
import { Bracket } from '@/components/ui/Bracket';
import { HudFrame } from '@/components/ui/HudFrame';
import { KeycapButton } from '@/components/ui/KeycapButton';
import { useData } from '@/data/DataProvider';

/**
 * Présentation de la structure — remplace l'ancienne grille de navigation et
 * le bloc "rejoins la commu".
 *
 * Les chiffres et le palmarès viennent de la BASE (jeu + effectif), pas de
 * constantes : ils suivent ce qui est saisi côté gestion. Seul le texte
 * éditorial est en dur ici — c'est le seul endroit à éditer pour le changer.
 */

/** Les trois axes de la structure. Édite ces textes pour changer le discours. */
const PILIERS = [
  {
    code: '01',
    titre: 'Compétition',
    texte:
      "Un effectif resserré sur The Finals, entraîné pour les circuits officiels. Pas de section vitrine : on inscrit ce qu'on peut tenir.",
  },
  {
    code: '02',
    titre: 'Organisation',
    texte:
      "Nos propres tournois, de la phase de groupes à la grande finale. Un format clair, des brackets publics, des résultats à jour.",
  },
  {
    code: '03',
    titre: 'Formation',
    texte:
      "Des tryouts ouverts et un suivi réel : objectifs, revue vidéo, retours individuels. On fait progresser avant de recruter.",
  },
];

export function About() {
  const { games, players, brand } = useData();
  // Jeu principal = celui qui porte l'effectif, pas `games[0]` : l'ordre des
  // jeux n'est pas garanti et un second jeu existe en base.
  const game =
    games.find((g) => players.some((p) => p.gameId === g.id)) ?? games[0];
  // Une stat sans valeur saisie afficherait un grand vide : on les écarte.
  const stats = (game?.stats ?? []).filter((s) => s.value?.trim()).slice(0, 4);

  return (
    <section className="mx-auto max-w-7xl px-4 py-24 sm:px-6">
      <p className="hud-label mb-8 flex items-center gap-3 text-xs">
        <Bracket>LA STRUCTURE</Bracket>
        <span className="h-px flex-1 bg-line-strong" />
        <span className="text-[color:var(--text-mute)]">EST. 2026 · FR</span>
      </p>

      {/* Manifeste + chiffres */}
      <div className="grid grid-cols-1 gap-10 lg:grid-cols-[1.4fr_1fr]">
        <div>
          <h2 className="hud-title text-3xl font-bold leading-[1.05] sm:text-5xl">
            {brand.tagline || 'Une structure esport française, concentrée sur The Finals.'}
          </h2>
          <div className="mt-6 space-y-4 font-mono text-sm leading-relaxed text-[color:var(--text-dim)]">
            <p>
              &gt; {brand.name} réunit {players.length} {players.length > 1 ? 'joueurs' : 'joueur'} autour d'un
              seul jeu, {game?.name ?? 'The Finals'}. Un roster court, un staff qui suit, et des
              objectifs mesurés plutôt qu'affichés.
            </p>
            <p>
              &gt; À côté de la compétition, nous organisons nos propres tournois ouverts : brackets
              publics, résultats en direct, et une porte d'entrée pour les équipes qui veulent se
              confronter sérieusement.
            </p>
          </div>

          <div className="mt-8 flex flex-wrap gap-4">
            {/* Bouton « L'effectif » RETIRÉ : la page n'est plus accessible. */}
            <KeycapButton to="/tournoi" size="lg" sound>
              Nos tournois
            </KeycapButton>
          </div>
        </div>

        {/* Chiffres clés du jeu — alimentés par la base */}
        {stats.length > 0 && (
          <HudFrame label={game?.tag ?? 'DATA'} corner="BILAN" className="cut-panel">
            <dl className="grid grid-cols-2 gap-px bg-line-strong">
              {stats.map((s) => (
                <div key={s.label} className="bg-base-900 p-5">
                  <dd className="font-display text-4xl font-bold leading-none text-accent">{s.value}</dd>
                  <dt className="mt-2 font-mono text-[10px] uppercase leading-tight tracking-hud text-[color:var(--text-mute)]">
                    {s.label}
                  </dt>
                </div>
              ))}
            </dl>
          </HudFrame>
        )}
      </div>

      {/* Palmarès */}
      {game?.palmares?.length ? (
        <div className="mt-14">
          <p className="hud-label mb-4 text-[11px]">
            <Bracket tone="dim">PALMARÈS</Bracket>
          </p>
          <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {game.palmares.map((p) => (
              <li
                key={p}
                className="flex gap-3 border-2 border-line-strong bg-base-900/55 px-4 py-3 font-mono text-xs leading-snug text-[color:var(--text-dim)]"
              >
                <span className="text-accent">▸</span>
                <span>{p}</span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {/* Les trois axes */}
      <div className="mt-14 grid grid-cols-1 gap-5 md:grid-cols-3">
        {PILIERS.map((p) => (
          <article key={p.code} className="border-2 border-line-strong bg-base-900/55 p-6">
            <span className="font-mono text-[10px] text-accent">{p.code}</span>
            <h3 className="hud-title mt-4 text-xl font-bold">{p.titre}</h3>
            <p className="mt-3 font-mono text-xs leading-relaxed text-[color:var(--text-dim)]">{p.texte}</p>
          </article>
        ))}
      </div>

      {/* Renvoi tournois */}
      <div className="mt-14">
        <Link
          to="/tournoi"
          className="group flex flex-col items-start justify-between gap-5 border-2 border-line-strong bg-base-900/55 p-6 transition-all duration-ui hover:-translate-x-0.5 hover:-translate-y-0.5 hover:border-accent hover:shadow-ink sm:flex-row sm:items-center"
        >
          <div>
            <p className="hud-label mb-2 text-[10px]">
              <Bracket>OPEN</Bracket>
            </p>
            <h3 className="hud-title text-2xl font-bold leading-none">Inscrivez votre équipe</h3>
            <p className="mt-2 font-mono text-xs text-[color:var(--text-dim)]">
              &gt; nos tournois sont ouverts — brackets et résultats publics.
            </p>
          </div>
          <span className="shrink-0 font-mono text-xs uppercase tracking-hud text-accent">voir les tournois ↗</span>
        </Link>
      </div>
    </section>
  );
}
