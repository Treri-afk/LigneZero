import { useEffect, useRef, useState } from 'react';
import { useLiveMatch } from '@/hooks/useLiveMatch';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { playAlert, vibrate } from '@/lib/sound';

/**
 * "Mode match" : quand un live est en cours, le site s'entoure de bandes de
 * danger défilantes, un liseré rouge pulse, et un flash + alerte se déclenchent
 * au démarrage du live pour pousser à cliquer le bandeau LIVE. Site-wide.
 */
export function MatchMode() {
  const live = useLiveMatch();
  const reduced = useReducedMotion();
  const [flash, setFlash] = useState(0);
  const was = useRef(false);

  useEffect(() => {
    const on = !!live;
    if (on && !was.current) { setFlash((f) => f + 1); playAlert(); vibrate([20, 40, 20]); }
    was.current = on;
  }, [live]);

  if (!live) return null;

  return (
    <>
      {/* bords "live" : glow d'accent qui circule le long du viewport */}
      <div aria-hidden className="live-edge-y pointer-events-none fixed inset-y-0 left-0 z-[46] w-[3px]" />
      <div aria-hidden className="live-edge-y pointer-events-none fixed inset-y-0 right-0 z-[46] w-[3px]" />
      <div aria-hidden className="live-edge-x pointer-events-none fixed inset-x-0 bottom-0 z-[46] h-[3px]" />
      {/* liseré rouge qui respire */}
      <div aria-hidden className="match-mode pointer-events-none fixed inset-0 z-[43]" />
      {/* flash bref au passage en live */}
      {!reduced && flash > 0 && <span key={flash} className="match-flash" />}
    </>
  );
}
