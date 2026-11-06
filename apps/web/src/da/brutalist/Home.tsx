import '@fontsource/black-ops-one';
import '@fontsource-variable/instrument-sans';
import '@fontsource/jetbrains-mono';
import './brutalist.css';

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
  { label: 'Équipe', href: '#br-equipe' },
  { label: 'Résultats', href: '#br-resultats' },
  { label: 'Contact', href: '#br-contact' },
];

const SECTIONS = [
  { id: 'br-top', label: 'Ligne zéro' },
  { id: 'br-equipe', label: 'Roster' },
  { id: 'br-chiffres', label: 'Saison' },
  { id: 'br-resultats', label: 'Résultats' },
  { id: 'br-partenaires', label: 'Partenaires' },
  { id: 'br-contact', label: 'Contact' },
];

/** Décompte en affichage machine : H-06 puis le détail en chiffres fixes. */
function CountdownStrip() {
  const { days, hours, minutes, seconds, isLive } = useCountdown(nextMatch.date);

  if (isLive) {
    return (
      <div className="br__count br__count--live">
        <span className="br__count-dot" aria-hidden="true" />
        Match en direct
      </div>
    );
  }

  return (
    <div className="br__count" role="timer" aria-live="off">
      <span className="br__count-h">H-{pad(days)}</span>
      <span className="br__count-digits">
        {pad(hours)}:{pad(minutes)}:{pad(seconds)}
      </span>
    </div>
  );
}

