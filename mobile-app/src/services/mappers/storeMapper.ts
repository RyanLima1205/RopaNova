// ============================================================
// RopaNova — Mapper Firestore brut → StoreDetail (V1)
// Pur, synchrone, sans import Firebase. Ne throw jamais :
// chaque champ absent reçoit une valeur par défaut sûre.
// Voir REFONTE_STOREFRONT.md, Phase 2, pour les règles de mapping.
// ============================================================

import {
  SectionType,
  StoreDelivery,
  StoreDetail,
  StoreIdentity,
  StoreKind,
  StorePlan,
  StoreSocials,
  StoreStats,
  Storefront,
} from '../../types/store'

/** Compteurs déjà calculés par storeService.ts (une requête chacun, hors du mapper). */
export interface StoreCounts {
  productCount: number
  followerCount: number
}

/** Jamais « aujourd'hui » par défaut : une date de création inconnue ne doit pas
 * se faire passer pour une fraîcheur inventée. */
const EPOCH_ISO = new Date(0).toISOString()

const isNonEmptyString = (value: unknown): value is string =>
  typeof value === 'string' && value.trim() !== ''

const toFiniteNumber = (value: unknown): number | undefined => {
  const n = typeof value === 'number' ? value : parseFloat(String(value))
  return Number.isFinite(n) ? n : undefined
}

/** Timestamp Firestore | Date | string | number | absent → ISO, toujours. */
const toIsoDate = (value: unknown): string => {
  try {
    if (!value) return EPOCH_ISO
    if (typeof value === 'object' && value !== null && 'toDate' in value && typeof (value as { toDate: unknown }).toDate === 'function') {
      const date = (value as { toDate: () => Date }).toDate()
      return isNaN(date.getTime()) ? EPOCH_ISO : date.toISOString()
    }
    if (typeof value === 'object' && value !== null && 'seconds' in value) {
      const date = new Date((value as { seconds: number }).seconds * 1000)
      return isNaN(date.getTime()) ? EPOCH_ISO : date.toISOString()
    }
    if (value instanceof Date) {
      return isNaN(value.getTime()) ? EPOCH_ISO : value.toISOString()
    }
    const date = new Date(value as string | number)
    return isNaN(date.getTime()) ? EPOCH_ISO : date.toISOString()
  } catch {
    return EPOCH_ISO
  }
}

/** Aligné sur `displaySellerTitle` / `sellerPublicProfileFromUserData` : storeName pour
 * une boutique (virtual/fisica), sinon "Prénom Nom", sinon "Vendedor". */
const resolveStoreName = (raw: Record<string, unknown>, kind: StoreKind): string => {
  const storeName = typeof raw.storeName === 'string' ? raw.storeName.trim() : ''
  if (kind === 'store' && storeName.length > 0) return storeName

  const name = typeof raw.name === 'string' ? raw.name : ''
  const lastname = typeof raw.lastname === 'string' ? raw.lastname : ''
  const joined = [name, lastname].filter(Boolean).join(' ').trim()
  return joined || 'Vendedor'
}

/**
 * minuscules, tirets, sans accents (á→a, ñ→n, é→e), sans caractères spéciaux,
 * tirets multiples fusionnés, tirets de début/fin retirés. Chaîne vide → undefined.
 */
