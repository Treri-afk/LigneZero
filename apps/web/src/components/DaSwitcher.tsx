import { NavLink } from 'react-router-dom';
import './da-switcher.css';

export const DA_VARIANTS = [
  { path: '/editorial', key: '1', label: 'Éditorial', sub: 'sombre premium' },
  { path: '/brutalist', key: '2', label: 'Brutalist', sub: 'béton rouge' },
  { path: '/swiss', key: '3', label: 'Swiss', sub: 'grille stricte' },
] as const;

/**
 * Barre de comparaison des directions artistiques. Volontairement neutre
 * (chrome gris) pour ne pas polluer la DA testée. À retirer une fois le choix
 * arrêté.
 */
export function DaSwitcher() {
  return (
    <nav className="das" aria-label="Choix de la direction artistique">
      <span className="das__tag">DA</span>
      <ul className="das__list">
        {DA_VARIANTS.map((variant) => (
          <li key={variant.path}>
            <NavLink to={variant.path} className="das__item">
              <kbd className="das__key">{variant.key}</kbd>
              <span className="das__label">{variant.label}</span>
              <span className="das__sub">{variant.sub}</span>
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}