export function BrutalistHome() {
  const dial = useRosterDial(roster.length);

  return (
    <div className="br">
      <div className="br__grain" aria-hidden="true" />
      <ScrollLine sections={SECTIONS} />

      <header className="br__nav">
        <div className="br__wrap br__nav-in">
          <a className="br__word" href="#br-top">
            <i aria-hidden="true" />
            LIGNEZERO
          </a>
          <nav className="br__links" aria-label="Navigation principale">
            {NAV.map((item) => (
              <a key={item.href} href={item.href}>
                {item.label}
              </a>
            ))}
          </nav>
          <a className="br-key br-key--red" href="#br-contact">
            Nous écrire
          </a>
        </div>
      </header>

      <main id="br-top">
        <section className="br__hero br__wrap">
          <div className="br__hero-grid">
            <Reveal>
              <p className="br-label" style={{ color: 'var(--red)' }}>
                {brand.tagline}
              </p>
              <h1>
                <span>Ligne</span>
                <span>
                  Z<em>é</em>ro
                </span>
              </h1>
              <p className="br__hero-lede">
                Trois joueurs, un plan, zéro improvisation. Structure française fondée en{' '}
                {brand.founded}, basée à {brand.city}.
              </p>
              <div className="br__hero-actions">
                <a className="br-key" href="#br-equipe">
                  Voir l'équipe
                </a>
                <a className="br-key br-key--outline" href="#br-resultats">
                  Résultats
                </a>
              </div>
            </Reveal>

            <Reveal delay={120}>
              <div className="br__ticket">
                <div className="br__ticket-top">
                  <span>Prochain match</span>
                  <span>{nextMatch.competition}</span>
                </div>
                <div className="br__ticket-body">
                  <strong>
                    {brand.short} vs {nextMatch.opponent}
                  </strong>
                  <span>
                    {nextMatch.stage} · {nextMatch.mode}
                  </span>
                </div>
                <div className="br__ticket-date">
                  <b>02.11</b>
                  <span className="br-label" style={{ color: 'rgba(20,18,16,.6)' }}>
                    {nextMatch.timeLabel}
                    <br />
                    {nextMatch.venue}
                  </span>
                </div>
                <CountdownStrip />
              </div>
            </Reveal>
          </div>

          <div className="br__hero-tape br-label">
            <span>Roster 2026</span>
            <span>The Finals · 3v3v3</span>
            <span>{brand.handle}</span>
            <span>Rev 02 — unité FR</span>
          </div>
        </section>

        <div className="br__hazard" aria-hidden="true" />

        <div className="br__ticker">
          <Ticker items={tickerItems} />
        </div>

        <section className="br__section br__light br__concrete" id="br-equipe">
          <div className="br__wrap">
            <Reveal className="br__head">
              <h2>Le roster</h2>
              <p>
                Un trio fixe depuis deux saisons. Chacun tient son rôle, personne n'en sort : la
                rotation reste lisible et les cashouts rapides.
              </p>
            </Reveal>

            <Reveal>
              <ul
                className="br__stack"
                ref={dial.listRef as React.RefObject<HTMLUListElement>}
                onKeyDown={dial.onKeyDown}
                style={{
                  gridTemplateRows: roster
                    .map((_, i) => (i === dial.index ? '19rem' : '4.6rem'))
                    .join(' '),
                }}
              >
                {roster.map((player, i) => (
                  <li className="br-row" key={player.pseudo} data-active={i === dial.index}>
                    <button
                      type="button"
                      className="br-row__bar"
                      aria-expanded={i === dial.index}
                      onClick={() => dial.select(i)}
                      onMouseEnter={() => dial.select(i)}
                      onFocus={() => dial.select(i)}
                    >
                      <span className="br-row__num">{player.number}</span>
                      <span className="br-row__name">{player.pseudo}</span>
                      <span className="br-row__build">{player.build}</span>
                      <span className="br-row__chevron" aria-hidden="true" />
                    </button>

                    <div className="br-row__body">
                      <div className="br-row__ph" aria-hidden="true">
                        <span className="br-row__cross" />
                        <span className="br-label">Portrait à venir</span>
                      </div>
                      <dl className="br-row__specs">
                        <div>
                          <dt>Rôle</dt>
                          <dd>{player.role}</dd>
                        </div>
                        <div>
                          <dt>Dans l'équipe</dt>
                          <dd>Depuis {player.since}</dd>
                        </div>
                        <div>
                          <dt>{player.stat.label}</dt>
                          <dd>{player.stat.value}</dd>
                        </div>
                      </dl>
                    </div>
                  </li>
                ))}
              </ul>
            </Reveal>
          </div>
        </section>

        <section className="br__section br__wrap" id="br-chiffres" aria-labelledby="br-chiffres-t">
          <Reveal className="br__head">
            <h2 id="br-chiffres-t">La saison en chiffres</h2>
            <p>Relevé au 26 octobre 2026.</p>
          </Reveal>
          <Reveal className="br__figures">
            {figures.map((figure) => (
              <div className="br__figure" key={figure.label}>
                <Counter
                  value={figure.value}
                  padTo={'padTo' in figure ? figure.padTo : undefined}
                  suffix={'suffix' in figure ? figure.suffix : undefined}
                />
                <span>{figure.label}</span>
                <small>{figure.note}</small>
                <div className="br__gauge" aria-hidden="true">
                  <i style={{ width: `${Math.round(figure.gauge * 100)}%` }} />
                </div>
              </div>
            ))}
          </Reveal>
        </section>

        <section className="br__section br__light" id="br-resultats">
          <div className="br__wrap">
            <Reveal className="br__head">
              <h2>Derniers résultats</h2>
              <p>Saison 2026 — World Tour et circuit français.</p>
            </Reveal>
            <Reveal className="br__results">
              {results.map((result) => (
                <div className="br__result" key={`${result.date}-${result.opponent}`}>
                  <span className="br__result-date">{result.date}</span>
                  <span>
                    <span className="br__result-opp">{result.opponent}</span>
                    <br />
                    <span className="br__result-comp">{result.competition}</span>
                  </span>
                  <span className="br__result-score">{result.score}</span>
                  <span className="br__result-tag" data-win={result.win}>
                    {result.win ? 'Victoire' : 'Défaite'}
                  </span>
                </div>
              ))}
            </Reveal>
          </div>
        </section>

        <section className="br__section br__wrap" id="br-partenaires" aria-labelledby="br-part-t">
          <Reveal className="br__head">
            <h2 id="br-part-t">Partenaires</h2>
            <p>Quatre marques qui équipent l'équipe toute la saison.</p>
          </Reveal>
          <Reveal className="br__partners">
            {partners.map((partner) => (
              <div className="br__partner" key={partner.name}>
                <b>{partner.name}</b>
                <span>{partner.tier}</span>
              </div>
            ))}
          </Reveal>
        </section>
      </main>

      <footer className="br__footer br__wrap" id="br-contact">
        <div className="br__footer-in">
          <Reveal>
            <h2>
              Travailler <em>avec nous</em>
            </h2>
            <p className="br__hero-lede">
              Partenariat, essai joueur, demande presse : une adresse suffit, on répond sous 48 h.
            </p>
            <div className="br__hero-actions">
              <a className="br-key" href="mailto:contact@lignezero.gg">
                contact@lignezero.gg
              </a>
            </div>
          </Reveal>

          <Reveal className="br__socials" delay={120}>
            {socials.map((social) => (
              <a href={social.href} key={social.label}>
                {social.label}
                <span>{social.handle}</span>
              </a>
            ))}
          </Reveal>
        </div>

        <div className="br__legal br-label">
          <span>
            © {brand.founded}–2026 {brand.name}
          </span>
          <span>{brand.city}</span>
          <span>DA 02 — Béton brutalist rouge</span>
        </div>
      </footer>
    </div>
  );
}
