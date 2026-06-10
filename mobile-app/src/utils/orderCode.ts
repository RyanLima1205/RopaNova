/**
 * Code commande lisible par le client (ex. confirmation + support).
 * Préfixe RN pour RopaNova ; éviter les collisions avec segment temps + aléa court.
 */
export function generateOrderCode(): string {
  const ts = Date.now().toString(36).toUpperCase();
  const rand = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `RN-${ts}-${rand}`;
}
