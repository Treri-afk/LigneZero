# LigneZero — monorepo (vitrine + esport manager)

Structure esport française (nom placeholder `__BRAND__`, à remplacer par
find-replace global avant mise en prod). **Monorepo npm workspaces** : deux
apps reliées par une seule DB Supabase.

```
LigneZero/
  apps/
    web/         NOUVELLE vitrine, repart de zéro (3 pages, DA en cours de choix)
    site/        ancienne vitrine + hub communautaire (R3F/GSAP) — archive
    manager/     webapp de gestion (CRUD authentifié staff) — ÉCRIT les données
  packages/
    types/       @lignezero/types — interfaces domaine (camelCase), source unique
    supabase/    @lignezero/supabase — client typé + types générés + mappers + requêtes
```

**Flux** : manager écrit → Supabase (source de vérité) → vitrine lit en live.
Auth unique (Supabase) séparée par rôle via RLS : `admin`/`staff` (écriture),
`member` (fan, lecture + profil commu), anonyme (lecture publique).

Projet Supabase : ref `hwhpxmrfwqgzhhrjfurd`, région eu-west-3 (Paris).
Schéma = miroir de `packages/types` ; snake_case en DB, mapping camelCase dans
`packages/supabase/src/mappers.ts`. Régénérer les types DB après migration :
`npx supabase gen types typescript --project-id hwhpxmrfwqgzhhrjfurd > packages/supabase/src/database.types.ts`.

Scripts racine : `npm run dev:web`, `npm run dev:site`, `npm run dev:manager`,
`npm run build:web`, `npm run build:site`, `npm run build:manager`.

**Chantier en cours (26/10/2026)** : `apps/site` et `apps/manager` sont jugés
trop complexes pour l'objectif (promouvoir la structure). On repart sur
`apps/web` : 3 pages, plus clair et plus carré. Voir
[apps/web/README.md](apps/web/README.md) pour le choix de direction artistique
en cours, et [.impeccable.md](.impeccable.md) pour le contexte design.

Tout ce qui suit décrit **apps/site** (le vitrine). Les chemins `src/...` sont
relatifs à `apps/site/`.

---

## Le vitrine (apps/site)

Site vitrine + hub communautaire. React + Vite + TypeScript, Tailwind, React
Three Fiber, GSAP, Lenis.

## Stack

- **Build** : Vite 5, TypeScript 5, `tsc && vite build`
- **UI** : React 18, React Router 6 (routes dans [src/lib/routes.ts](src/lib/routes.ts))
- **Style** : Tailwind (config pointe vers des CSS vars, voir Thème ci-dessous)
- **Anim** : GSAP + ScrollTrigger, Lenis (smooth scroll), Motion
- **3D** : React Three Fiber + drei + postprocessing (lazy-loadé, jamais dans le bundle principal)
- **Déploiement** : Netlify ([netlify.toml](netlify.toml)), SPA redirect vers `index.html`

## Démarrer

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # tsc + vite build
npm run preview
```

### Piège Windows connu

Sur ce poste, le réseau passe par un proxy d'inspection SSL d'entreprise :
`npm install` peut échouer avec `UNABLE_TO_VERIFY_LEAF_SIGNATURE` (le
certificat racine du proxy n'est pas dans le magasin de confiance de Node).
Si ça arrive, relancer avec le magasin de certs système plutôt que de
désactiver la vérification SSL :

```bash
NODE_OPTIONS="--use-system-ca" npm install
NODE_OPTIONS="--use-system-ca" npm run dev
```

Si `node_modules/.bin` est absent après un install qui semble avoir réussi
(bug npm connu avec les dépendances optionnelles de Rollup, cf.
https://github.com/npm/cli/issues/4828) : supprimer `node_modules` +
`package-lock.json` et refaire `npm install`.

## Direction artistique

**Béton brutalist + rouge signal.** PAS un thème néon cyberpunk classique :
surfaces matière (béton, grain, halftone), contraste clair/sombre franc,
ombres **dures** (offset solide type bande dessinée, jamais de glow flou).
Un seul accent : rouge `#f23127`. Le style HUD (équerres d'angle, labels
monospace, cutlines biseautées) sert l'esthétique "cockpit militaire /
data readout", pas l'esthétique "vaporwave synthwave".

