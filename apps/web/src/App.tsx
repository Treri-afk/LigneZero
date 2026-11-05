import { useEffect } from 'react';
import {
  HashRouter,
  Navigate,
  Route,
  Routes,
  useLocation,
  useNavigate,
} from 'react-router-dom';
import { DaSwitcher, DA_VARIANTS } from './components/DaSwitcher';
import { EditorialHome } from './da/editorial/Home';
import { BrutalistHome } from './da/brutalist/Home';
import { SwissHome } from './da/swiss/Home';

/** Raccourcis 1 / 2 / 3 pour comparer les DA sans quitter le clavier. */
function useVariantShortcuts() {
  const navigate = useNavigate();

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.metaKey || event.ctrlKey || event.altKey) return;
      const index = ['1', '2', '3'].indexOf(event.key);
      if (index === -1) return;
      navigate(DA_VARIANTS[index].path);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [navigate]);
}

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [pathname]);
  return null;
}

function Shell() {
  useVariantShortcuts();
  return (
    <>
      <ScrollToTop />
      <Routes>
        <Route path="/" element={<Navigate to="/editorial" replace />} />
        <Route path="/editorial" element={<EditorialHome />} />
        <Route path="/brutalist" element={<BrutalistHome />} />
        <Route path="/swiss" element={<SwissHome />} />
        <Route path="*" element={<Navigate to="/editorial" replace />} />
      </Routes>
      <DaSwitcher />
    </>
  );
}

export function App() {
  return (
    <HashRouter>
      <Shell />
    </HashRouter>
  );
}
