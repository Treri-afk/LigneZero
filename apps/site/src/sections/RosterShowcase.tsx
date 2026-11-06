import { useEffect, useRef, useState } from 'react';
import type { Player } from '@/types';
import { useData } from '@/data/DataProvider';
import { useReducedMotion } from '@/hooks/useReducedMotion';

/* Géométrie de l'éventail (px).
   RÈGLE : les cartes ne CHANGENT JAMAIS de place. Chaque joueur a une fente
   fixe ; survoler ne fait que redresser/avancer la carte sur place. Si la
   carte active se recentrait, elle glisserait sous le curseur et déclencherait
   le survol de la voisine → on sautait plusieurs cartes d'un coup.
   Corollaire : SLOT_STEP >= SLOT_W, donc les zones de survol ne se
   chevauchent pas non plus (aucune ambiguïté de cible). */
const CARD_RATIO = 0.71; // proportions d'une vraie carte à collectionner (63×88 mm)
const SLOT_W = 320;
const SLOT_STEP = 336; // léger jeu entre fentes, sans jamais se chevaucher
const CARD_H = Math.round(SLOT_W / CARD_RATIO);
const STAGE_H = CARD_H + 150; // marge pour le relief et les données débordantes

/* Délai avant que la fiche ne se déploie : le temps que la fente finisse de se
   redresser. Sans ça le contenu apparaît PENDANT que la carte grandit encore,
   donc il grandit avec elle → impression de secousse. */
const STAGGER_BASE = 150;

/** Silhouette de secours quand aucun PNG joueur n'est fourni. */
function Silhouette() {
  return (
    <svg viewBox="0 0 100 130" className="h-full w-full" aria-hidden>
      <circle cx="50" cy="34" r="19" fill="currentColor" opacity="0.32" />
      <path d="M14 130 Q16 78 50 76 Q84 78 86 130 Z" fill="currentColor" opacity="0.32" />
    </svg>
  );
}

/* ── Carte FULL-ART (façon alt-art) : le joueur remplit la carte ──
   `active` = carte au premier plan : les données 3D DÉBORDENT du cadre
   (rareté, set, stats, pseudo en point de fuite). Sur une carte inactive
   ces blocs sont masqués — sinon ils se chevaucheraient d'une carte à
   l'autre dans l'éventail — et un bandeau compact prend le relais dedans. */