Source de vérité du skin : [src/theme/tokens.css](src/theme/tokens.css)
(variables CSS) + miroir [src/theme/tokens.ts](src/theme/tokens.ts) (mêmes
valeurs en JS/hex pour le 3D et GSAP — **à garder synchro manuellement**).

- Bases charbon chaud (`--base-900` à `--base-600`) — pas de noir bleuté froid
- Surfaces claires béton/papier (`--concrete`, `--paper`) pour casser le tout-noir
- Accent unique rouge (`--accent`) + secondaire bone (`--accent-2`)
- Ombres brutalist : `--ink-shadow` (offset 7px, pas de blur)
- Cutlines biseautées via `clip-path` (`.cut-panel`, `.cut-panel-alt`), pas de `border-radius`

Classes utilitaires notables dans [src/styles/index.css](src/styles/index.css) :
`.hud-title` / `.hud-label` (typo), `.panel-concrete` / `.concrete` (texture
béton), `.hazard` (bandes de danger), `.glitch` (RGB split), `.holo-*`
(hologramme sponsor), `.tcg-*` (foil carte à collectionner), `.torn-left/right`
(bords papier déchiré), `.dot-grid`.

**Re-skin complet = éditer `tokens.css` uniquement, aucun composant à toucher.**

## Architecture

```
src/
  theme/       tokens (couleurs, fonts, durées) — source de vérité du skin
  types/       interfaces des données (src/types/index.ts)
  data/        contenu (joueurs, jeux, matchs, sponsors, staff, produits, socials)
  hooks/       useLenis, useReducedMotion, useScrollReveal, useCounter, usePointerParallax
  components/
    ui/        KeycapButton, CutPanel, HudFrame, MediaFrame, HudCursor, ThemeTweaker…
    animation/ PageTransition, BootSequence, GlitchText, TypeWriter, MarqueeTicker…
    layout/    Header (HUD sticky), Footer, Nav, Layout (coquille globale)
    3d/        Canvas3D, JerseyViewer, JerseyModel, PostFX — tout en lazy import
  sections/    blocs data-driven réutilisables (Hero, RosterGrid, SponsorWall…)
  pages/       une page par route (voir routes.ts)
  lib/         gsap.ts (plugins), lenis.ts, routes.ts, format.ts, sound.ts
```

Modèle de données 100% typé dans `src/types/index.ts`, pensé pour être
branché sur une API/Supabase plus tard sans toucher l'UI. Ajouter un
joueur/jeu/match/sponsor = une entrée dans `src/data/*.ts`, l'UI suit.

Alias `@/` → `src/` (voir [vite.config.ts](vite.config.ts) et [tsconfig.json](tsconfig.json)).

## Points d'attention

- **3D lazy-only** : `Canvas3D`/`JerseyViewer` s'importent dynamiquement,
  jamais en import statique dans une page — sinon `three` finit dans le
  chunk principal. Modèle attendu : `public/models/jersey.glb`.
- **`prefers-reduced-motion`** : respecté partout (durées à 0, animations
  désactivées) via `useReducedMotion()` et les media queries dans les CSS.
  Toute nouvelle anim GSAP/CSS doit avoir son fallback reduced-motion.
- **Son** : synthétisé via Web Audio (`src/lib/sound.ts`), pas de fichiers
  audio. Off par défaut, jamais joué si reduced-motion.
- **`ThemeTweaker`** (`src/components/ui/ThemeTweaker.tsx`) : overlay de dev
  pour ajuster les CSS vars en live — utile pour itérer sur la DA sans
  rebuild.

## État des phases

- [x] Phase 1 — Fondations (setup, tokens, thème, fonts, header/footer, routing)
- [x] Phase 2 — Système d'animation (PageTransition, Keycap, boot, hooks)
- [x] Phase 3 — Sections data-driven (Équipe, Staff, Jeux, Sponsors, Calendrier)
- [x] Phase 4 — 3D (viewer maillot configurable, postpro, lazy + fallback)
- [ ] Phase 5 — Responsive, a11y, perf, polish (+ hero canvas 3D optionnel)

La suite logique du projet est donc la Phase 5.
