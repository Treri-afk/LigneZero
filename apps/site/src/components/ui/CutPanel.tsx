import { forwardRef } from 'react';
import type { HTMLAttributes } from 'react';

interface CutPanelProps extends HTMLAttributes<HTMLDivElement> {
  /** Sens de la coupe (rythme asymétrique entre panneaux). */
  cut?: 'default' | 'alt';
  /** Fine arête d'accent en haut (souligne, ne brille pas). */
  edge?: boolean;
  edgeVariant?: 'primary' | 'secondary';
  /** Anime la cutline au montage : un scan d'accent balaie le biseau. */
  scan?: boolean;
}

/**
 * Panneau hard-surface : fond anthracite, coins biseautés (clip-path),
 * facette claire en haut + ombre portée nette (relief de plaque).
 * Pas de glow — l'accent n'apparaît qu'en fine arête si `edge`.
 */
export const CutPanel = forwardRef<HTMLDivElement, CutPanelProps>(
  ({ className = '', cut = 'default', edge = false, edgeVariant = 'primary', scan = false, children, ...rest }, ref) => {
    const shape = cut === 'alt' ? 'cut-panel-alt' : 'cut-panel';
    const edgeColor = edgeVariant === 'secondary' ? 'var(--accent-2)' : 'var(--accent)';
    return (
      <div ref={ref} className={`relative ${scan ? 'cutline-scan overflow-hidden' : ''} ${className}`} {...rest}>
        {/* liseré cutline (légèrement plus grand) simulant la tranche de plaque */}
        <div
          aria-hidden
          className={`${shape} absolute inset-0`}
          style={{ background: 'var(--line-strong)', clipPath: undefined }}
        />
        <div className={`${shape} panel-concrete relative h-full shadow-panel`}>
          {edge && (
            <span
              aria-hidden
              className="absolute inset-x-0 top-0 h-px"
              style={{ background: edgeColor, opacity: 0.7 }}
            />
          )}
          {children}
        </div>
      </div>
    );
  },
);

CutPanel.displayName = 'CutPanel';
