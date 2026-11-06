import '@fontsource-variable/archivo';
import '@fontsource/jetbrains-mono';
import './swiss.css';

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
  { label: 'Équipe', href: '#sw-equipe' },
  { label: 'Résultats', href: '#sw-resultats' },
  { label: 'Contact', href: '#sw-contact' },
];

const SECTIONS = [
  { id: 'sw-top', label: 'Ligne zéro' },
  { id: 'sw-equipe', label: 'Roster' },
  { id: 'sw-chiffres', label: 'Saison' },
  { id: 'sw-resultats', label: 'Résultats' },
  { id: 'sw-partenaires', label: 'Partenaires' },
  { id: 'sw-contact', label: 'Contact' },
];

/** Décompte en relevé : une seule ligne, chiffres à chasse fixe. */
function CountdownReadout() {
  const { days, hours, minutes, seconds, isLive } = useCountdown(nextMatch.date);

  if (isLive) {
    return (
      <p className="sw__count sw__count--live">
        <span className="sw__count-dot" aria-hidden="true" />
        En direct
      </p>
    );
  }

  return (
    <p className="sw__count" role="timer" aria-live="off">
      <span className="sw__count-key">J−{pad(days)}</span>
      <span className="sw__count-val">
        {pad(hours)}:{pad(minutes)}:{pad(seconds)}
      </span>
    </p>
  );
}

