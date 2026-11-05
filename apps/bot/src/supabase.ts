import { createClient } from '@supabase/supabase-js';
import type { Database } from '@lignezero/supabase';
import { env } from './env';

/**
 * Client Supabase à clé service_role : le bot tourne côté serveur et BYPASSE
 * la RLS (aucune session utilisateur). NE JAMAIS embarquer cette clé côté client.
 */
export const supa = createClient<Database>(env.supabaseUrl, env.supabaseServiceKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});
