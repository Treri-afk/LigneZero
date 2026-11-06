import { supabase } from './supabase';
import { uuid } from './uuid';

const BUCKET = 'media';

/**
 * Envoie une image dans le bucket public `media` et renvoie son URL.
 *
 * L'écriture est réservée aux comptes authentifiés (policy storage), et seul
 * l'admin atteint les pages qui appellent cette fonction.
 */
export async function uploadImage(file: File, folder: string): Promise<string> {
  const ext = file.name.split('.').pop()?.toLowerCase() || 'png';
  const path = `${folder}/${uuid()}.${ext}`;
  const { error } = await supabase.storage.from(BUCKET).upload(path, file, { upsert: false });
  if (error) throw new Error(`[storage] ${error.message}`);
  return supabase.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;
}
