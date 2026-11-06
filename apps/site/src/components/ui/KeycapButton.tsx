import { Link } from 'react-router-dom';
import { useState, type ReactNode } from 'react';
import { playClick, vibrate } from '@/lib/sound';

type Variant = 'primary' | 'secondary';
type Size = 'sm' | 'md' | 'lg';

interface BaseProps {
  children: ReactNode;
  variant?: Variant;
  size?: Size;
  className?: string;
  /** Joue le "clac" mécanique (si le son global est activé). */
  sound?: boolean;
}

interface AsButton extends BaseProps {
  to?: undefined;
  href?: undefined;
  onClick?: () => void;
  type?: 'button' | 'submit';
}
interface AsLink extends BaseProps {
  to: string; // route interne (React Router)
  href?: undefined;
  onClick?: () => void;
}
interface AsAnchor extends BaseProps {
  href: string; // lien externe
  to?: undefined;
  onClick?: () => void;
}

type KeycapButtonProps = AsButton | AsLink | AsAnchor;

const SIZES: Record<Size, string> = {
  sm: 'px-3 py-1.5 text-xs',
  md: 'px-5 py-2.5 text-sm',
  lg: 'px-7 py-3.5 text-base',
};

/**
 * Bouton "keycap" de clavier mécanique (signature du site) :
 * - repos : élévation 3D (ombre projetée dessous)
 * - hover : remonte, arêtes qui s'allument à l'accent
 * - press : la touche s'enfonce (translateY) + ombre réduite, feedback "clac"
 * Polymorphe : <button>, <Link to> ou <a href>. Cutline via clip-path.
 */
export function KeycapButton(props: KeycapButtonProps) {
  const { children, variant = 'primary', size = 'md', className = '', sound = false } = props;
  const [spark, setSpark] = useState(0);

  // Brutalist : blocs PLEINS (rouge / bone) + ombre d'encre dure, pas de glow.
  const fill =
    variant === 'secondary'
      ? 'bg-paper text-ink'
      : 'bg-accent text-[color:var(--paper)]';

  const onDown = () => {
    if (sound) playClick('down');
    vibrate(9);
    setSpark((s) => s + 1); // remonte l'anim de l'éclair
  };
  const onUp = () => { if (sound) playClick('up'); };

  const inner = (
    <span
      className={[
        'cut-panel relative flex items-center justify-center gap-2 overflow-hidden border-2',
        'font-mono font-bold uppercase tracking-hud',
        fill,
        'shadow-ink-sm transition-all duration-snap ease-mech',
        'group-hover:-translate-x-0.5 group-hover:-translate-y-1 group-hover:shadow-ink',
        'group-active:translate-x-0.5 group-active:translate-y-1 group-active:shadow-none',
        SIZES[size],
      ].join(' ')}
      style={{ borderColor: 'var(--ink)' }}
    >
      {children}
      {spark > 0 && <span key={spark} aria-hidden className="kc-spark" />}
    </span>
  );

  const wrap = `group inline-block select-none outline-offset-4 ${className}`;

  if ('to' in props && props.to !== undefined) {
    return (
      <Link to={props.to} onClick={props.onClick} onPointerDown={onDown} onPointerUp={onUp} className={wrap}>
        {inner}
      </Link>
    );
  }
  if ('href' in props && props.href !== undefined) {
    return (
      <a href={props.href} target="_blank" rel="noopener noreferrer" onClick={props.onClick} onPointerDown={onDown} onPointerUp={onUp} className={wrap}>
        {inner}
      </a>
    );
  }
  return (
    <button type={props.type ?? 'button'} onClick={props.onClick} onPointerDown={onDown} onPointerUp={onUp} className={wrap}>
      {inner}
    </button>
  );
}