function PlayerDetail({
  p,
  active = true,
  flip = false,
  w = SLOT_W,
}: {
  p: Player;
  active?: boolean;
  /** Renvoie les blocs débordants de l'autre côté (cartes à droite du centre). */
  flip?: boolean;
  /** Largeur de la carte — sert à dimensionner la typo à l'échelle de la carte. */
  w?: number;
}) {
  const { players: allPlayers } = useData();
  const TOTAL = String(allPlayers.length).padStart(2, '0');
  const fullName = [p.firstName, p.lastName].filter(Boolean).join(' ');
  const num = String(allPlayers.indexOf(p) + 1).padStart(2, '0');
  const c = p.color ?? '#f23127';
  const cardRef = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();
  // Une photo renseignée mais introuvable (404) affichait l'icône "image cassée".
  const [photoOk, setPhotoOk] = useState(true);
  useEffect(() => setPhotoOk(true), [p.photo]);
  const showPhoto = Boolean(p.photo) && photoOk;

  const onMove = (e: React.PointerEvent) => {
    if (reduced || !active || !cardRef.current) return;
    const r = cardRef.current.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width - 0.5;
    const y = (e.clientY - r.top) / r.height - 0.5;
    const s = cardRef.current.style;
    s.setProperty('--ry', `${(x * 12).toFixed(2)}deg`);
    s.setProperty('--rx', `${(-y * 9).toFixed(2)}deg`);
    s.setProperty('--mx', `${((x + 0.5) * 100).toFixed(1)}%`);
    s.setProperty('--my', `${((y + 0.5) * 100).toFixed(1)}%`);
  };
  const onLeave = () => {
    const s = cardRef.current?.style;
    if (!s) return;
    s.setProperty('--rx', '0deg');
    s.setProperty('--ry', '0deg');
    s.setProperty('--mx', '50%');
    s.setProperty('--my', '50%');
  };

  return (
    <div className="flex h-full w-full items-center justify-center" style={{ perspective: '1100px' }} onPointerMove={onMove} onPointerLeave={onLeave}>
      <div
        key={p.id}
        ref={cardRef}
        className="tcg-in relative h-full w-full"
        style={{
          // Pas de "pop" en translateZ ici : il s'appliquait INSTANTANÉMENT au
          // montage pendant que la fente, elle, grandissait en 450 ms → deux
          // changements de taille désynchronisés, d'où la secousse. La mise en
          // avant est désormais gérée par la fente seule, en une seule transition.
          transform: 'rotateX(var(--rx,0deg)) rotateY(var(--ry,0deg))',
          transformStyle: 'preserve-3d',
          transition: 'transform 0.2s ease-out',
        }}
      >
        {/* ── CARTE clippée (art) ── */}
        <div
          className="absolute inset-0 overflow-hidden rounded-[22px] border-2 border-white/40"
          style={{
            background: `radial-gradient(120% 80% at 50% 12%, color-mix(in srgb, ${c} 72%, #ffffff) 0%, ${c} 42%, color-mix(in srgb, ${c} 52%, #0a0a0c) 100%)`,
            boxShadow: `0 28px 55px -18px ${c}, inset 0 0 0 2px rgba(255,255,255,0.3)`,
          }}
        >
          {/* nom géant fantôme — dimensionné À L'ÉCHELLE de la carte (sinon une
             taille fixe déborde et se coupe n'importe comment sur carte étroite) */}
          <span
            aria-hidden
            className="pointer-events-none absolute left-1/2 top-[24%] -translate-x-1/2 select-none whitespace-nowrap font-display font-bold uppercase leading-none text-white/[0.13]"
            style={{ fontSize: w * 0.32 }}
          >
            {p.pseudo}
          </span>
          {/* joueur (full art) */}
          <div className="absolute inset-0 flex items-end justify-center text-white">
            <div className="h-[95%] w-[92%]">
              {showPhoto ? (
                <img
                  src={p.photo}
                  alt={p.pseudo}
                  onError={() => setPhotoOk(false)}
                  className="h-full w-full object-contain object-bottom drop-shadow-[0_16px_28px_rgba(0,0,0,0.6)]"
                />
              ) : (
                <Silhouette />
              )}
            </div>
          </div>
          {/* scrim bas */}
          <div aria-hidden className="absolute inset-x-0 bottom-0 h-[55%]" style={{ background: `linear-gradient(to top, color-mix(in srgb, ${c} 60%, #0a0a0c) 4%, transparent)` }} />
          {/* foil + brillance */}
          <div className="tcg-foil pointer-events-none absolute inset-0" aria-hidden />
          <div className="tcg-glare pointer-events-none absolute inset-0" aria-hidden />

          {/* identité COMPACTE — seulement quand les blocs débordants sont masqués */}
          {!active && (
            <div className="absolute inset-x-0 bottom-8 px-4">
              <span className="inline-block bg-base-900 px-2 py-0.5 font-mono text-[8px] font-bold uppercase tracking-hud shadow-ink-sm" style={{ color: c }}>
                {p.role}
              </span>
              <p className="mt-1 font-display text-3xl font-bold uppercase leading-none text-white" style={{ textShadow: `0 2px 0 ${c}` }}>
                {p.pseudo}
              </p>
            </div>
          )}

          {/* pied minimal (dans la carte) */}
          <div className="absolute inset-x-0 bottom-0 flex items-center justify-between px-4 py-2 text-white/75">
            <span className="font-mono text-[8px] uppercase tracking-hud">LIGNE ZERO · {num}/{TOTAL}</span>
            <span className="ticket-barcode h-3.5 w-12 text-white" />
          </div>
        </div>

        {/* ── DONNÉES qui DÉBORDENT, inclinées en point de fuite ──
           Rendues seulement sur la carte active. `flip` renvoie tout de l'autre
           côté pour les cartes situées à droite du centre : sans ça, le pseudo
           et les stats des cartes de bord sortaient du cadre de la page. */}
        {active && (
          <>
            {/* (les pastilles rareté + SET ont été retirées : purement décoratives,
               elles n'apportaient aucune information sur le joueur) */}

            {/* stats (débordent vers l'intérieur de la scène) */}
            {p.stats.length > 0 && (
              <div className={`absolute top-[28%] ${flip ? '-left-10' : '-right-10'}`} style={{ transform: 'translateZ(100px)', perspective: '330px' }}>
                <div
                  className="flex flex-col gap-2"
                  style={{ transformOrigin: flip ? 'left center' : 'right center', transform: `rotateY(${flip ? 34 : -34}deg)` }}
                >
                  {p.stats.map((s, i) => (
                    // wrapper = animation d'entrée (décalée) · enfant = rotation d'origine
                    <div
                      key={s.label}
                      className={flip ? 'fiche-stat-in-flip' : 'fiche-stat-in'}
                      style={{ animationDelay: `${STAGGER_BASE + 80 + i * 60}ms` }}
                    >
                      <div className="flex items-center gap-2 border-2 border-white/70 bg-paper px-2.5 py-1 shadow-ink" style={{ transform: `rotate(${(i - 1) * 2}deg)` }}>
                        <span className="font-display text-lg font-bold leading-none" style={{ color: `color-mix(in srgb, ${c} 60%, #0a0a0c)` }}>{s.value}</span>
                        <span className="font-mono text-[7px] uppercase leading-tight tracking-hud" style={{ color: 'color-mix(in srgb, var(--ink) 72%, transparent)' }}>{s.label}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* nom + rôle (débordent en bas, côté extérieur) */}
            {/* bottom-14 (et non bottom-6) : plus bas, la ligne méta passait
               par-dessus le pied imprimé dans la carte (LIGNE ZERO · 02/04). */}
            <div
              className={`absolute bottom-14 ${flip ? '-right-6 text-right' : '-left-6'}`}
              style={{ transform: `translateZ(95px) rotateX(-6deg) rotateY(${flip ? -6 : 6}deg)`, transformStyle: 'preserve-3d' }}
            >
              <div>
                <span
                  className="fiche-meta-in inline-block bg-base-900 px-2 py-0.5 font-display text-xs font-bold uppercase tracking-wide2 shadow-ink-sm"
                  style={{ color: c, animationDelay: `${STAGGER_BASE + 40}ms` }}
                >
                  {p.role}
                </span>
                {/* wrapper = grossissement à l'apparition · h2 = point de fuite */}
                <div
                  className="fiche-name-in mt-1"
                  style={{ perspective: '230px', transformOrigin: flip ? 'right bottom' : 'left bottom', animationDelay: `${STAGGER_BASE}ms` }}
                >
                  <h2
                    className="whitespace-nowrap font-display font-bold uppercase leading-[0.78] text-white"
                    style={{
                      fontSize: w * 0.2,
                      transformOrigin: flip ? 'right center' : 'left center',
                      transform: `rotateY(${flip ? -46 : 46}deg)`,
                      textShadow: `0 3px 0 ${c}, 0 10px 26px rgba(0,0,0,0.7)`,
                    }}
                  >
                    {p.pseudo}
                  </h2>
                </div>
                <p
                  className="fiche-meta-in mt-2 font-mono text-[9px] uppercase tracking-hud text-white/80"
                  style={{ animationDelay: `${STAGGER_BASE + 380}ms` }}
                >
                  {[fullName, p.country, p.joinedYear && `EST ${p.joinedYear}`].filter(Boolean).join(' · ')}
                </p>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

/* ── Bandeau data du jeu ──────────────────────────────────────────────
   Il n'y a plus qu'un jeu (The Finals) → plus de sélecteur. Ses données
   restent affichées, mais dans le langage du reste du site : hazard +
   labels mono + chiffres display, pas de pilier foil. */
function GameReadout() {
  const { games } = useData();
  const g = games[0];
  if (!g) return null;
  const c = g.color ?? 'var(--accent)';

  return (
    <div className="mt-8 border-2 border-line-strong bg-base-900/50">
      <div className="hazard h-2 w-full opacity-60" aria-hidden />
      <div className="flex flex-col gap-5 p-4 lg:flex-row lg:items-center lg:justify-between">
        {/* identité du jeu */}
        <div className="flex items-center gap-3">
          <span className="px-2 py-1 font-mono text-[10px] font-bold uppercase tracking-hud text-white" style={{ background: c }}>
            {g.tag}
          </span>
          <div>
            <p className="hud-label text-[9px]">[ Jeu ]</p>
            <p className="hud-title text-xl font-bold leading-none">{g.name}</p>
          </div>
        </div>

        {/* chiffres-clés */}
        {(g.stats ?? []).length > 0 && (
          <div className="flex flex-wrap gap-x-6 gap-y-3">
            {(g.stats ?? []).map((s) => (
              <div key={s.label} className="border-l-2 pl-3" style={{ borderColor: c }}>
                <p className="font-display text-2xl font-bold leading-none">{s.value}</p>
                <p className="font-mono text-[8px] uppercase leading-tight tracking-hud text-[color:var(--text-mute)]">{s.label}</p>
              </div>
            ))}
          </div>
        )}

        {/* palmarès */}
        {g.palmares.length > 0 && (
          <ul className="space-y-1 lg:max-w-xs">
            {g.palmares.map((pl) => (
              <li key={pl} className="flex gap-2 font-mono text-[10px] leading-snug text-[color:var(--text-dim)]">
                <span style={{ color: c }}>▸</span>
                <span>{pl}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

/* ── Éventail : les 3 cartes en permanence ───────────────────────────
   Plus de sélecteur de jeu, plus de pilier. Les cartes sont toutes
   affichées, inclinées vers le centre ; celle survolée se redresse,
   passe devant et déploie ses données débordantes. */
export function RosterShowcase() {
  const { players } = useData();
  const [activeId, setActiveId] = useState<string | null>(players[0]?.id ?? null);
  const [flashKey, setFlashKey] = useState(0);
  const reduced = useReducedMotion();

  /* Le flash plein écran est réservé à une sélection DÉLIBÉRÉE (clic / mobile) :
     au survol il se déclencherait à chaque passage de souris sur l'éventail. */
  const activate = (id: string, flash = false) => {
    if (id === activeId) return;
    setActiveId(id);
    if (flash) setFlashKey((k) => k + 1);
  };

  const active = players.find((p) => p.id === activeId) ?? null;

  /* La scène fait n × fente ; on la réduit si le conteneur est plus étroit
     (écran moyen ou roster nombreux) plutôt que de resserrer les fentes —
     ça garde des zones de survol régulières. */
  const stageW = Math.max(SLOT_W, players.length * SLOT_STEP);
  const wrapRef = useRef<HTMLDivElement>(null);
  const [wrapW, setWrapW] = useState(0);
  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => setWrapW(e.contentRect.width));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  const scale = wrapW > 0 ? Math.min(1, wrapW / stageW) : 1;

  return (
    <>
      <GameReadout />

      {/* flash plein écran au changement de joueur */}
      {flashKey > 0 && (
        <span
          key={flashKey}
          aria-hidden
          className="card-flash pointer-events-none fixed inset-0 z-[95]"
          style={{ background: 'radial-gradient(circle at 50% 45%, #fff 0%, rgba(255,255,255,0.6) 35%, transparent 72%)' }}
        />
      )}

      {/* DESKTOP · éventail à fentes fixes */}
      <div ref={wrapRef} className="relative mt-14 hidden md:block">
        {/* socle : dot-grid + ligne d'horizon (langage béton du reste du site) */}
        <div aria-hidden className="dot-grid pointer-events-none absolute inset-x-0 bottom-8 top-16 opacity-40" />
        <div aria-hidden className="pointer-events-none absolute inset-x-0 bottom-8 h-px bg-line-strong" />

        {/* La scène a une largeur PROPRE (n × fente) puis on la met à l'échelle
           pour rentrer dans le conteneur → géométrie stable quel que soit le
           nombre de joueurs ou la largeur d'écran. */}
        <div className="relative" style={{ height: STAGE_H * scale }}>
          <div
            className="absolute left-1/2 top-1/2"
            style={{
              width: stageW,
              height: STAGE_H,
              marginLeft: -stageW / 2,
              marginTop: -STAGE_H / 2,
              transform: `scale(${scale})`,
              perspective: '1600px',
            }}
          >
            {players.map((p, i) => {
              const isActive = p.id === activeId;
              // fente FIXE : ne dépend que de l'index, jamais de la sélection
              const x = (i - (players.length - 1) / 2) * SLOT_STEP;
              // les cartes non actives s'inclinent vers le centre (effet éventail)
              const dir = Math.sign(x) || 1;
              return (
                <button
                  key={p.id}
                  type="button"
                  aria-pressed={isActive}
                  aria-label={`Afficher ${p.pseudo}`}
                  onPointerEnter={() => activate(p.id)}
                  onFocus={() => activate(p.id)}
                  onClick={() => activate(p.id, true)}
                  className="absolute left-1/2 top-1/2 block cursor-pointer text-left"
                  style={{
                    width: SLOT_W,
                    height: CARD_H,
                    marginLeft: -SLOT_W / 2,
                    marginTop: -CARD_H / 2,
                    // l'active passe devant ; les autres gardent un ordre stable
                    zIndex: isActive ? 40 : 10 + i,
                    transformStyle: 'preserve-3d',
                    // translateX(x) est le MÊME dans les deux états → la carte
                    // ne se déplace pas quand on la survole
                    transform: isActive
                      ? `translateX(${x}px) translateY(-14px)`
                      : `translateX(${x}px) translateZ(-45px) rotateY(${-dir * 18}deg) scale(0.97)`,
                    // assombrir à outrance rendait les cartes ternes/olive :
                    // on recule surtout par la profondeur et la désaturation
                    filter: isActive ? 'none' : 'saturate(0.65) brightness(0.8)',
                    transition: reduced ? 'none' : 'transform 0.45s cubic-bezier(0.16,1,0.3,1), filter 0.35s',
                  }}
                >
                  <div key={isActive ? `${p.id}-${flashKey}` : p.id} className={isActive ? 'card-assemble h-full w-full' : 'h-full w-full'}>
                    <PlayerDetail p={p} active={isActive} flip={x > 0} w={SLOT_W} />
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* rappel d'interaction, ton HUD */}
        <p className="mt-2 text-center font-mono text-[10px] uppercase tracking-hud text-[color:var(--text-mute)]">
          &gt; survole une carte pour la déployer
        </p>
      </div>

      {/* MOBILE : sélecteur compact + carte active */}
      <div className="mt-10 md:hidden">
        <div className="mb-5 flex gap-2">
          {players.map((p, i) => {
            const isActive = p.id === activeId;
            const c = p.color ?? 'var(--accent)';
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => activate(p.id, true)}
                style={isActive ? { borderColor: c, background: c } : undefined}
                className={[
                  'flex-1 border-2 px-2 py-2 font-mono text-[11px] font-bold uppercase tracking-hud transition-all duration-snap',
                  isActive ? 'text-[color:var(--paper)] shadow-ink-sm' : 'border-line-strong text-[color:var(--text-dim)]',
                ].join(' ')}
              >
                <span className="block text-[9px] opacity-70">{String(i + 1).padStart(2, '0')}</span>
                {p.pseudo}
              </button>
            );
          })}
        </div>
        {active && (
          <div key={`m-${active.id}-${flashKey}`} className="card-assemble relative z-[90] mx-auto w-[280px]" style={{ height: 280 / CARD_RATIO }}>
            <PlayerDetail p={active} w={280} />
          </div>
        )}
      </div>
    </>
  );
}
