import { PageHeader } from '@/components/layout/PageHeader';
import { RosterShowcase } from '@/sections/RosterShowcase';
import { PageBackdrop } from '@/components/animation/PageBackdrop';
import { useData } from '@/data/DataProvider';

export default function TeamPage() {
  const { players } = useData();
  return (
    <div className="relative">
      <PageBackdrop ghost="ROSTER" />
      <div className="relative z-10 mx-auto max-w-7xl px-4 py-16 sm:px-6">
        <PageHeader
          code="01"
          title="Équipe"
          subtitle="Trois joueurs, trois cartes. Survole-en une pour la redresser et déployer sa fiche."
          meta={
            <span className="hud-title text-5xl font-bold text-accent glow-text">
              {String(players.length).padStart(2, '0')}
            </span>
          }
        />
        <RosterShowcase />
      </div>
    </div>
  );
}
