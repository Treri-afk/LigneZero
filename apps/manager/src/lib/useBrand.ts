import { useEffect, useState } from 'react';
import type { BrandSettings } from '@lignezero/types';
import { DEFAULT_BRAND } from '@lignezero/types';
import { db } from '@/lib/supabase';

/**
 * Identité de marque pour l'habillage du manager (barre latérale, connexion,
 * tableau de bord).
 *
 * La table est en lecture publique : ça fonctionne donc AUSSI sur l'écran de
 * connexion, avant toute authentification. En cas d'échec réseau on garde les
 * valeurs par défaut plutôt que de bloquer l'écran.
 */
export function useBrand(): BrandSettings {
  const [brand, setBrand] = useState<BrandSettings>(DEFAULT_BRAND);
  useEffect(() => {
    let alive = true;
    db.getBrandSettings()
      .then((b) => alive && setBrand(b))
      .catch(() => {
        /* lecture non bloquante : on reste sur DEFAULT_BRAND */
      });
    return () => {
      alive = false;
    };
  }, []);
  return brand;
}
