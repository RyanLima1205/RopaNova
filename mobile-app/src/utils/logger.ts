/**
 * Wrapper de logging (G0-8) : actif uniquement en dev (`__DEV__`).
 * Évite que des logs verbeux (PII, payloads Firestore) finissent dans les logs de prod.
 */
export const logger = {
  log: (...args: unknown[]) => {
    if (__DEV__) console.log(...args)
  },
  warn: (...args: unknown[]) => {
    if (__DEV__) console.warn(...args)
  },
  error: (...args: unknown[]) => {
    if (__DEV__) console.error(...args)
  },
}
