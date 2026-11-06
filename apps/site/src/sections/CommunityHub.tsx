import {  } from '@/data/community';
import { socials, DISCORD_URL } from '@/data/socials';
import { useData } from '@/data/DataProvider';
import { KeycapCard } from '@/components/ui/KeycapCard';
import { KeycapButton } from '@/components/ui/KeycapButton';
import { MediaFrame } from '@/components/ui/MediaFrame';
import { Bracket } from '@/components/ui/Bracket';

const nf = new Intl.NumberFormat('fr-FR');

/** En-tête de bloc réutilisable (label HUD + trait). */
function BlockTitle({ code, children }: { code: string; children: React.ReactNode }) {
  return (
    <div className="mb-5 mt-14 flex items-center gap-3 first:mt-0">
      <p className="hud-label text-xs">
        <Bracket>{code}</Bracket> {children}
      </p>
      <span className="h-px flex-1 bg-line-strong" />
    </div>
  );
}

/**
 * Hub communauté data-driven : lives en cours, créateurs, clips, réseaux,
 * bannière Discord. Contenu dans data/community.ts + data/socials.ts —
 * ajouter une entrée suffit, l'UI suit. Registre visuel = béton/HUD.
 */
export function CommunityHub() {
  const { creators, clips } = useData();
  const live = creators.filter((c) => c.live);

  return (
    <div className="mt-10">
      {/* ── EN DIRECT ─────────────────────────────────────────── */}
      {live.length > 0 && (
        <>
          <BlockTitle code="LIVE">
            En direct <span className="text-[color:var(--text-mute)]">· {String(live.length).padStart(2, '0')}</span>
          </BlockTitle>
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            {live.map((c) => (
              <KeycapCard key={c.id} className="p-0">
                <div className="relative">
                  <MediaFrame src={c.avatar} alt={c.name} ratio="16/9" label={c.platform} className="!border-0 !shadow-none" />
                  {/* badge LIVE pulsant */}
                  <span className="absolute left-2 top-2 z-20 flex items-center gap-1.5 bg-accent px-2 py-0.5 font-mono text-[10px] font-bold uppercase tracking-hud text-[color:var(--paper)]">
                    <span className="inline-block h-1.5 w-1.5 animate-live rounded-full bg-[color:var(--paper)]" />
                    Live
                  </span>
                  {typeof c.viewers === 'number' && (
                    <span className="absolute right-2 top-2 z-20 bg-base-900/85 px-2 py-0.5 font-mono text-[10px] uppercase tracking-hud text-[color:var(--text-dim)]">
                      {nf.format(c.viewers)} spectateurs
                    </span>
                  )}
                </div>
                <div className="flex items-end justify-between gap-3 p-4">
                  <div className="min-w-0">
                    <p className="hud-title text-lg font-bold leading-tight">{c.name}</p>
                    <p className="font-mono text-[10px] uppercase tracking-hud text-[color:var(--text-dim)]">{c.role}</p>
                    {c.title && <p className="mt-1.5 truncate font-mono text-[11px] text-[color:var(--text-mute)]">{c.title}</p>}
                  </div>
                  <KeycapButton href={c.url} size="sm">Regarder</KeycapButton>
                </div>
              </KeycapCard>
            ))}
          </div>
        </>
      )}

      {/* ── CRÉATEURS ─────────────────────────────────────────── */}
      <BlockTitle code="CREW">Créateurs &amp; streamers</BlockTitle>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {creators.map((c) => (
          <a
            key={c.id}
            href={c.url}
            target="_blank"
            rel="noopener noreferrer"
            className="group block"
          >
            <KeycapCard interactive className="h-full p-0">
              <MediaFrame src={c.avatar} alt={c.name} ratio="1/1" variant="secondary" label={c.platform} className="!border-0 !shadow-none" />
              <div className="p-3">
                <div className="flex items-center gap-2">
                  <p className="hud-title text-sm font-bold leading-tight">{c.name}</p>
                  {c.live && <span className="inline-block h-1.5 w-1.5 rounded-full bg-accent" title="En live" />}
                </div>
                <p className="mt-0.5 font-mono text-[9px] uppercase tracking-hud text-[color:var(--text-dim)]">{c.role}</p>
              </div>
            </KeycapCard>
          </a>
        ))}
      </div>

      {/* ── CLIPS ─────────────────────────────────────────────── */}
      <BlockTitle code="VOD">Clips de la semaine</BlockTitle>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {clips.map((cl) => (
          <a key={cl.id} href={cl.url} className="group block">
            <KeycapCard interactive className="h-full p-0">
              <div className="relative">
                <MediaFrame src={cl.thumb} alt={cl.title} ratio="16/9" label={cl.game} className="!border-0 !shadow-none" />
                <span aria-hidden className="absolute inset-0 z-20 flex items-center justify-center">
                  <span className="flex h-10 w-10 items-center justify-center border-2 border-[color:var(--paper)] bg-base-900/70 font-mono text-[color:var(--paper)] transition-colors group-hover:bg-accent">▶</span>
                </span>
              </div>
              <div className="p-3">
                <p className="hud-title text-[13px] font-bold leading-tight">{cl.title}</p>
                <p className="mt-1 font-mono text-[9px] uppercase tracking-hud text-[color:var(--text-dim)]">&gt; {cl.author}</p>
              </div>
            </KeycapCard>
          </a>
        ))}
      </div>

      {/* ── RÉSEAUX ───────────────────────────────────────────── */}
      <BlockTitle code="NET">Réseaux</BlockTitle>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {socials.map((s) => (
          <a key={s.id} href={s.url} target="_blank" rel="noopener noreferrer" className="group block">
            <KeycapCard interactive className="flex h-full flex-col gap-1 p-3">
              <span className="hud-title text-sm font-bold leading-tight">{s.label}</span>
              <span className="font-mono text-[10px] text-[color:var(--text-dim)] transition-colors group-hover:text-accent">{s.handle}</span>
            </KeycapCard>
          </a>
        ))}
      </div>

      {/* ── DISCORD ───────────────────────────────────────────── */}
      <div className="mt-14 flex flex-col items-center justify-between gap-5 border-2 border-line-strong panel-concrete p-6 shadow-ink sm:flex-row">
        {/* Compteurs membres/en-ligne RETIRÉS : ils étaient inventés. */}
        <p className="hud-title text-2xl font-bold leading-none">Rejoins le Discord</p>
        <KeycapButton href={DISCORD_URL} size="lg">Rejoindre &gt;</KeycapButton>
      </div>
    </div>
  );
}
