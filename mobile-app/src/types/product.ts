// ============================================================
// RopaNova — Modèle de la fiche produit (V1)
// Construit autour de l'EXPÉRIENCE D'ACHAT, pas du formulaire
// de publication. Toute donnée non affichée n'a pas sa place ici.
// ============================================================

export type AccountType = 'privado' | 'virtual' | 'fisica'

/** Résumé vendeur : la fiche produit ne doit JAMAIS aller chercher 25 champs. */
export interface SellerSummary {
  id: string
  storeName: string          // déjà résolu côté service (storeName ou "Prénom Nom")
  avatar: string
  verified: boolean
  accountType: AccountType
  rating: number             // 0–5
  reviewCount: number
  salesCount: number
  itemsCount: number
  responseRate: number       // 0–100
  responseTime: string       // "menos de 1 hora"
  memberSince: number        // année, ex: 2022
  city?: string
  province?: string
}

export interface DeliveryCity {
  name: string
  price: number | null       // null = "A coordinar"
}

export interface HomeDelivery {
  available: boolean
  cities: DeliveryCity[]
  startingPrice: number | null
  estimatedTime?: string     // "1–3 días"
}

export interface StorePickup {
  available: boolean
  city?: string
  address?: string
  note?: string              // "Acordar con el vendedor"
}

export interface PickupPoint {
  available: boolean
  price: number | null
  estimatedTime?: string
}

export interface ProductDelivery {
  homeDelivery: HomeDelivery
  storePickup: StorePickup
  pickupPoint: PickupPoint
  instructions?: string
}

/** Champs marketing : certains ne servent pas encore, ils sont là pour dans 6 mois. */
export interface ProductMarketing {
  protectedPurchase: boolean
  returnPolicy?: string      // "Devolución según política de la tienda"
  featured: boolean
  recommended: boolean
  newArrival: boolean
  bestSeller: boolean
  fastSelling: boolean
}

/** Compteurs dénormalisés — jamais calculés à la lecture. */
export interface ProductAnalytics {
  views: number
  likes: number
  cartAdds: number
  shares: number
  createdDaysAgo: number
}

export interface ProductVariant {
  size: string
  quantity: number
  available: boolean
}

export interface ProductPricing {
  price: number
  originalPrice?: number
  discountPercent?: number   // calculé côté service
  currency: 'DOP'
}

export interface ProductBasicInfo {
  id: string
  title: string
  description: string
  brand?: string
  category: string
  subcategory?: string
  material?: string
  color?: string
  condition: string          // conservé, mais affiché comme simple chip
  createdAt: string          // ISO
}

/** Le modèle consommé par l'UI. Un seul objet, prêt à afficher. */
export interface ProductDetail {
  info: ProductBasicInfo
  gallery: string[]
  pricing: ProductPricing
  variants: ProductVariant[]
  seller: SellerSummary
  delivery: ProductDelivery
  marketing: ProductMarketing
  analytics: ProductAnalytics
}
