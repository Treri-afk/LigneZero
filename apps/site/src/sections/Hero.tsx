import { BackgroundFX } from '@/components/animation/BackgroundFX';
import { FunnelStage } from '@/components/animation/FunnelStage';
import { GlitchText } from '@/components/animation/GlitchText';
import { TypeWriter } from '@/components/animation/TypeWriter';
import { KeycapButton } from '@/components/ui/KeycapButton';
import { MediaFrame } from '@/components/ui/MediaFrame';
import { Bracket } from '@/components/ui/Bracket';
import { Countdown } from '@/components/ui/Countdown';
import { usePointerParallax } from '@/hooks/usePointerParallax';
import { socials } from '@/data/socials';
import { useData } from '@/data/DataProvider';
import { getNextMatch } from '@/lib/format';


export function Hero() {
  const stage = usePointerParallax<HTMLDivElement>();
  const { matches, games, brand } = useData();
  const next = getNextMatch(matches);
  const nextTag = next ? games.find((g) => g.id === next.gameId)?.tag : undefined;

  return (
    <section ref={stage} className="relative min-h-[calc(100dvh-4rem)] overflow-hidden">
      <BackgroundFX />

      {/* mot fantôme géant en fond (contour seul = profondeur sans écraser) */}
      <div
        data-depth="4"
        aria-hidden
        className="pointer-events-none absolute -left-4 bottom-[12%] select-none font-display text-[26vw] font-bold uppercase leading-none tracking-tighter"
        style={{
          color: 'transparent',
          WebkitTextStroke: '1px var(--line-strong)',
          opacity: 0.6,
        }}
      >
        ZERO
      </div>

      {/* diagonale d'accent traversante */}
      <div
        data-depth="14"
        aria-hidden
        className="absolute left-0 top-1/3 h-px w-full origin-left rotate-[-4deg] bg-gradient-to-r from-transparent via-accent/50 to-transparent"
      />

      <FunnelStage className="relative mx-auto grid max-w-7xl grid-cols-1 gap-10 px-4 pt-16 sm:px-6 lg:grid-cols-12 lg:pt-24">
        {/* Colonne titre (gauche, large) — inclinée vers le centre */}
        <div data-tilt className="lg:col-span-7">
          <p className="hud-label mb-5 flex items-center gap-3 text-xs">
            <Bracket>STRUCTURE ESPORT</Bracket>
            <span className="h-px w-10 bg-accent" />
            <span className="text-[color:var(--text-mute)]">EST. 2026 · FR</span>
          </p>

          <h1 className="hud-title text-6xl font-bold leading-[0.92] sm:text-7xl xl:text-8xl">
            <GlitchText as="span" text={brand.name} className="block glow-text" />
            <span className="mt-2 block text-2xl font-medium text-[color:var(--text-dim)] sm:text-3xl">
              <TypeWriter text="> on ne suit pas le signal. on l'émet." />
            </span>
          </h1>

          <div className="mt-10 flex flex-wrap items-center gap-4">
            {/* Bouton « L'équipe » RETIRÉ : la page n'est plus accessible. */}
            <KeycapButton to="/tournoi" size="lg" sound>
              &gt; Tournoi
            </KeycapButton>
          </div>

          {/* Bloc de chiffres RETIRÉ : titres, matchs, winrate et joueurs
              étaient codés en dur et ne suivaient aucune donnée. */}

          {/* countdown prochain match */}
          {next && (
            <div className="mt-8 inline-flex flex-wrap items-center gap-5 border-2 border-line-strong bg-base-800/60 px-5 py-3">
              <span className="hud-label text-[10px]">
                <Bracket>NEXT</Bracket> {nextTag} · vs {next.opponent.name}
              </span>
              <Countdown target={next.dateISO} />
            </div>
          )}
        </div>

        {/* Colonne VISUEL (droite) : maillot/joueur dominant + télémétrie superposée */}
        <div data-tilt className="relative lg:col-span-5">
          {/* visuel principal — dépose l'asset dans public/img/ (jersey, portrait, key art) */}
          <MediaFrame
            ratio="4/5"
            treatment="duotone"
            label="ROSTER // 01"
            corner="UNIT"
            className="mx-auto w-full max-w-sm lg:ml-auto lg:max-w-none"
            // src="/img/hero-jersey.png"  ← décommente quand l'asset est prêt
          />

          {/* Carte NEXT MATCH RETIRÉE : son contenu était codé en dur
              (adversaire, « VALORANT », horaire) et ne suivait aucune donnée. */}

          {/* badge rouge plein qui dépasse du cadre */}
          <div
            className="absolute -right-2 top-10 hidden -rotate-90 bg-accent px-3 py-1 font-mono text-[10px] font-bold uppercase tracking-hud text-[color:var(--paper)] shadow-ink-sm sm:block"
          >
            SIGNAL ON
          </div>
        </div>
      </FunnelStage>

      {/* social rail (gauche, vertical) */}
      <div className="absolute bottom-28 left-6 hidden flex-col items-center gap-4 xl:flex">
        <span className="h-12 w-px bg-line-strong" />
        {socials.slice(0, 4).map((s) => (
          <a
            key={s.id}
            href={s.url}
            target="_blank"
            rel="noopener noreferrer"
            className="font-mono text-[10px] uppercase tracking-hud text-[color:var(--text-dim)] [writing-mode:vertical-rl] transition-colors hover:text-accent"
          >
            {s.label}
          </a>
        ))}
      </div>

      {/* Bandeau défilant RETIRÉ : ses messages étaient figés dans le code. */}

      {/* indice de scroll */}
      <div className="absolute bottom-16 left-1/2 hidden -translate-x-1/2 flex-col items-center gap-1 md:flex">
        <span className="font-mono text-[9px] uppercase tracking-hud text-[color:var(--text-mute)]">scroll</span>
        {/* Pointait vers /equipe, page désormais inaccessible : l'indice de
            scroll descend simplement vers la suite de la page. */}
        <a href="#hub" aria-label="Descendre" className="text-accent">
          ▼
        </a>
      </div>
    </section>
  );
}
