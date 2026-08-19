import React from 'react'
import { StoreDetail, SectionType } from '../../../../types/store'
import { ProductCardData } from '../../../ProductDetail/components/RelatedProducts'
import { InfoTab } from '../InfoTab'
import { HeroSection } from './HeroSection'
import { FeaturedSection } from './FeaturedSection'
import { CategoriesSection } from './CategoriesSection'
import { CollectionsSection } from './CollectionsSection'
import { NewArrivalsSection } from './NewArrivalsSection'
import { PromoSection } from './PromoSection'
import { ReviewsSection } from './ReviewsSection'
import { ProductsSection } from './ProductsSection'

interface SectionRendererProps {
  type: SectionType
  store: StoreDetail
  /** Catalogue complet (CATEGORIES, NEW_ARRIVALS, PRODUCTS). */
  products: ProductCardData[]
  /** Sous-ensemble du catalogue correspondant à storefront.featuredProductIds. */
  featuredProducts: ProductCardData[]
  productsLoading: boolean
  onProductPress: (productId: string) => void
  onViewAllReviews: () => void
  accentColor: string
}

/**
 * Seul endroit qui connaît la correspondance SectionType → composant (voir
 * REFONTE_STOREFRONT.md §3). Ajouter un type de section en V2 = ajouter un `case` ici.
 * `default: return null` : une section inconnue (venant d'une future version de l'app)
 * est ignorée proprement plutôt que de faire planter les clients plus anciens.
 */
export function SectionRenderer({
  type,
  store,
  products,
  featuredProducts,
  productsLoading,
  onProductPress,
  onViewAllReviews,
  accentColor,
}: SectionRendererProps) {
  const { storefront, stats, identity, delivery } = store

  switch (type) {
    case 'HERO':
      return storefront.hero ? <HeroSection hero={storefront.hero} accentColor={accentColor} /> : null
    case 'FEATURED':
      return featuredProducts.length ? (
        <FeaturedSection products={featuredProducts} onProductPress={onProductPress} />
      ) : null
    case 'CATEGORIES':
      return <CategoriesSection products={products} />
    case 'COLLECTIONS':
      return storefront.collections.length ? <CollectionsSection collections={storefront.collections} /> : null
    case 'NEW_ARRIVALS':
      return <NewArrivalsSection products={products} onProductPress={onProductPress} />
    case 'PROMO':
      return storefront.promoText ? (
        <PromoSection promoText={storefront.promoText} accentColor={accentColor} />
      ) : null
    case 'REVIEWS':
      return stats.reviewCount > 0 ? <ReviewsSection stats={stats} onViewAll={onViewAllReviews} /> : null
    case 'PRODUCTS':
      return (
        <ProductsSection
          products={products}
          loading={productsLoading}
          reviewCount={stats.reviewCount}
          rating={stats.rating}
          onProductPress={onProductPress}
        />
      )
    case 'INFO':
      return <InfoTab identity={identity} delivery={delivery} />
    default:
      return null
  }
}
