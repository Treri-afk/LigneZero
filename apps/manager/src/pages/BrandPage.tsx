import { useEffect, useState } from 'react';
import type { BrandSettings } from '@lignezero/types';
import { DEFAULT_BRAND } from '@lignezero/types';
import { db } from '@/lib/supabase';
import { ImageField } from '@/components/ImageField';
import { Button, Panel, Spinner } from '@/components/ui';

/**
 * Identité de marque — source unique du nom et des logos pour TOUTE la
 * plateforme (vitrine, studio réseaux, tickets). Remplace le placeholder
 * `__BRAND__` qui était codé en dur : plus besoin de recompiler pour changer
 * le nom, et le logo devient enfin possible.
 *
 * Les deux images vont dans le bucket public `media`, dossier `brand/`.
 */
export function BrandPage() {
  const [brand, setBrand] = useState<BrandSettings | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    db.getBrandSettings()
      .then(setBrand)
      .catch((e) => setError(e instanceof Error ? e.message : 'Erreur'));
  }, []);

  const set = <K extends keyof BrandSettings>(key: K, value: BrandSettings[K]) =>
    setBrand((b) => (b ? { ...b, [key]: value } : b));

  async function save() {
    if (!brand) return;
    if (!brand.name.trim()) {
      setError('Le nom est obligatoire.');
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await db.setBrandSettings({ ...brand, name: brand.name.trim(), shortName: brand.shortName.trim() || DEFAULT_BRAND.shortName });
      setMsg('Identité enregistrée — la vitrine se met à jour au prochain chargement.');
      setTimeout(() => setMsg(null), 4000);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur');
    } finally {
      setBusy(false);
    }
  }

  if (!brand) {
    return error ? <p className="font-mono text-sm text-accent">{error}</p> : <Spinner label="Chargement de l'identité" />;
  }

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-display text-3xl font-bold uppercase tracking-hud">Identité</h1>
        <p className="mt-1 max-w-2xl font-mono text-xs leading-relaxed text-[color:var(--text-mute)]">
          &gt; Nom et logos utilisés partout : vitrine, studio réseaux, tickets de match. Les
          champs vides retombent sur une valeur de secours, rien ne casse.
        </p>
      </header>

      <Panel title="Nom">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="label">Nom complet</label>
            <input className="field" value={brand.name} onChange={(e) => set('name', e.target.value)} placeholder="LIGNE ZERO" />
            <p className="mt-1 font-mono text-[10px] text-[color:var(--text-mute)]">Titres, pied de page, légendes réseaux.</p>
          </div>
          <div>
            <label className="label">Nom court</label>
            <input className="field" value={brand.shortName} onChange={(e) => set('shortName', e.target.value)} placeholder="LZ" />
            <p className="mt-1 font-mono text-[10px] text-[color:var(--text-mute)]">Espaces contraints, repli si aucun monogramme.</p>
          </div>
          <div className="sm:col-span-2">
            <label className="label">Tagline (optionnel)</label>
            <input className="field" value={brand.tagline ?? ''} onChange={(e) => set('tagline', e.target.value)} placeholder="Structure esport française" />
          </div>
          <div>
            <label className="label">Handle réseaux (sans @)</label>
            <input className="field" value={brand.handle ?? ''} onChange={(e) => set('handle', e.target.value)} placeholder="lignezero" />
          </div>
          <div>
            <label className="label">Couleur d'accent</label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                className="h-10 w-14 cursor-pointer border border-line-strong bg-transparent"
                value={brand.accent}
                onChange={(e) => set('accent', e.target.value)}
              />
              <input className="field flex-1" value={brand.accent} onChange={(e) => set('accent', e.target.value)} placeholder="#f23127" />
            </div>
          </div>
        </div>
      </Panel>

      <Panel title="Logos">
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          <div>
            <label className="label">Logo horizontal</label>
            <ImageField value={brand.logoUrl ?? ''} onChange={(url) => set('logoUrl', url || undefined)} folder="brand" />
            <p className="mt-2 font-mono text-[10px] leading-relaxed text-[color:var(--text-mute)]">
              Affiché dans l'en-tête et le pied de page du site. Absent → le nom s'affiche en typo
              display. PNG ou SVG à fond transparent recommandé.
            </p>
          </div>
          <div>
            <label className="label">Monogramme (carré)</label>
            <ImageField value={brand.markUrl ?? ''} onChange={(url) => set('markUrl', url || undefined)} folder="brand" />
            <p className="mt-2 font-mono text-[10px] leading-relaxed text-[color:var(--text-mute)]">
              Pastilles, badges et visuels réseaux au format carré. Absent → le nom court sert de
              repli.
            </p>
          </div>
        </div>
      </Panel>

      <Panel title="Aperçu">
        <div className="flex flex-wrap items-center gap-6 border border-line-strong bg-base-900 p-5">
          <div className="flex items-center gap-3">
            {brand.logoUrl ? (
              <img src={brand.logoUrl} alt={brand.name} className="max-h-10 max-w-[220px] object-contain" />
            ) : (
              <span className="font-display text-2xl font-bold uppercase tracking-hud">[ {brand.name} ]</span>
            )}
          </div>
          <div className="flex items-center gap-3">
            {brand.markUrl ? (
              <img src={brand.markUrl} alt="" className="h-10 w-10 object-contain" />
            ) : (
              <span
                className="flex h-10 w-10 items-center justify-center font-display text-sm font-bold"
                style={{ background: brand.accent, color: '#0d0d0b' }}
              >
                {brand.shortName}
              </span>
            )}
            <span className="font-mono text-[10px] uppercase tracking-hud text-[color:var(--text-mute)]">
              {brand.handle ? `@${brand.handle}` : 'aucun handle'}
            </span>
          </div>
        </div>
      </Panel>

      {error && <p className="border border-[color:var(--accent)] px-3 py-2 font-mono text-xs text-accent">{error}</p>}
      {msg && <p className="font-mono text-xs text-[color:var(--signal-ok,#5ad18a)]">{msg}</p>}

      <div className="flex justify-end">
        <Button onClick={save} disabled={busy}>{busy ? 'Enregistrement…' : 'Enregistrer'}</Button>
      </div>
    </div>
  );
}
