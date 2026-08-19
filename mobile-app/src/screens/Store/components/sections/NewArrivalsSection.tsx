import React from 'react'
import { View, Text, ScrollView, StyleSheet } from 'react-native'
import { ProductCard } from '../../../../components/ProductCard'
import { ProductCardData } from '../../../ProductDetail/components/RelatedProducts'
import { brandColors, spacing, typography } from '../../../../theme'

interface NewArrivalsSectionProps {
  products: ProductCardData[]
  onProductPress: (productId: string) => void
}

const CARD_WIDTH = 168
const MAX_ITEMS = 10

/**
 * PRO + ELITE. Le switch de SectionRenderer ne garde pas cette section (contrairement à
 * FEATURED/COLLECTIONS/PROMO/REVIEWS) : c'est ce composant qui décide de ne rien afficher
 * s'il n'y a aucun produit, plutôt qu'un titre flottant au-dessus du vide.
 */
export function NewArrivalsSection({ products, onProductPress }: NewArrivalsSectionProps) {
  if (products.length === 0) return null

  const items = products.slice(0, MAX_ITEMS)

  return (
    <View style={styles.wrap}>
      <Text style={styles.title}>Recién llegados</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.row}
        snapToInterval={CARD_WIDTH + spacing.sm}
        decelerationRate="fast"
      >
        {items.map((product) => (
          <ProductCard
            key={product.id}
            product={product}
            onPress={() => onProductPress(product.id)}
            showRating={false}
            style={styles.card}
          />
        ))}
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  wrap: {
    paddingVertical: spacing.lg,
  },
  title: {
    fontFamily: typography.sectionTitle.fontFamily,
    fontSize: 16,
    color: brandColors.textPrimary,
    marginBottom: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  row: {
    paddingHorizontal: spacing.lg,
    gap: spacing.sm,
  },
  card: {
    width: CARD_WIDTH,
  },
})
