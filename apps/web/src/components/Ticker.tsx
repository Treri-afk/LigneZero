import './ticker.css';

export type TickerItem = { text: string; tone?: 'win' | 'loss' | 'neutral' };

/**
 * Bandeau défilant façon fil de résultats de diffusion. La piste est
 * dupliquée pour que la boucle soit invisible ; le défilement se met en pause
 * au survol pour rester lisible, et s'arrête tout court en reduced-motion.
 */
export function Ticker({ items, speed = 46 }: { items: TickerItem[]; speed?: number }) {
  const track = (
    <ul className="lz-ticker__row">
      {items.map((item, i) => (
        <li className="lz-ticker__item" key={`${item.text}-${i}`} data-tone={item.tone ?? 'neutral'}>
          <span className="lz-ticker__bullet" aria-hidden="true" />
          {item.text}
        </li>
      ))}
    </ul>
  );

  return (
    <div className="lz-ticker">
      <div className="lz-ticker__track" style={{ animationDuration: `${speed}s` }}>
        {track}
        <div aria-hidden="true" className="lz-ticker__clone">
          {track}
        </div>
      </div>
    </div>
  );
}
