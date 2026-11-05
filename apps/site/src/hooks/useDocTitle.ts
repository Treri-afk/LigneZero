import { useEffect } from 'react';
import { useBrand } from '@/data/DataProvider';

/**
 * Pose le titre de l'onglet au format « <Marque> // <section> ».
 * Le nom vient de la base (page Identité du manager) : avant, chaque page
 * réécrivait `__BRAND__ // …` en dur, ce qui obligeait à repasser sur 7
 * fichiers pour renommer la structure.
 */
export function useDocTitle(section: string): void {
  const brand = useBrand();
  useEffect(() => {
    document.title = `${brand.name} // ${section}`;
  }, [brand.name, section]);
}