export const slugify = (value: string): string | undefined => {
  const slug = value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // retire les diacritiques une fois décomposés (á → a + ´)
    .toLowerCase()
    .replace(/['’]/g, '') // apostrophes (droite/courbe) supprimées sans tiret ("Ryan's" -> "ryans")
    .replace(/[^a-z0-9]+/g, '-') // tout le reste (espaces, ponctuation...) → un seul tiret
    .replace(/^-+|-+$/g, '')

  return slug.length > 0 ? slug : undefined
}

/**
 * Un compte 'privado' ne peut jamais dépasser 'start', quelle que soit la valeur en
 * base (voir REFONTE_STOREFRONT.md, Phase 3). Toute valeur autre que 'pro'/'elite'
 * retombe sur 'start'.
 */
const resolvePlan = (raw: Record<string, unknown>, kind: StoreKind): StorePlan => {
  if (kind === 'private') return 'start'
  return raw.plan === 'pro' || raw.plan === 'elite' ? raw.plan : 'start'
}

const mapIdentity = (raw: Record<string, unknown>, userId: string, kind: StoreKind, plan: StorePlan): StoreIdentity => {
  const name = resolveStoreName(raw, kind)
  const storeName = typeof raw.storeName === 'string' ? raw.storeName.trim() : ''
  const memberSinceIso = toIsoDate(raw.createdAt)

  return {
    id: userId,
    kind,
    plan,
    name,
    // Déjà unique côté RegisterScreen — le mapper le lit tel quel, sans le régénérer
    // ni le nettoyer (les comptes anciens peuvent contenir un point).
    username: isNonEmptyString(raw.username) ? raw.username : undefined,
    slug: slugify(storeName || name),
    tagline: undefined, // pas de champ source aujourd'hui (voir REFONTE_STOREFRONT.md §1)
    description: isNonEmptyString(raw.bio) ? raw.bio : undefined,
    logo: isNonEmptyString(raw.avatar) ? raw.avatar : '',
    cover: isNonEmptyString(raw.coverImage) ? raw.coverImage : undefined,
    verified: Boolean(raw.verified),
    physicalStore: raw.accountType === 'fisica',
    city: isNonEmptyString(raw.city) ? raw.city : undefined,
    province: isNonEmptyString(raw.province) ? raw.province : undefined,
    // getUTCFullYear (pas getFullYear) : toIsoDate renvoie toujours de l'UTC, l'année ne
    // doit pas dépendre du fuseau horaire de l'appareil. 1970 = date inconnue (voir UI).
    memberSince: new Date(memberSinceIso).getUTCFullYear(),
  }
}

const mapStats = (raw: Record<string, unknown>, counts: StoreCounts): StoreStats => ({
  rating: toFiniteNumber(raw.rating) ?? 0,
  reviewCount: toFiniteNumber(raw.reviewCount) ?? 0,
  followerCount: toFiniteNumber(counts.followerCount) ?? 0,
  salesCount: toFiniteNumber(raw.totalSales) ?? 0,
  productCount: toFiniteNumber(counts.productCount) ?? 0,
  responseRate: toFiniteNumber(raw.responseRate) ?? 0,
  responseTime: (raw.averageResponseTime as string) || (raw.responseTime as string) || '',
})

/** Aucun champ source aujourd'hui sur `users/{id}` (voir REFONTE_STOREFRONT.md) —
 * defaults sûrs uniquement, rien n'est inventé. */
const mapDelivery = (): StoreDelivery => ({
  homeDelivery: false,
  storePickup: false,
  pickupPoint: false,
  returnPolicy: undefined,
})

/** Aucun champ source aujourd'hui sur `users/{id}`. */
const mapSocials = (): StoreSocials => ({
  instagram: undefined,
  whatsapp: undefined,
  tiktok: undefined,
  website: undefined,
})

/** Sections débloquées par palier — voir REFONTE_STOREFRONT.md §6. C'est le plan qui
 * dicte l'ORDRE (pas Firestore, pas le vendeur, pas en V1). */
export const SECTIONS_BY_PLAN: Record<StorePlan, SectionType[]> = {
  start: ['PRODUCTS', 'INFO'],
  pro: ['FEATURED', 'NEW_ARRIVALS', 'PRODUCTS', 'REVIEWS', 'INFO'],
  elite: ['HERO', 'FEATURED', 'COLLECTIONS', 'PROMO', 'NEW_ARRIVALS', 'PRODUCTS', 'REVIEWS', 'INFO'],
}

/**
 * Intersecte les sections demandées avec celles autorisées par le plan, dans l'ORDRE du
 * plan. En V1, aucune préférence vendeur n'existe encore côté Firestore (voir §1.2) :
 * `requestedSections` vaut donc toujours la liste complète du plan — l'intersection ne
 * retire rien aujourd'hui, mais le mécanisme est prêt pour la V2 (choix vendeur borné
 * par le palier, jamais l'inverse).
 */
const filterSectionsByPlan = (requestedSections: SectionType[], plan: StorePlan): SectionType[] => {
  const allowed = SECTIONS_BY_PLAN[plan]
  return allowed.filter((section) => requestedSections.includes(section))
}

/** Pas de HERO par défaut : aucune boutique n'a encore de storefront.hero renseigné
 * (pas de champ source), donc pas d'image → la section ne doit pas apparaître (et de
 * toute façon HERO n'existe que sur le palier 'elite'). */
const mapStorefront = (plan: StorePlan): Storefront => ({
  sections: filterSectionsByPlan(SECTIONS_BY_PLAN[plan], plan),
  theme: { preset: 'minimal', accent: 'blue', font: 'moderna' },
  hero: undefined,
  featuredProductIds: [],
  collections: [],
  promoText: undefined,
})

/**
 * Traduit un document Firestore brut `users/{userId}` en `StoreDetail`, prêt pour l'UI.
 * `counts` (productCount, followerCount) est calculé par `storeService.ts` avant l'appel —
 * le mapper reste pur et ne fait aucune requête.
 */
export function mapToStoreDetail(
  userRaw: unknown,
  userId: string,
  viewerId: string,
  counts: StoreCounts,
): StoreDetail {
  const safeRaw = (userRaw && typeof userRaw === 'object' ? userRaw : {}) as Record<string, unknown>
  const safeUserId = isNonEmptyString(userId) ? userId : ''
  const kind: StoreKind = safeRaw.accountType === 'virtual' || safeRaw.accountType === 'fisica' ? 'store' : 'private'
  const plan = resolvePlan(safeRaw, kind)

  return {
    identity: mapIdentity(safeRaw, safeUserId, kind, plan),
    stats: mapStats(safeRaw, counts),
    delivery: mapDelivery(),
    socials: mapSocials(),
    storefront: mapStorefront(plan),
    isOwner: safeUserId.length > 0 && viewerId === safeUserId,
  }
}
