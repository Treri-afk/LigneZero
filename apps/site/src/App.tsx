import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { hiddenRoutes } from '@/lib/routes';
import { DataProvider } from '@/data/DataProvider';
import { AuthProvider } from '@/auth/AuthProvider';
import { Layout } from '@/components/layout/Layout';
import HomePage from '@/pages/HomePage';
// import TeamPage from '@/pages/TeamPage'; // page masquée — décommenter pour réactiver
// import StaffPage from '@/pages/StaffPage'; // page masquée — décommenter pour réactiver
// import GamesPage from '@/pages/GamesPage'; // page masquée — décommenter pour réactiver
// import SponsorsPage from '@/pages/SponsorsPage'; // page masquée — décommenter pour réactiver
// import SchedulePage from '@/pages/SchedulePage'; // page masquée — décommenter pour réactiver
// import ShopPage from '@/pages/ShopPage'; // page masquée — décommenter pour réactiver
import CommunityPage from '@/pages/CommunityPage';
import TournamentPage from '@/pages/TournamentPage';
import TournamentDetailPage from '@/pages/TournamentDetailPage';
import AdminTournamentsPage from '@/pages/admin/AdminTournamentsPage';
import AdminTournamentPage from '@/pages/admin/AdminTournamentPage';
import AccountPage from '@/pages/AccountPage';
import DemoPage from '@/pages/DemoPage';
import NotFound from '@/pages/NotFound';

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <DataProvider>
          <Routes>
          <Route element={<Layout />}>
            <Route index element={<HomePage />} />
            <Route path="tournoi" element={<TournamentPage />} />
            <Route path="communaute" element={<CommunityPage />} />
            <Route path="tournoi/:slug" element={<TournamentDetailPage />} />

            {/* Zone d'administration des tournois. Hors nav (routes.ts) :
                on y accède par l'URL. L'accès réel est garanti par les RLS
                `is_admin()`, AdminGuard n'est qu'un filtre d'interface. */}
            <Route path="admin/tournois" element={<AdminTournamentsPage />} />
            <Route path="admin/tournois/:slug" element={<AdminTournamentPage />} />
            <Route path="compte" element={<AccountPage />} />
            <Route path="demo" element={<DemoPage />} />

            {/* Pages MASQUÉES : le composant existe toujours (StaffPage,
                SponsorsPage, SchedulePage, ShopPage, GamesPage) mais n'est plus
                monté. On redirige au lieu de 404 pour que les anciennes URL et
                les liens partagés retombent sur l'accueil.
                Réactiver = remettre la <Route> d'origine + l'entrée dans
                lib/routes.ts. */}
            {hiddenRoutes.map((r) => (
              <Route key={r.path} path={r.path.slice(1)} element={<Navigate to="/" replace />} />
            ))}
            <Route path="jeux" element={<Navigate to="/" replace />} />

            <Route path="*" element={<NotFound />} />
          </Route>
          </Routes>
        </DataProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
