import { socials } from '@/data/socials';
import { SoundToggle } from '@/components/ui/SoundToggle';
import { BrandLogo } from '@/components/ui/BrandLogo';
import { useBrand } from '@/data/DataProvider';

/** Footer HUD : réseaux, mentions, retour haut. */
export function Footer() {
  const year = new Date().getFullYear();
  const brand = useBrand();

  const toTop = () => window.scrollTo({ top: 0, behavior: 'smooth' });

  return (
    <footer className="relative mt-24 border-t border-line bg-base-900/80">
      <div className="h-px w-full bg-gradient-to-r from-transparent via-accent-2/40 to-transparent" />

      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
        <div className="flex flex-col gap-10 md:flex-row md:items-start md:justify-between">
          <div>
            <BrandLogo size="lg" />
            <p className="mt-2 max-w-xs font-mono text-xs leading-relaxed text-[color:var(--text-dim)]">
              &gt; {brand.tagline || 'Structure esport française. Streetwear / lifestyle.'}
            </p>
          </div>

          <div>
            <p className="hud-label mb-3 text-xs">[ Réseaux ]</p>
            <ul className="grid grid-cols-2 gap-x-8 gap-y-1.5">
              {socials.map((s) => (
                <li key={s.id}>
                  <a
                    href={s.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group inline-flex items-center gap-2 font-mono text-sm text-[color:var(--text-dim)] transition-colors duration-ui hover:text-accent"
                  >
                    <span className="text-accent opacity-0 transition-opacity group-hover:opacity-100">&gt;</span>
                    {s.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-12 flex flex-col items-start justify-between gap-4 border-t border-line pt-6 sm:flex-row sm:items-center">
          <p className="font-mono text-[10px] uppercase tracking-hud text-[color:var(--text-dim)]">
            © {year} {brand.name} — Tous droits réservés
          </p>
          <div className="flex items-center gap-5">
            <SoundToggle />
            <button
              type="button"
              onClick={toTop}
              className="font-mono text-[10px] uppercase tracking-hud text-accent transition-colors hover:text-[color:var(--text)]"
            >
              [ ↑ Retour haut ]
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
}
