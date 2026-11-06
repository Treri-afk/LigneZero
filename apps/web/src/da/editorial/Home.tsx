import '@fontsource-variable/big-shoulders-display';
import '@fontsource-variable/instrument-sans';
import '@fontsource/instrument-serif';
import './editorial.css';

import { Counter } from '@/components/Counter';
import { Reveal } from '@/components/Reveal';
import { ScrollLine } from '@/components/ScrollLine';
import { Ticker } from '@/components/Ticker';
import { useCountdown, pad } from '@/hooks/useCountdown';
import { useRosterDial } from '@/hooks/useRosterDial';
import {
  brand,
  figures,
  nextMatch,
  partners,
  results,
  roster,
  socials,
  tickerItems,
} from '@/data/content';

const NAV = [
  { label: 'Équipe', href: '#equipe' },
  { label: 'Résultats', href: '#resultats' },
  { label: 'Contact', href: '#contact' },
];

const SECTIONS = [
  { id: 'top', label: 'Ligne zéro' },
  { id: 'equipe', label: 'Roster' },
  { id: 'chiffres', label: 'Saison' },
  { id: 'resultats', label: 'Résultats' },
  { id: 'partenaires', label: 'Partenaires' },
  { id: 'contact', label: 'Contact' },
];

function Arrow() {
  return (
    <span className="ed-cta__icon" aria-hidden="true">
      ↗
    </span>
  );
}

/** Compte à rebours : les chiffres restent alignés, seule la valeur bouge. */
function CountdownBlock() {
  const { days, hours, minutes, seconds, isLive } = useCountdown(nextMatch.date);

  if (isLive) {
    return (
      <p className="ed__live ed__live--on">
        <i aria-hidden="true" />
        En direct maintenant
      </p>
    );
  }

  return (
    <div className="ed__count" role="timer" aria-live="off">
      {[
        { v: pad(days), l: 'jours' },
        { v: pad(hours), l: 'h' },
        { v: pad(minutes), l: 'min' },
        { v: pad(seconds), l: 'sec' },
      ].map((unit) => (
        <span className="ed__count-unit" key={unit.l}>
          <b>{unit.v}</b>
          <small>{unit.l}</small>
        </span>
      ))}
    </div>
  );
}

