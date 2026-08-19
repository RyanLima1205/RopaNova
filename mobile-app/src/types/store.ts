// ============================================================
// RopaNova — Modèle Storefront (V1)
// La page boutique est un mini-site, pas un profil.
// ============================================================

export type StoreKind = 'store' | 'private'   // dérivé de accountType
export type StorePlan = 'start' | 'pro' | 'elite'
export type StoreTheme = 'minimal' | 'elegante' | 'streetwear' | 'luxury' | 'colorful'
export type StoreAccent = 'black' | 'blue' | 'beige' | 'green' | 'pink'
export type StoreFont = 'moderna' | 'elegante'

export type SectionType =
  | 'HERO'
  | 'FEATURED'
  | 'CATEGORIES'
  | 'COLLECTIONS'
  | 'NEW_ARRIVALS'
  | 'PROMO'
  | 'REVIEWS'
  | 'PRODUCTS'          // grille catalogue complète
  | 'INFO'               // onglet Info (à propos, livraison, réseaux) — voir SECTIONS_BY_PLAN

export interface StoreIdentity {
  id: string                 // = ownerId en V1 (voir 1.1)
  kind: StoreKind
  plan: StorePlan            // détermine storefront.sections — voir SECTIONS_BY_PLAN
  name: string               // storeName, ou "Prénom Nom" si privé
  username?: string          // @zarard — slug, unique, pour l'URL publique
  slug?: string              // Slug SEO depuis storeName pour URL longue publique.
  tagline?: string           // "Moda contemporánea para mujer y hombre"
  description?: string       // texte long, onglet Info
  logo: string
  cover?: string
  verified: boolean
  physicalStore: boolean     // accountType === 'fisica'
  city?: string
  province?: string
  memberSince: number
}

export interface StoreStats {
  rating: number
  reviewCount: number
  followerCount: number
  salesCount: number
  productCount: number
  responseRate: number
  responseTime: string
}

export interface StoreDelivery {
  homeDelivery: boolean
  storePickup: boolean
  pickupPoint: boolean
  returnPolicy?: string
}

export interface StoreSocials {
  instagram?: string
  whatsapp?: string
  tiktok?: string
  website?: string
}

/** Thème borné — voir 1.3. Aucune couleur de texte n'est configurable. */
export interface StorefrontTheme {
  preset: StoreTheme
  accent: StoreAccent
  font: StoreFont
}

export interface StorefrontHero {
  image?: string
  title?: string             // "NUEVA COLECCIÓN"
  subtitle?: string
  ctaLabel?: string          // "Ver colección"
  ctaCollectionId?: string
}

export interface StoreCollection {
  id: string
  title: string              // "Summer Essentials"
  cover?: string
  productCount: number
}

export interface Storefront {
  sections: SectionType[]    // ordre ET activation — voir 1.2
  theme: StorefrontTheme
  hero?: StorefrontHero
  featuredProductIds: string[]
  collections: StoreCollection[]
  promoText?: string
}

/** Objet unique consommé par StoreScreen. */
export interface StoreDetail {
  identity: StoreIdentity
  stats: StoreStats
  delivery: StoreDelivery
  socials: StoreSocials
  storefront: Storefront
  isOwner: boolean           // le visiteur est-il le propriétaire ?
}
