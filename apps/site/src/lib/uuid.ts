/**
 * Identifiant UUID v4, utilisable HORS contexte sécurisé.
 *
 * `crypto.randomUUID()` n'existe qu'en HTTPS ou sur localhost. Le site est
 * servi en HTTP simple sur le VPS : la fonction y est absente, et toute
 * génération d'arbre, de lobby ou d'upload plantait avec
 * « crypto.randomUUID is not a function ».
 *
 * `crypto.getRandomValues()`, lui, reste disponible hors contexte sécurisé :
 * on garde donc une source aléatoire solide, et on ne retombe sur Math.random
 * que si même elle manque.
 */
export function uuid(): string {
  const c = globalThis.crypto as Crypto | undefined;
  if (typeof c?.randomUUID === 'function') return c.randomUUID();

  const b = new Uint8Array(16);
  if (typeof c?.getRandomValues === 'function') {
    c.getRandomValues(b);
  } else {
    for (let i = 0; i < 16; i++) b[i] = Math.floor(Math.random() * 256);
  }
  b[6] = (b[6] & 0x0f) | 0x40; // version 4
  b[8] = (b[8] & 0x3f) | 0x80; // variante RFC 4122

  const h = Array.from(b, (x) => x.toString(16).padStart(2, '0')).join('');
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20)}`;
}
