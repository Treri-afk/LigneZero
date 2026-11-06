import { useDocTitle } from '@/hooks/useDocTitle';
// import { DepthDive } from '@/sections/DepthDive'; // intro retirée
import { Hero } from '@/sections/Hero';
import { About } from '@/sections/About';

export default function HomePage() {
  useDocTitle('Accueil');

  return (
    <>
      {/* Intro "depth dive" RETIRÉE : la page s'ouvre directement sur le Hero,
          sans auto-scroll ni séquence d'entrée. La section existe toujours
          (sections/DepthDive) si on veut la remettre. */}
      <div id="hub" />
      <Hero />

      {/* Présentation de la structure. Remplace l'ancienne grille de
          navigation (redondante avec le header) et le bloc "rejoins la commu"
          (la page Communauté n'existe plus à l'accès). */}
      <About />
    </>
  );
}
