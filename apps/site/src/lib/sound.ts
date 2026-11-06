/**
 * Micro "clac" de switch mécanique, synthétisé (pas de fichier audio).
 * Off par défaut côté composants. Toujours désactivé en reduced-motion.
 * Activable globalement via setSoundEnabled().
 */
let enabled = false;
let ctx: AudioContext | null = null;

export function setSoundEnabled(v: boolean) {
  enabled = v;
}

export function isSoundEnabled() {
  return enabled;
}

function reducedMotion() {
  return typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/** Joue un clic court. `kind` : down (enfoncement) ou up (relâche). */
export function playClick(kind: 'down' | 'up' = 'down') {
  if (!enabled || reducedMotion() || typeof window === 'undefined') return;
  try {
    ctx ??= new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    const t = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'square';
    osc.frequency.value = kind === 'down' ? 220 : 320;
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.exponentialRampToValueAtTime(0.06, t + 0.004);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.05);
    osc.connect(gain).connect(ctx.destination);
    osc.start(t);
    osc.stop(t + 0.06);
  } catch {
    /* audio indisponible : on ignore silencieusement */
  }
}

function audio(): AudioContext | null {
  if (!enabled || reducedMotion() || typeof window === 'undefined') return null;
  try {
    ctx ??= new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    return ctx;
  } catch {
    return null;
  }
}

/** Balayage (transition, rideau HUD). */
export function playWhoosh() {
  const c = audio();
  if (!c) return;
  const t = c.currentTime;
  const osc = c.createOscillator();
  const gain = c.createGain();
  osc.type = 'sawtooth';
  osc.frequency.setValueAtTime(90, t);
  osc.frequency.exponentialRampToValueAtTime(420, t + 0.18);
  gain.gain.setValueAtTime(0.0001, t);
  gain.gain.exponentialRampToValueAtTime(0.05, t + 0.03);
  gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.22);
  osc.connect(gain).connect(c.destination);
  osc.start(t);
  osc.stop(t + 0.24);
}

/** Bip d'alerte (mode match / live). */
export function playAlert() {
  const c = audio();
  if (!c) return;
  const t = c.currentTime;
  [880, 660].forEach((f, i) => {
    const osc = c.createOscillator();
    const gain = c.createGain();
    osc.type = 'square';
    osc.frequency.value = f;
    const s = t + i * 0.11;
    gain.gain.setValueAtTime(0.0001, s);
    gain.gain.exponentialRampToValueAtTime(0.05, s + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, s + 0.09);
    osc.connect(gain).connect(c.destination);
    osc.start(s);
    osc.stop(s + 0.1);
  });
}

/** Déchirure de ticket (bruit filtré bref). */
export function playRip() {
  const c = audio();
  if (!c) return;
  const t = c.currentTime;
  const dur = 0.22;
  const buf = c.createBuffer(1, Math.floor(c.sampleRate * dur), c.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / data.length);
  const src = c.createBufferSource();
  src.buffer = buf;
  const filter = c.createBiquadFilter();
  filter.type = 'highpass';
  filter.frequency.value = 1400;
  const gain = c.createGain();
  gain.gain.setValueAtTime(0.09, t);
  gain.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  src.connect(filter).connect(gain).connect(c.destination);
  src.start(t);
}

/** Confirmation (claim, succès). */
export function playSuccess() {
  const c = audio();
  if (!c) return;
  const t = c.currentTime;
  [523, 784].forEach((f, i) => {
    const osc = c.createOscillator();
    const gain = c.createGain();
    osc.type = 'triangle';
    osc.frequency.value = f;
    const s = t + i * 0.08;
    gain.gain.setValueAtTime(0.0001, s);
    gain.gain.exponentialRampToValueAtTime(0.06, s + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, s + 0.16);
    osc.connect(gain).connect(c.destination);
    osc.start(s);
    osc.stop(s + 0.18);
  });
}

/** Vibration mobile (Vibration API). Muette si reduced-motion ou non supporté. */
export function vibrate(pattern: number | number[] = 12) {
  if (reducedMotion() || typeof navigator === 'undefined' || !('vibrate' in navigator)) return;
  try {
    navigator.vibrate(pattern);
  } catch {
    /* ignore */
  }
}
