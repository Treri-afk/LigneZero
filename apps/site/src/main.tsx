import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
// Fonts self-hostées (embarquées dans le build, zéro appel externe / RGPD-clean).
import '@fontsource/anton/400.css'; // display — condensée affiche
import '@fontsource/inter/400.css';
import '@fontsource/inter/500.css';
import '@fontsource/inter/600.css';
import '@fontsource/jetbrains-mono/400.css';
import '@fontsource/jetbrains-mono/500.css';
import '@fontsource/jetbrains-mono/700.css';
import App from './App';
import './styles/index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
