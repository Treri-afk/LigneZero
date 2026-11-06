import { Outlet } from 'react-router-dom';
import { Header } from './Header';
import { Footer } from './Footer';
import { PageTransition } from '@/components/animation/PageTransition';
// import { BootSequence } from '@/components/animation/BootSequence'; // cinématique retirée
import { CockpitOverlay } from '@/components/ui/CockpitOverlay';
import { GrainOverlay } from '@/components/ui/GrainOverlay';
import { HudCursor } from '@/components/ui/HudCursor';
// import { LiveBar } from '@/components/ui/LiveBar'; // banderole live retirée
// import { LivePrediction } from '@/components/ui/LivePrediction'; // bloc pari retiré
// import { MatchMode } from '@/components/ui/MatchMode'; // habillage live retiré
import { ThemeTweaker } from '@/components/ui/ThemeTweaker';
import { useLenis } from '@/hooks/useLenis';

/** Coquille globale : smooth scroll + header + page + footer. */
export function Layout() {
  useLenis();

  return (
    <div className="flex min-h-dvh flex-col">
      {/* Écran de boot RETIRÉ : on entre directement sur le contenu.
          Le composant BootSequence existe toujours (components/animation) —
          remonter l'import + <BootSequence onComplete={…} /> le réactive. */}

      {/* Transitions de route (jouées dès la 1re navigation). */}
      <PageTransition />

      {/* Habillage HUD cockpit fixe (non interactif). */}
      <CockpitOverlay />

      {/* Grain film global (matière par-dessus tout). */}
      <GrainOverlay />

      {/* Curseur réticule HUD (desktop, pointeur fin). */}
      <HudCursor />

      {/* Tweaker de couleurs (overlay global). */}
      <ThemeTweaker />

      {/* Habillage live site-wide RETIRÉ (MatchMode). */}

      <Header />
      <main id="content" className="flex-1 pt-16">
        {/* Banderole LIVE RETIRÉE. Le composant LiveBar existe toujours —
            remonter l'import + <LiveBar /> ici la réactive. */}
        {/* Bloc prédiction/pari RETIRÉ (LivePrediction). */}
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}
