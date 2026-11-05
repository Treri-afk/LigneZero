/**
 * Auto-modération légère : détecte liens non autorisés, majuscules excessives,
 * mots interdits. Retourne une raison (avertissement) ou null.
 *
 * Note : le bot averti dans le chat + journalise. Supprimer/timeout un message
 * nécessite les scopes moderator:manage:* (non requis ici) — à ajouter plus tard.
 */
const URL_RE = /(https?:\/\/|www\.|\.(gg|com|net|io|tv|fr)\/)/i;
const BANNED = ['arnaque', 'free follows', 'buy followers', 'viewers cheap'];

export interface ModVerdict { reason: string }

export function inspect(
  text: string,
  who: { isMod: boolean; isBroadcaster: boolean; isVip: boolean; isSubscriber: boolean },
): ModVerdict | null {
  if (who.isMod || who.isBroadcaster) return null; // staff exempté
  const lower = text.toLowerCase();

  if (BANNED.some((w) => lower.includes(w))) return { reason: 'message signalé (contenu interdit)' };

  if (!who.isVip && !who.isSubscriber && URL_RE.test(text)) return { reason: 'les liens ne sont pas autorisés' };

  const letters = text.replace(/[^a-zA-ZÀ-ÿ]/g, '');
  if (letters.length >= 12) {
    const caps = letters.replace(/[^A-ZÀ-Þ]/g, '').length;
    if (caps / letters.length > 0.7) return { reason: 'doucement sur les majuscules' };
  }
  return null;
}
