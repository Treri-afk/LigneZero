import { useEffect, useState } from 'react';

export type Countdown = {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  /** Le match a commencé et dure encore (fenêtre de 3 h). */
  isLive: boolean;
  /** Le match est passé. */
  isOver: boolean;
};

const LIVE_WINDOW_MS = 3 * 60 * 60 * 1000;

function compute(target: number): Countdown {
  const delta = target - Date.now();

  if (delta <= 0) {
    const live = Date.now() < target + LIVE_WINDOW_MS;
    return { days: 0, hours: 0, minutes: 0, seconds: 0, isLive: live, isOver: !live };
  }

  const seconds = Math.floor(delta / 1000);
  return {
    days: Math.floor(seconds / 86400),
    hours: Math.floor((seconds % 86400) / 3600),
    minutes: Math.floor((seconds % 3600) / 60),
    seconds: seconds % 60,
    isLive: false,
    isOver: false,
  };
}

/**
 * Compte à rebours vivant jusqu'au prochain match, qui bascule tout seul en
 * état LIVE à l'heure dite. C'est ce qui fait qu'une vitrine d'équipe a l'air
 * branchée sur la saison plutôt que figée au dernier déploiement.
 */
export function useCountdown(isoDate: string): Countdown {
  const target = new Date(isoDate).getTime();
  const [value, setValue] = useState(() => compute(target));

  useEffect(() => {
    setValue(compute(target));
    const id = window.setInterval(() => setValue(compute(target)), 1000);
    return () => window.clearInterval(id);
  }, [target]);

  return value;
}

/** `7` → `07`, pour que les chiffres ne sautent pas d'une seconde à l'autre. */
export const pad = (n: number) => String(n).padStart(2, '0');