export function SwissHome() {
  const dial = useRosterDial(roster.length);
  const active = roster[dial.index];

  return (
    <div className="sw">
      <ScrollLine sections={SECTIONS} />
      <div className="sw__wrap">
        <div className="sw__reg">
          <span>{brand.name} ® — unité FR / 03</span>
          <span>The Finals · 3v3v3</span>
          <span>Saison 2026 — rev 02</span>
          <span>{brand.city}</span>
        </div>
      </div>

      <header className="sw__nav">
        <div className="sw__wrap sw__nav-in">
          <a className="sw__word" href="#sw-top">
            Lignezero<sup>®</sup>
          </a>
          <nav className="sw__links" aria-label="Navigation principale">
            {NAV.map((item) => (
              <a key={item.href} href={item.href}>
                {item.label}
              </a>
            ))}
          </nav>
          <a className="sw-btn" href="#sw-contact">
            Nous écrire
          </a>
        </div>
      </header>

      <main id="sw-top">
        <section className="sw__hero sw__wrap">
          <div className="sw__hero-grid">
            <Reveal>
              <h1>
                <span>Ligne</span>
                <span className="sw__hero-second">
                  Z<b>é</b>ro
                </span>
              </h1>
              <p className="sw__hero-lede sw-body">
                Structure esport française sur THE FINALS. Trois joueurs, un plan, zéro
                improvisation. Fondée en {brand.founded}, basée à {brand.city}.
              </p>
              <div className="sw__hero-actions">
                <a className="sw-btn" href="#sw-equipe">
                  Voir l'équipe
                </a>
                <a className="sw-btn sw-btn--ghost" href="#sw-resultats">
                  Résultats
                </a>
              </div>
            </Reveal>

            <Reveal delay={120}>
              <dl className="sw__dl">
                <div>
                  <dt>Fondation</dt>
                  <dd>{brand.founded}</dd>
                </div>
                <div>
                  <dt>Jeu</dt>
                  <dd>The Finals</dd>
                </div>
                <div>
                  <dt>Roster</dt>
                  <dd>03 joueurs</dd>
                </div>
                <div>
                  <dt>Base</dt>
                  <dd>{brand.city}</dd>
                </div>
                <div>
                  <dt>Réseaux</dt>
                  <dd>{brand.handle}</dd>
                </div>
              </dl>
            </Reveal>
          </div>

          <Reveal className="sw__next">
            <p className="sw__next-date">
              02.11
              <small>{nextMatch.timeLabel} CET</small>
            </p>
            <div className="sw__next-main">
              <p className="sw-meta">
                Prochain match — {nextMatch.competition} / {nextMatch.stage}
              </p>
              <h2>
                {brand.short} — {nextMatch.opponent}
              </h2>
            </div>
            <CountdownReadout />
          </Reveal>

          <div className="sw__ticker">
            <Ticker items={tickerItems} />
          </div>
        </section>

        <section className="sw__section sw__wrap" id="sw-equipe">
          <Reveal className="sw__head">
            <span className="sw__head-idx">[ 01 ]</span>
            <h2>Le roster</h2>
            <p className="sw-body">
              Un trio fixe depuis deux saisons. Chacun tient son rôle : la rotation reste lisible
              et les cashouts rapides.
            </p>
          </Reveal>

          <div className="sw__dial">
            <ol className="sw__index" ref={dial.listRef as React.RefObject<HTMLOListElement>} onKeyDown={dial.onKeyDown}>
              {roster.map((player, i) => (
                <li key={player.pseudo} data-active={i === dial.index}>
                  <button
                    type="button"
                    aria-pressed={i === dial.index}
                    onClick={() => dial.select(i)}
                    onMouseEnter={() => dial.select(i)}
                    onFocus={() => dial.select(i)}
                  >
                    <span className="sw__index-num">{player.number}</span>
                    <span className="sw__index-name">{player.pseudo}</span>
                    <span className="sw__index-build">{player.build}</span>
                  </button>
                </li>
              ))}
            </ol>

            <article className="sw__fiche" key={active.pseudo}>
              <div className="sw__fiche-top">
                <span>Fiche joueur</span>
                <span>
                  {active.number} / {String(roster.length).padStart(2, '0')}
                </span>
              </div>
              <div className="sw__fiche-body">
                <div className="sw__fiche-ph" aria-hidden="true">
                  <span className="sw__fiche-label">Img / {active.number}</span>
                  <span className="sw__fiche-num">{active.number}</span>
                </div>
                <div>
                  <h3>{active.pseudo}</h3>
                  <p className="sw-meta">{active.role}</p>
                  <dl className="sw__dl sw__fiche-specs">
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
              </div>
            </article>
          </div>
        </section>

        <section className="sw__section sw__wrap" id="sw-chiffres" aria-labelledby="sw-chiffres-t">
          <Reveal className="sw__head">
            <span className="sw__head-idx">[ 02 ]</span>
            <h2 id="sw-chiffres-t">La saison en chiffres</h2>
            <p className="sw-body">Relevé au 26 octobre 2026.</p>
          </Reveal>
          <Reveal className="sw__figures">
            {figures.map((figure) => (
              <div className="sw__figure" key={figure.label}>
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

        <section className="sw__section sw__wrap" id="sw-resultats">
          <Reveal className="sw__head">
            <span className="sw__head-idx">[ 03 ]</span>
            <h2>Derniers résultats</h2>
            <p className="sw-body">Saison 2026 — World Tour et circuit français.</p>
          </Reveal>
          <Reveal>
            <table className="sw__table">
              <thead>
                <tr>
                  <th scope="col">Date</th>
                  <th scope="col">Adversaire</th>
                  <th scope="col" className="sw__cell-comp">
                    Compétition
                  </th>
                  <th scope="col" className="sw__cell-score">
                    Score
                  </th>
                  <th scope="col" className="sw__cell-tag">
                    Issue
                  </th>
                </tr>
              </thead>
              <tbody>
                {results.map((result) => (
                  <tr key={`${result.date}-${result.opponent}`}>
                    <td>{result.date}</td>
                    <td className="sw__cell-opp">{result.opponent}</td>
                    <td className="sw__cell-comp">{result.competition}</td>
                    <td className="sw__cell-score">{result.score}</td>
                    <td className="sw__cell-tag" data-win={result.win}>
                      {result.win ? 'Victoire' : 'Défaite'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Reveal>
        </section>

        <section className="sw__section sw__wrap" id="sw-partenaires" aria-labelledby="sw-part-t">
          <Reveal className="sw__head">
            <span className="sw__head-idx">[ 04 ]</span>
            <h2 id="sw-part-t">Partenaires</h2>
            <p className="sw-body">Quatre marques qui équipent l'équipe toute la saison.</p>
          </Reveal>
          <Reveal className="sw__partners">
            {partners.map((partner) => (
              <div className="sw__partner" key={partner.name}>
                <b>{partner.name}</b>
                <span>{partner.tier}</span>
              </div>
            ))}
          </Reveal>
        </section>
      </main>

      <footer className="sw__footer" id="sw-contact">
        <div className="sw__wrap">
          <div className="sw__footer-in">
            <Reveal>
              <h2>
                Travailler <b>avec nous</b>
              </h2>
              <p className="sw__hero-lede sw-body">
                Partenariat, essai joueur, demande presse : une adresse suffit, on répond sous 48 h.
              </p>
              <div className="sw__hero-actions">
                <a className="sw-btn" href="mailto:contact@lignezero.gg">
                  contact@lignezero.gg
                </a>
              </div>
            </Reveal>

            <Reveal className="sw__socials" delay={120}>
              {socials.map((social) => (
                <a href={social.href} key={social.label}>
                  {social.label}
                  <span>{social.handle}</span>
                </a>
              ))}
            </Reveal>
          </div>

          <div className="sw__legal">
            <span>
              © {brand.founded}–2026 {brand.name} ®
            </span>
            <span>{brand.city}</span>
            <span>DA 03 — Swiss / grille stricte</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
