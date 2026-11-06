import { useState } from 'react';
import { useBrand } from '@/data/DataProvider';

/**
 * Mot-symbole de la structure : le logo réglé dans le manager (page Identité)
 * s'il existe, sinon le nom en typo display encadré de crochets HUD.
 *
 * Le repli est volontairement systématique — logo absent, URL cassée ou image
 * qui ne charge pas : l'identité reste visible dans tous les cas.
 */
export function BrandLogo({ size = 'md', className = '' }: { size?: 'sm' | 'md' | 'lg'; className?: string }) {
  const brand = useBrand();
  const [broken, setBroken] = useState(false);
  const showLogo = Boolean(brand.logoUrl) && !broken;

  const height = size === 'lg' ? 'max-h-10' : size === 'sm' ? 'max-h-6' : 'max-h-8';
  const text = size === 'lg' ? 'text-2xl' : size === 'sm' ? 'text-base' : 'text-lg';

  if (showLogo) {
    return (
      <img
        src={brand.logoUrl}
        alt={brand.name}
        onError={() => setBroken(true)}
        className={`${height} w-auto object-contain ${className}`}
      />
    );
  }

  return (
    <span className={`flex items-center gap-2 ${className}`}>
      <span aria-hidden className="font-mono text-accent">[</span>
      <span className={`hud-title ${text} font-bold tracking-wide2 glow-text`}>{brand.name}</span>
      <span aria-hidden className="font-mono text-accent">]</span>
    </span>
  );
}

/**
 * Variante carrée (pastille) : monogramme si fourni, sinon le nom court sur
 * aplat d'accent.
 */
export function BrandMark({ size = 32, className = '' }: { size?: number; className?: string }) {
  const brand = useBrand();
  const [broken, setBroken] = useState(false);

  if (brand.markUrl && !broken) {
    return (
      <img
        src={brand.markUrl}
        alt={brand.name}
        onError={() => setBroken(true)}
        style={{ height: size, width: size }}
        className={`object-contain ${className}`}
      />
    );
  }

  return (
    <span
      aria-hidden
      style={{ height: size, width: size, fontSize: size * 0.4 }}
      className={`flex items-center justify-center bg-accent font-display font-bold text-[color:var(--ink)] ${className}`}
    >
      {brand.shortName}
    </span>
  );
}
