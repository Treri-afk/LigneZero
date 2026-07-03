import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from '@/auth/AuthProvider';
import { LoginPage } from '@/auth/LoginPage';
import { Layout } from '@/components/Layout';
import { Spinner, Button } from '@/components/ui';
import { DashboardPage } from '@/pages/DashboardPage';
import { PlayerDashboard } from '@/pages/PlayerDashboard';
import { PlayersPage } from '@/pages/PlayersPage';
import { ResourcePage } from '@/resources/engine';
import { SocialStudioPage } from '@/pages/SocialStudioPage';
import { MyAvailabilityPage } from '@/pages/MyAvailabilityPage';
import { MyProfilePage } from '@/pages/MyProfilePage';
import { ObjectivesPage } from '@/pages/ObjectivesPage';
import { FeedbackPage } from '@/pages/FeedbackPage';
import { SessionsPage } from '@/pages/SessionsPage';
import { VideoReviewPage } from '@/pages/VideoReviewPage';
import { CalendarPage } from '@/pages/CalendarPage';
import { TeamAvailabilityPage } from '@/pages/TeamAvailabilityPage';
import { AnnouncementsPage } from '@/pages/AnnouncementsPage';
import { AccountsPage } from '@/pages/AccountsPage';
import { MatchHubPage } from '@/pages/MatchHubPage';
import { SponsorTrackingPage } from '@/pages/SponsorTrackingPage';
import { DesignRequestsPage } from '@/pages/DesignRequestsPage';
import { FinancePage } from '@/pages/FinancePage';
import { CandidatesPage } from '@/pages/CandidatesPage';
import { TryoutAvailabilityPage } from '@/pages/TryoutAvailabilityPage';
import { PublicTryoutFormPage } from '@/pages/PublicTryoutFormPage';
import { StratBoardPage } from '@/pages/StratBoardPage';
import { AgentsSettingsPage } from '@/pages/AgentsSettingsPage';
import {
  gamesConfig,
  staffConfig,
  sponsorsConfig,
  creatorsConfig,
  clipsConfig,
  productsConfig,
  stratsConfig,
  tryoutCampaignsConfig,
  valorantMapsConfig,
} from '@/resources/configs';

/** Écran "compte en attente de validation" (rôle member). */
function Pending() {
  const { signOut, refresh, profile } = useAuth();
  return (
    <div className="relative z-10 flex min-h-screen flex-col items-center justify-center gap-4 px-4 text-center">
      <p className="font-display text-3xl font-bold uppercase tracking-hud text-[color:var(--signal-warn)]">Compte en attente</p>
      <p className="max-w-sm font-mono text-sm text-[color:var(--text-dim)]">
        Bonjour {profile?.displayName}. Ton compte est créé mais un admin doit t'attribuer un rôle avant l'accès.
      </p>
      <div className="flex gap-3">
        <Button variant="ghost" onClick={() => refresh()}>↻ Vérifier</Button>
        <Button variant="ghost" onClick={() => signOut()}>Se déconnecter</Button>
      </div>
    </div>
  );
}

function Gate() {
  const { loading, session, isActive, isAdmin, isManager, isContent, isPerf, isEvaluator, role } = useAuth();

  if (loading) {
    return (
      <div className="relative z-10 flex min-h-screen items-center justify-center">
        <Spinner label="Vérification de la session…" />
      </div>
    );
  }
  if (!session) return <LoginPage />;
  if (!isActive) return <Pending />;

  return (
    <Layout>
      <Routes>
        <Route path="/" element={role === 'joueur' ? <PlayerDashboard /> : <DashboardPage />} />

        {/* Espace joueur */}
        <Route path="/me/dispos" element={<MyAvailabilityPage />} />
        <Route path="/me/profil" element={<MyProfilePage />} />

        {/* Performance */}
        <Route path="/objectifs" element={<ObjectivesPage />} />
        <Route path="/feedback" element={<FeedbackPage />} />
        <Route path="/sessions" element={<SessionsPage />} />
        <Route path="/dispos" element={<TeamAvailabilityPage />} />
        <Route path="/review" element={<VideoReviewPage />} />
        <Route path="/strats" element={<ResourcePage config={stratsConfig} canWrite={isPerf} />} />
        <Route path="/strats/:stratId/board" element={<StratBoardPage />} />
        <Route path="/tryouts" element={isEvaluator ? <CandidatesPage /> : <Navigate to="/" replace />} />
        <Route path="/tryouts/creneaux" element={isEvaluator ? <TryoutAvailabilityPage /> : <Navigate to="/" replace />} />
        <Route path="/tryouts/campagnes" element={isPerf ? <ResourcePage config={tryoutCampaignsConfig} canWrite={isPerf} /> : <Navigate to="/" replace />} />

        {/* Direction */}
        <Route path="/players" element={<PlayersPage />} />
        <Route path="/staff" element={<ResourcePage config={staffConfig} canWrite={isManager} />} />
        <Route path="/games" element={<ResourcePage config={gamesConfig} canWrite={isManager} />} />
        <Route path="/matches" element={<CalendarPage />} />
        <Route path="/matches/:matchId" element={<MatchHubPage />} />
        <Route path="/sponsors" element={<ResourcePage config={sponsorsConfig} canWrite={isManager} />} />
        <Route path="/suivi-sponsors" element={isManager ? <SponsorTrackingPage /> : <Navigate to="/" replace />} />
        <Route path="/annonces" element={<AnnouncementsPage />} />

        {/* Contenu */}
        <Route path="/social" element={<SocialStudioPage />} />
        <Route path="/design" element={<DesignRequestsPage />} />
        <Route path="/creators" element={<ResourcePage config={creatorsConfig} canWrite={isContent} />} />
        <Route path="/clips" element={<ResourcePage config={clipsConfig} canWrite={isContent} />} />
        <Route path="/products" element={<ResourcePage config={productsConfig} canWrite={isContent} />} />

        {/* Paramètres */}
        <Route path="/parametres/maps" element={<ResourcePage config={valorantMapsConfig} canWrite={isManager} />} />
        <Route path="/parametres/agents" element={<AgentsSettingsPage />} />

        {/* Admin */}
        <Route path="/finance" element={isAdmin ? <FinancePage /> : <Navigate to="/" replace />} />
        <Route path="/comptes" element={isAdmin ? <AccountsPage /> : <Navigate to="/" replace />} />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Layout>
  );
}

/** Espace authentifié (staff/joueurs) — tout ce qui vit derrière la connexion Supabase. */
function AuthedApp() {
  return (
    <AuthProvider>
      <Gate />
    </AuthProvider>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Formulaire public de dispo tryout : aucune auth, jamais sous AuthProvider/Gate. */}
        <Route path="/tryout/:token" element={<PublicTryoutFormPage />} />
        <Route path="/*" element={<AuthedApp />} />
      </Routes>
    </BrowserRouter>
  );
}
