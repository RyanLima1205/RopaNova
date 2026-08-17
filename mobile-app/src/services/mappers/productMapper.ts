// ============================================================
// RopaNova — Mapper Firestore brut → ProductDetail (V1)
// Pur, synchrone, sans import Firebase. Ne throw jamais :
// chaque champ absent reçoit une valeur par défaut sûre.
// Voir REFONTE_PRODUCT_PAGE.md, Phase 2, pour le tableau de mapping.
// ============================================================

import {
  AccountType,
  DeliveryCity,
  ProductBasicInfo,
  ProductDetail,
  ProductPricing,
  ProductVariant,
  SellerSummary,
} from '../../types/product'

/** Un seul slot vide : SafeImage l'affiche déjà comme « Sin Imagen ». */
const EMPTY_GALLERY: string[] = ['']

/** Jamais « aujourd'hui » par défaut : une date de création inconnue ne doit pas
 * se faire passer pour une fraîcheur inventée. */
const EPOCH_ISO = new Date(0).toISOString()

const isNonEmptyString = (value: unknown): value is string =>
  typeof value === 'string' && value.trim() !== ''

const toFiniteNumber = (value: unknown): number | undefined => {
  const n = typeof value === 'number' ? value : parseFloat(String(value))
  return Number.isFinite(n) ? n : undefined
}