export function EditorialHome() {
  const dial = useRosterDial(roster.length);
  const active = roster[dial.index];

  return (
    <div className="ed">
      <div className="ed__grain" aria-hidden="true" />
      <ScrollLine sections={SECTIONS} />

      <header className="ed__nav">
        <div className="ed__wrap ed__nav-in">
          <a className="ed__word" href="#top">
            <b>LIGNEZERO</b>
            <i aria-hidden="true" />
          </a>
          <nav className="ed__links" aria-label="Navigation principale">
            {NAV.map((item) => (
              <a key={item.href} href={item.href}>
                {item.label}
              </a>
            ))}
          </nav>
          <a className="ed-cta" href="#contact">
            Nous écrire
            <Arrow />
          </a>
        </div>
      </header>

      <main>
        <section className="ed__hero ed__wrap" id="top">
          <div className="ed__hero-grid">
            <div>
              <Reveal>
                <p className="ed-eyebrow">{brand.tagline}</p>
                <h1>
                  <span>Ligne</span>
                  <span className="ed__hero-zero">Zéro</span>
                </h1>
                <p className="ed__hero-lede">
                  Trois joueurs, un objectif : <em>tenir la ligne</em> jusqu'au cashout. Structure
                  française fondée en {brand.founded}, basée à {brand.city}.
                </p>
                <div className="ed__hero-actions">
                  <a className="ed-cta" href="#equipe">
                    Voir l'équipe
                    <Arrow />
                  </a>
                  <a className="ed-cta ed-cta--ghost" href="#resultats">
                    Résultats
                    <Arrow />
                  </a>
                </div>
              </Reveal>
            </div>

            <Reveal className="ed__hero-figure" delay={120}>
              <div className="ed__hero-plate" aria-hidden="true">
                <span className="ed__hero-plate-mark">LZ</span>
                <span className="ed__hero-plate-label">Visuel équipe — à venir</span>
              </div>
              <div className="ed__hero-meta">
                <span>Roster 2026</span>
                <span>The Finals · 3v3v3</span>
                <span>{brand.handle}</span>
              </div>
            </Reveal>
          </div>
        </section>

        <div className="ed__ticker">
          <Ticker items={tickerItems} />
        </div>

        <Reveal as="section" className="ed__band" aria-labelledby="ed-next">
          <div className="ed__wrap ed__band-in">
            <div className="ed__band-vs">
              <p className="ed-eyebrow" id="ed-next">
                Prochain match — {nextMatch.competition}
              </p>
              <strong>
                {brand.short} <span className="ed-serif">vs</span> {nextMatch.opponent}
              </strong>
              <span>
                {nextMatch.stage} · {nextMatch.dateLabel} {nextMatch.timeLabel} · {nextMatch.venue}
              </span>
            </div>
            <CountdownBlock />
          </div>
        </Reveal>

        <section className="ed__section ed__wrap" id="equipe">
          <Reveal className="ed__head">
            <h2>Le roster</h2>
            <p>
              Un trio fixe depuis deux saisons. Chacun tient un rôle, personne n'en sort : c'est ce
              qui rend la rotation lisible et les cashouts rapides.
            </p>
          </Reveal>

          <Reveal className="ed__dial">
            <div className="ed__dial-head">
              <p className="ed-eyebrow">
                Joueur {dial.index + 1} — {roster.length}
              </p>
              <h3 className="ed__dial-name" key={active.pseudo}>
                {active.pseudo}
              </h3>
              <p className="ed__dial-role">{active.role}</p>
              <dl className="ed__dial-specs">
                <div>
                  <dt>Build</dt>
                  <dd>{active.build}</dd>
                </div>
                <div>
                  <dt>Dans l'équipe</dt>
                  <dd>Depuis {active.since}</dd>
                </div>
                <div>
                  <dt>{active.stat.label}</dt>
                  <dd>{active.stat.value}</dd>
                </div>
              </dl>
            </div>

            <ul
              className="ed__panels"
              ref={dial.listRef as React.RefObject<HTMLUListElement>}
              onKeyDown={dial.onKeyDown}
              style={{
                gridTemplateColumns: roster
                  .map((_, i) => (i === dial.index ? '2.4fr' : '1fr'))
                  .join(' '),
              }}
            >
              {roster.map((player, i) => (
                <li className="ed__panel" key={player.pseudo} data-active={i === dial.index}>
                  <button
                    type="button"
                    aria-pressed={i === dial.index}
                    onClick={() => dial.select(i)}
                    onMouseEnter={() => dial.select(i)}
                    onFocus={() => dial.select(i)}
                  >
                    <span className="sr-only">Afficher la fiche de {player.pseudo}</span>
                    <span className="ed__panel-num" aria-hidden="true">
                      {player.number}
                    </span>
                    <span className="ed__panel-name" aria-hidden="true">
                      {player.pseudo}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </Reveal>
        </section>

        <section className="ed__section ed__wrap" id="chiffres" aria-labelledby="ed-chiffres">
          <Reveal className="ed__head">
            <h2 id="ed-chiffres">La saison en chiffres</h2>
          </Reveal>
          <Reveal className="ed__figures">
            {figures.map((figure) => (
              <div className="ed__figure" key={figure.label}>
                <Counter
                  value={figure.value}
                  padTo={'padTo' in figure ? figure.padTo : undefined}
                  suffix={'suffix' in figure ? figure.suffix : undefined}
                />
                <span>{figure.label}</span>
                <small>{figure.note}</small>
              </div>
            ))}
          </Reveal>
        </section>

        <section className="ed__section ed__wrap" id="resultats">
          <Reveal className="ed__head">
            <h2>Derniers résultats</h2>
            <p>Saison 2026 — World Tour et circuit français.</p>
          </Reveal>
          <Reveal className="ed__results">
            {results.map((result) => (
              <div className="ed__result" key={`${result.date}-${result.opponent}`}>
                <span className="ed__result-date">{result.date}</span>
                <span>
                  <span className="ed__result-opp">{result.opponent}</span>
                  <br />
                  <span className="ed__result-comp">{result.competition}</span>
                </span>
                <span className="ed__result-score">{result.score}</span>
                <span className="ed__result-tag" data-win={result.win}>
                  {result.win ? 'Victoire' : 'Défaite'}
                </span>
              </div>
            ))}
          </Reveal>
        </section>

        <section className="ed__section ed__wrap" id="partenaires" aria-labelledby="ed-partenaires">
          <Reveal className="ed__head">
            <h2 id="ed-partenaires">Partenaires</h2>
            <p>Quatre marques qui équipent l'équipe toute la saison.</p>
          </Reveal>
          <Reveal className="ed__partners">
            {partners.map((partner) => (
              <div className="ed__partner" key={partner.name}>
                <b>{partner.name}</b>
                <span>{partner.tier}</span>
              </div>
            ))}
          </Reveal>
        </section>
      </main>

      <footer className="ed__footer" id="contact">
        <div className="ed__wrap">
          <div className="ed__footer-in">
            <Reveal>
              <h2>
                Travailler <em>avec nous</em>
              </h2>
              <p className="ed__hero-lede">
                Partenariat, essai joueur, demande presse : une adresse suffit, on répond sous 48 h.
              </p>
              <div className="ed__hero-actions">
                <a className="ed-cta" href="mailto:contact@lignezero.gg">
                  contact@lignezero.gg
                  <Arrow />
                </a>
              </div>
            </Reveal>

            <Reveal className="ed__socials" delay={120}>
              {socials.map((social) => (
                <a href={social.href} key={social.label}>
                  {social.label}
                  <span>{social.handle}</span>
                </a>
              ))}
            </Reveal>
          </div>

          <div className="ed__legal">
            <span>
              © {brand.founded}–2026 {brand.name}
            </span>
            <span>{brand.city}</span>
            <span>DA 01 — Éditorial premium sombre</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
