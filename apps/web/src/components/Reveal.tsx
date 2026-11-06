import { createElement, type CSSProperties, type ReactNode } from 'react';
import { useReveal } from '@/hooks/useReveal';

type RevealProps = {
  children: ReactNode;
  /** Balise rendue — on garde la sémantique de la page. */
  as?: 'div' | 'section' | 'li' | 'article' | 'footer' | 'header';
  className?: string;
  /** Décalage de la cascade, en ms. */
  delay?: number;
  id?: string;
  'aria-labelledby'?: string;
};

/** Enveloppe un bloc d'une révélation au scroll (voir useReveal). */
export function Reveal({ children, as = 'div', className, delay = 0, ...rest }: RevealProps) {
  const ref = useReveal<HTMLElement>();
  const style = { '--reveal-delay': `${delay}ms` } as CSSProperties;

  return createElement(as, { ref, className, style, 'data-reveal': true, ...rest }, children);
}