/** precio de livraison : chaîne vide ou non numérique → null (« A coordinar »). */
const parseDeliveryPrice = (value: unknown): number | null => {
  const parsed = parseInt(String(value ?? ''), 10)
  return Number.isFinite(parsed) ? parsed : null
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

const daysSince = (isoDate: string): number => {
  const then = new Date(isoDate).getTime()
  if (!Number.isFinite(then)) return 0
  const diff = Date.now() - then
  return diff > 0 ? Math.floor(diff / (24 * 60 * 60 * 1000)) : 0
}

const normalizeAccountType = (value: unknown): AccountType => {
  if (value === 'virtual' || value === 'fisica' || value === 'privado') return value
  return 'privado'
}

/** Aligné sur `displaySellerTitle` (ProductDetailScreen.tsx / SellerProfileCard.tsx). */
const resolveStoreName = (sellerRaw: Record<string, unknown>, accountType: AccountType): string => {
  const storeName = typeof sellerRaw.storeName === 'string' ? sellerRaw.storeName.trim() : ''
  const hasStore = (accountType === 'virtual' || accountType === 'fisica') && storeName.length > 0
  if (hasStore) return storeName

  const name = typeof sellerRaw.name === 'string' ? sellerRaw.name : ''
  const lastname = typeof sellerRaw.lastname === 'string' ? sellerRaw.lastname : ''
  const joined = [name, lastname].filter(Boolean).join(' ').trim()
  return joined || 'Vendedor'
}

const mapInfo = (raw: Record<string, unknown>): ProductBasicInfo => {
  const rawColor = raw.color
  const color = Array.isArray(rawColor)
    ? rawColor.find(isNonEmptyString)
    : isNonEmptyString(rawColor)
      ? rawColor
      : undefined

  return {
    id: isNonEmptyString(raw.id) ? raw.id : '',
    title: (raw.titulo as string) || (raw.title as string) || '',
    description: (raw.descripcion as string) || (raw.description as string) || '',
    brand: (raw.marca as string) || (raw.brand as string) || undefined,
    category: (raw.categoria as string) || (raw.category as string) || '',
    subcategory: (raw.subcategoria as string) || (raw.subcategory as string) || undefined,
    material: (raw.material as string) || undefined,
    color,
    condition: (raw.condicionGeneral as string) || (raw.condicion as string) || (raw.condition as string) || '',
    createdAt: toIsoDate(raw.createdAt),
  }
}

const mapPricing = (raw: Record<string, unknown>): ProductPricing => {
  const price = toFiniteNumber(raw.precio) ?? toFiniteNumber(raw.price) ?? 0
  const originalPrice = toFiniteNumber(raw.precioOriginal) ?? toFiniteNumber(raw.originalPrice)
  const discountPercent =
    originalPrice !== undefined && originalPrice > price
      ? Math.round((1 - price / originalPrice) * 100)
      : undefined

  return {
    price,
    originalPrice,
    discountPercent,
    currency: 'DOP',
  }
}

const mapGallery = (raw: Record<string, unknown>): string[] => {
  const images = Array.isArray(raw.images) ? raw.images.filter(isNonEmptyString) : []
  if (images.length > 0) return images
  if (isNonEmptyString(raw.image)) return [raw.image]
  return EMPTY_GALLERY
}

const mapVariants = (raw: Record<string, unknown>): ProductVariant[] => {
  const stock = Array.isArray(raw.stock) ? raw.stock : []
  return stock
    .filter((item): item is Record<string, unknown> => item && typeof item === 'object')
    .map((item) => {
      const quantity = toFiniteNumber(item.cantidad) ?? 0
      return {
        size: (item.talla as string) || '',
        quantity,
        available: quantity > 0,
      }
    })
    .filter((variant) => isNonEmptyString(variant.size))
}

const mapSeller = (sellerRaw: Record<string, unknown>, userId: string): SellerSummary => {
  const accountType = normalizeAccountType(sellerRaw.accountType)
  const memberSinceIso = toIsoDate(sellerRaw.createdAt)
  // getUTCFullYear (pas getFullYear) : toIsoDate renvoie toujours de l'UTC,
  // et l'année ne doit pas dépendre du fuseau horaire de l'appareil.
  const memberSinceYear = new Date(memberSinceIso).getUTCFullYear()

  return {
    id: isNonEmptyString(userId) ? userId : '',
    storeName: resolveStoreName(sellerRaw, accountType),
    avatar: (sellerRaw.avatar as string) || '',
    verified: Boolean(sellerRaw.verified),
    accountType,
    rating: toFiniteNumber(sellerRaw.rating) ?? 0,
    reviewCount: toFiniteNumber(sellerRaw.reviewCount) ?? 0,
    salesCount: toFiniteNumber(sellerRaw.totalSales) ?? 0,
    itemsCount: toFiniteNumber(sellerRaw.itemsCount) ?? 0,
    responseRate: toFiniteNumber(sellerRaw.responseRate) ?? 0,
    responseTime: (sellerRaw.averageResponseTime as string) || (sellerRaw.responseTime as string) || '',
    // Année « inconnue » par défaut (1970) plutôt qu'une fraîcheur inventée ;
    // à l'UI (Phase 3+) de ne pas afficher « Miembro desde » si <= 1970.
    memberSince: memberSinceYear,
    city: (sellerRaw.city as string) || undefined,
    province: (sellerRaw.province as string) || undefined,
  }
}

const mapDeliveryCities = (raw: Record<string, unknown>): DeliveryCity[] => {
  const cities = Array.isArray(raw.ciudadesParaEnvioADomicilio) ? raw.ciudadesParaEnvioADomicilio : []
  return cities
    .filter((entry): entry is Record<string, unknown> => entry && typeof entry === 'object')
    .map((entry) => ({
      name: (entry.ciudad as string) || '',
      price: parseDeliveryPrice(entry.precio),
    }))
}

const mapDelivery = (raw: Record<string, unknown>): ProductDetail['delivery'] => {
  const tipoEntrega = (raw.tipoDeEntregaPermitida as Record<string, unknown>) || {}
  const cities = mapDeliveryCities(raw)
  const nonNullPrices = cities.map((c) => c.price).filter((p): p is number => p !== null)
  const startingPrice = nonNullPrices.length > 0 ? Math.min(...nonNullPrices) : null

  return {
    homeDelivery: {
      available: Boolean(tipoEntrega.envioADomicilio),
      cities,
      startingPrice,
    },
    storePickup: {
      available: Boolean(tipoEntrega.recogidaEnPersona),
      city: (raw.ciudadRecogidaEnPersona as string) || undefined,
    },
    pickupPoint: {
      available: Boolean(tipoEntrega.envioAPuntoDeRecogida),
      price: null,
    },
    instructions: (raw.instruccionesParaEntrega as string) || undefined,
  }
}

const mapMarketing = (raw: Record<string, unknown>): ProductDetail['marketing'] => ({
  // Compra Protegida : garantie par défaut en V1, indépendante des données du document.
  protectedPurchase: true,
  featured: Boolean(raw.featured),
  recommended: Boolean(raw.recommended),
  newArrival: Boolean(raw.newArrival),
  bestSeller: Boolean(raw.bestSeller),
  fastSelling: Boolean(raw.fastSelling),
})

const mapAnalytics = (raw: Record<string, unknown>, createdAtIso: string): ProductDetail['analytics'] => {
  const summary = (raw.productSummary as Record<string, unknown>) || {}
  return {
    views: toFiniteNumber(summary.views) ?? 0,
    likes: toFiniteNumber(summary.likes) ?? 0,
    cartAdds: toFiniteNumber(summary.cartAdds) ?? 0,
    shares: toFiniteNumber(summary.shares) ?? 0,
    createdDaysAgo: daysSince(createdAtIso),
  }
}

/**
 * Traduit un document Firestore brut `products/{id}` (+ le document brut
 * `users/{userId}` du vendeur) en `ProductDetail`, prêt pour l'UI.
 * `raw.id` doit être renseigné par l'appelant (l'id du document Firestore
 * n'est jamais présent dans `doc.data()`).
 */
export function mapToProductDetail(raw: unknown, sellerRaw: unknown): ProductDetail {
  const safeRaw = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>
  const safeSellerRaw = (sellerRaw && typeof sellerRaw === 'object' ? sellerRaw : {}) as Record<string, unknown>

  const info = mapInfo(safeRaw)

  return {
    info,
    gallery: mapGallery(safeRaw),
    pricing: mapPricing(safeRaw),
    variants: mapVariants(safeRaw),
    seller: mapSeller(safeSellerRaw, (safeRaw.userId as string) || ''),
    delivery: mapDelivery(safeRaw),
    marketing: mapMarketing(safeRaw),
    analytics: mapAnalytics(safeRaw, info.createdAt),
  }
}
