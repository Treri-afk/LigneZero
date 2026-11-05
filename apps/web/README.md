# @lignezero/web — vitrine (repart de zéro)

Nouvelle vitrine, volontairement courte : **3 pages** visées (Accueil, Équipe,
Contact). Objectif : mettre la structure en avant, rien d'autre.

Contexte design : [`.impeccable.md`](../../.impeccable.md) à la racine du repo.

## Lancer

```bash
npm run dev:web      # http://localhost:5175
npm run build:web
```

## Étape en cours — choisir la direction artistique

Le **même écran d'accueil** est décliné en trois DA. Même contenu, même
découpage de sections : seule la mise en scène change, donc la comparaison est
honnête.

| Route | DA | Parti pris |
|---|---|---|
| `/editorial` | **01 — Éditorial premium sombre** | Charbon chaud, typo condensée monumentale (Big Shoulders), contrepoint serif italique, grille asymétrique, photos en plage claire. |
| `/brutalist` | **02 — Béton brutalist rouge** | L'ADN maison dégraissé : Black Ops One, béton + papier, ombres dures sans flou, labels monospace, alternance clair/sombre franche. |
| `/swiss` | **03 — Swiss / grille stricte** | Papier non blanchi, Archivo Black en tracking négatif, tout compartimenté par des filets d'1px, demi-teinte sur les photos. |

Raccourcis clavier `1` / `2` / `3`, ou la barre en bas de l'écran.

Une fois la DA choisie : on garde son dossier `src/da/<nom>/`, on supprime les
deux autres et `src/components/DaSwitcher.tsx`, et on promeut ses tokens en
`src/theme/tokens.css`.

## Mécaniques signature (communes aux 3 DA)

Repères pris sur Vitality, Team Liquid, G2, Karmine Corp et Gentle Mates : chez
les gros, la page d'accueil est un **flux vivant** (prochain match en héros,
résultats en continu, filtres), et la boutique mange souvent le site. Ici on
garde le flux, on jette la boutique, et on ajoute ce que personne ne fait.

| Mécanique | Ce que ça fait | Pourquoi |
|---|---|---|
| **Ligne zéro** (`ScrollLine`) | Filet vertical qui traverse la page, se remplit au scroll, marque chaque section d'un cran et affiche son nom | Le nom de la structure rendu littéral : un fil conducteur, pas une déco. Personne d'autre ne fait ça. |
| **Compte à rebours vivant** (`useCountdown`) | J/H/M/S qui tournent vraiment, bascule automatique en état LIVE à l'heure du match, puis extinction | Une vitrine d'équipe doit avoir l'air branchée sur la saison, pas figée au dernier déploiement |
| **Cadran roster** (`useRosterDial`) | Un seul joueur ouvert à la fois, rotation automatique jusqu'à la première interaction, flèches au clavier | Trois joueurs : trois cartes identiques, c'est du remplissage. Un sélecteur donne de la place à chacun. |
| **Bandeau défilant** (`Ticker`) | Fil des résultats + prochaine échéance, pause au survol | Le réflexe « flux de diffusion » : ça bouge, donc l'équipe joue |
| **Chiffres animés** (`useCountUp`) | Les compteurs montent à l'entrée dans l'écran | Les stats se lisent comme une performance, pas comme un tableau |

Chaque DA interprète le cadran différemment, volontairement :

- **Éditorial** — panneaux horizontaux extensibles, le nom bascule à la verticale en veille.
- **Brutalist** — barres empilables façon interrupteurs, chevron qui pivote, ombre rouge sur l'actif.
- **Swiss** — répertoire : index numéroté à gauche, fiche détaillée à droite.

Tout est `transform`/`opacity`, `IntersectionObserver` plutôt qu'écouteur de
scroll, et neutralisé en `prefers-reduced-motion` (rotation auto coupée,
bandeau figé, compteurs posés à leur valeur finale).

## Structure

```
src/
  components/   Reveal, ScrollLine, Ticker, Counter, DaSwitcher (temporaire)
  data/         content.ts — contenu unique partagé par les 3 DA
  da/           une direction artistique = un dossier (Home.tsx + .css)
  hooks/        useReveal, useCountdown, useCountUp, useRosterDial
  styles/       reset.css — base commune, zéro décision esthétique
```

Les données sont statiques et typées, prêtes à brancher sur Supabase
(`packages/supabase`) sans toucher aux vues.

**Pas de photo dans l'app.** Tous les emplacements visuels (hero, portraits du
roster) sont des placeholders dessinés en CSS, propres à chaque DA : cadre,
hachures ou croix de repérage, numéro du joueur, mention « à venir ». Quand les
vrais visuels arriveront, on remplace le bloc placeholder par une image aux
mêmes dimensions.

## Choix techniques

- Pas de Tailwind : trois DA à l'opposé l'une de l'autre, du CSS écrit à la
  main par DA reste plus lisible qu'un fichier de config qui essaie de tenir
  les trois.
- Pas de 3D, pas de GSAP, pas de Lenis pour l'instant — on en remet si la DA
  retenue le réclame.
- Polices embarquées via `@fontsource` (aucun appel Google Fonts au runtime),
  chargées par DA.
