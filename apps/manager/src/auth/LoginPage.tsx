import { useState, type FormEvent } from 'react';
import { useBrand } from '@/lib/useBrand';
import { useAuth } from '@/auth/AuthProvider';
import { Button } from '@/components/ui';

/** Écran d'authentification : connexion OU création de compte (auto-inscription). */
export function LoginPage() {
  const brand = useBrand();
  const { signIn, signUp } = useAuth();
  const [mode, setMode] = useState<'in' | 'up'>('in');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setInfo(null);
    const res = mode === 'in' ? await signIn(email, password) : await signUp(email, password, name);
    if (res.error) setError(res.error);
    else if (mode === 'up') setInfo('Compte créé. En attente de validation par un admin.');
    setBusy(false);
  }

  return (
    <div className="relative z-10 flex min-h-screen items-center justify-center px-4">
      <div className="panel w-full max-w-sm shadow-ink">
        <div className="border-b border-line-strong px-6 py-5">
          <p className="font-display text-xl font-bold uppercase tracking-hud">{brand.name}</p>
          <p className="hud-label text-[10px]">Console de gestion</p>
        </div>

        {/* onglets */}
        <div className="flex border-b border-line-strong">
          {(['in', 'up'] as const).map((m) => (
            <button
              key={m}
              onClick={() => { setMode(m); setError(null); setInfo(null); }}
              className={`flex-1 py-2.5 font-mono text-[11px] uppercase tracking-hud transition-colors ${
                mode === m ? 'bg-accent text-ink' : 'text-[color:var(--text-mute)] hover:text-[color:var(--text)]'
              }`}
            >
              {m === 'in' ? 'Connexion' : 'Créer un compte'}
            </button>
          ))}
        </div>

        <form onSubmit={onSubmit} className="space-y-4 p-6">
          {mode === 'up' && (
            <div>
              <label className="label" htmlFor="name">Nom / pseudo</label>
              <input id="name" className="field" value={name} onChange={(e) => setName(e.target.value)} required />
            </div>
          )}
          <div>
            <label className="label" htmlFor="email">Email</label>
            <input id="email" type="email" autoComplete="email" className="field" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
          <div>
            <label className="label" htmlFor="password">Mot de passe</label>
            <input id="password" type="password" autoComplete={mode === 'in' ? 'current-password' : 'new-password'} className="field" value={password} onChange={(e) => setPassword(e.target.value)} required />
          </div>
          {error && <p className="border border-[color:var(--accent)] px-3 py-2 font-mono text-xs text-accent">{error}</p>}
          {info && <p className="border border-line-strong px-3 py-2 font-mono text-xs text-[color:var(--signal-ok)]">{info}</p>}
          <Button type="submit" className="w-full" disabled={busy}>
            {busy ? '…' : mode === 'in' ? 'Se connecter' : 'Créer le compte'}
          </Button>
        </form>
      </div>
    </div>
  );
}
