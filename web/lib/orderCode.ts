/**
 * Código de pedido legible para el cliente (confirmación + soporte).
 * Prefijo RN para RopaNova; evita colisiones con timestamp + azar corto.
 */
export function generateOrderCode(): string {
  const ts = Date.now().toString(36).toUpperCase()
  const rand = Math.random().toString(36).slice(2, 6).toUpperCase()
  return `RN-${ts}-${rand}`
}
