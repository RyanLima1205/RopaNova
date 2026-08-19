import React from 'react'
import { View, Text, ScrollView, StyleSheet } from 'react-native'
import { ProductCard } from '../../../../components/ProductCard'
import { ProductCardData } from '../../../ProductDetail/components/RelatedProducts'
import { brandColors, spacing, typography } from '../../../../theme'

interface FeaturedSectionProps {
  products: ProductCardData[]
  onProductPress: (productId: string) => void
}

const CARD_WIDTH = 168

/** PRO + ELITE. Le parent (SectionRenderer) ne rend ce composant que si products.length > 0. */
export function FeaturedSection({ products, onProductPress }: FeaturedSectionProps) {
  return (
    <View style={styles.wrap}>
      <Text style={styles.title}>Destacados</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.row}
        snapToInterval={CARD_WIDTH + spacing.sm}
        decelerationRate="fast"
      >
        {products.map((product) => (
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
