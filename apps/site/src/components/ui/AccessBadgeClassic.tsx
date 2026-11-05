import { useEffect, useRef, useState } from 'react';
import { useBrand } from '@/data/DataProvider';
import type { Staff } from '@/types';
import { MediaFrame } from '@/components/ui/MediaFrame';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { playClick } from '@/lib/sound';

interface AccessBadgeClassicProps {
  staff: Staff;
  index: number;
}

/**
 * Unité "carte d'accès sécurisé" du staff : une plaque gravée fixée au mur,
 * d'où pend — par un cordon — un badge d'accès. Au survol la gravure prend un
 * balayage spéculaire dur (DA : bone, pas de glow doré). Au clic le badge se
 * "badge" (scan + LED rouge→bone façon lecteur d'accès) puis se retourne pour
 * révéler le dossier du staff. Accessible clavier (face avant = bouton),
 * respecte prefers-reduced-motion (pas de balancement/scan, flip instantané).
 */
export function AccessBadgeClassic({ staff, index }: AccessBadgeClassicProps) {
  const brand = useBrand();
  const reduced = useReducedMotion();
  const [open, setOpen] = useState(false);
  const [scanning, setScanning] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout>>();

  const matricule = staff.matricule ?? `STF-${String(index + 1).padStart(3, '0')}`;
  const clearance = staff.clearance ?? 'Niveau 2';
  const granted = open || scanning;

  useEffect(() => () => clearTimeout(timer.current), []);

  function toggle() {
    if (open) {
      playClick('up');
      setOpen(false);
      return;
    }
    playClick('down');
    if (reduced) {
      setOpen(true);
      return;
    }
    setScanning(true);
    timer.current = setTimeout(() => {
      setScanning(false);
      setOpen(true);
      playClick('up');
    }, 620);
  }

  // Décalage du balancement pour désynchroniser les badges du rack.
  const swayDelay = `${-(index % 4) * 0.9}s`;

  return (
    <div className="badge-unit relative flex flex-col items-center" style={{ perspective: 1200 }}>
      {/* ── Plaque gravée (support mural) ───────────────────────── */}
      <div
        className="plate-metal relative z-10 w-full max-w-[15rem] overflow-hidden border-2 px-4 py-2 shadow-ink"
        style={{ borderColor: 'var(--line-strong)' }}
      >
        {/* boulons de fixation */}
        <span aria-hidden className="absolute left-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-[color:var(--ink)]/40" />
        <span aria-hidden className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-[color:var(--ink)]/40" />
        <p className="engrave hud-title text-center text-sm font-bold leading-tight">{staff.name}</p>
        <p className="engrave text-center font-mono text-[9px] uppercase tracking-hud">
          {staff.division ?? 'Structure'} · {matricule}
        </p>
        <span className="plate-sheen" aria-hidden />
      </div>

      {/* ── Cordon (lanyard) ────────────────────────────────────── */}
      <div
        className="badge-hang relative flex w-full flex-col items-center"
        data-open={open}
        style={{ animationDelay: swayDelay, perspective: 1100 }}
      >
        <div className="lanyard h-10 w-1.5" aria-hidden />
        {/* clip métal */}
        <div
          className="z-10 -mt-0.5 h-2.5 w-6 border border-[color:var(--ink)]/50 bg-[color:var(--concrete-2)]"
          style={{ clipPath: 'polygon(12% 0, 88% 0, 100% 100%, 0 100%)' }}
          aria-hidden
        />

        {/* ── Badge d'accès (recto/verso) ───────────────────────── */}
        <div
          className="badge-flip relative mt-0 w-full max-w-[16rem]"
          data-open={open}
          style={{ aspectRatio: '3 / 4.3' }}
        >
          {/* RECTO : carte d'accès (bouton) */}
          <button
            type="button"
            onClick={toggle}
            aria-expanded={open}
            aria-hidden={open}
            tabIndex={open ? -1 : 0}
            className="badge-face group cut-panel panel-concrete absolute inset-0 flex flex-col overflow-hidden border-2 text-left shadow-ink transition-transform duration-ui ease-mech hover:-translate-y-1"
            style={{ borderColor: 'var(--line-strong)' }}
          >
            {/* en-tête badge + LED statut */}
            <div className="flex items-center justify-between gap-2 border-b border-line-strong px-2.5 py-1.5">
              <span className="hud-label text-[8px]">{brand.name} · ACCÈS</span>
              <span className="flex items-center gap-1.5 font-mono text-[8px] uppercase tracking-hud">
                <span
                  className="h-2 w-2 rounded-full transition-colors duration-ui"
                  style={{
                    background: granted ? 'var(--signal-ok)' : 'var(--accent)',
                    boxShadow: `0 0 0 2px color-mix(in srgb, ${granted ? 'var(--signal-ok)' : 'var(--accent)'} 30%, transparent)`,
                  }}
                />
                <span style={{ color: granted ? 'var(--signal-ok)' : 'var(--accent)' }}>
                  {granted ? 'AUTORISÉ' : 'VERROUILLÉ'}
                </span>
              </span>
            </div>

            {/* photo */}
            <div className="relative flex-1 p-2.5">
              <MediaFrame
                src={staff.photo}
                alt={staff.name}
                ratio="4/5"
                variant="secondary"
                label={matricule}
                className="!h-full !border !shadow-none"
              />
              {scanning && <span className="badge-scan" aria-hidden />}
            </div>

            {/* identité */}
            <div className="px-2.5 pb-1">
              <p className="hud-title text-sm font-bold leading-tight">{staff.name}</p>
              <p className="font-mono text-[9px] uppercase tracking-hud text-[color:var(--text-dim)]">{staff.role}</p>
            </div>

            {/* pied : chip + code-barres + habilitation */}
            <div className="flex items-center justify-between gap-2 border-t border-line-strong px-2.5 py-1.5">
              <span className="badge-chip h-4 w-6 border border-[color:var(--ink)]/40" aria-hidden />
              <span className="ticket-barcode h-4 flex-1 text-[color:var(--text-dim)]" aria-hidden />
              <span className="font-mono text-[8px] uppercase tracking-hud text-[color:var(--text-mute)]">
                {clearance}
              </span>
            </div>

            {/* invite d'action */}
            <span className="absolute bottom-1 right-2 font-mono text-[8px] uppercase tracking-hud text-[color:var(--text-mute)] opacity-0 transition-opacity duration-ui group-hover:opacity-100">
              [ badger ]
            </span>
          </button>

          {/* VERSO : dossier */}
          <div
            className="badge-face badge-face--back cut-panel panel-concrete absolute inset-0 flex flex-col overflow-hidden border-2 shadow-ink"
            style={{ borderColor: 'var(--accent)' }}
            aria-hidden={!open}
          >
            <div className="flex items-center justify-between border-b border-line-strong px-2.5 py-1.5">
              <span className="hud-label text-[8px]" style={{ color: 'var(--accent)' }}>
                Dossier · {matricule}
              </span>
              <button
                type="button"
                onClick={toggle}
                tabIndex={open ? 0 : -1}
                className="font-mono text-[9px] uppercase tracking-hud text-[color:var(--text-dim)] transition-colors hover:text-accent"
              >
                ↺ verrouiller
              </button>
            </div>

            <div className="flex-1 overflow-auto px-3 py-2.5">
              <p className="hud-title text-base font-bold leading-tight">{staff.name}</p>
              <p className="mt-0.5 font-mono text-[10px] uppercase tracking-hud text-[color:var(--text-dim)]">
                {staff.role}
              </p>

              {staff.bio && (
                <p className="mt-2.5 font-mono text-[11px] leading-relaxed text-[color:var(--text-mute)]">
                  {staff.bio}
                </p>
              )}

              <dl className="mt-3 grid grid-cols-2 gap-x-2 gap-y-1.5 font-mono text-[9px] uppercase tracking-hud">
                <div>
                  <dt className="text-[color:var(--text-mute)]">Division</dt>
                  <dd className="text-[color:var(--text-dim)]">{staff.division ?? '—'}</dd>
                </div>
                <div>
                  <dt className="text-[color:var(--text-mute)]">Habilitation</dt>
                  <dd style={{ color: 'var(--accent)' }}>{clearance}</dd>
                </div>
                <div>
                  <dt className="text-[color:var(--text-mute)]">Depuis</dt>
                  <dd className="text-[color:var(--text-dim)]">{staff.since ?? '—'}</dd>
                </div>
                <div>
                  <dt className="text-[color:var(--text-mute)]">Statut</dt>
                  <dd style={{ color: 'var(--signal-ok)' }}>Actif</dd>
                </div>
              </dl>
            </div>

            {staff.socials.length > 0 && (
              <div className="flex flex-wrap gap-3 border-t border-line-strong px-3 py-2">
                {staff.socials.map((soc) => (
                  <a
                    key={soc.label}
                    href={soc.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    tabIndex={open ? 0 : -1}
                    className="font-mono text-[10px] uppercase tracking-hud text-[color:var(--text-dim)] transition-colors hover:text-accent"
                  >
                    &gt; {soc.label}
                  </a>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
