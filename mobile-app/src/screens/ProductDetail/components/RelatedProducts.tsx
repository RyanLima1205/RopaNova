import React from 'react'
import { View, Text, ScrollView, StyleSheet } from 'react-native'
import { ProductCard } from '../../../components/ProductCard'
import { spacing, brandColors, typography } from '../../../theme'

/** Forme minimale attendue par <ProductCard/> — alimentée par la Phase 4. */
export interface ProductCardData {
  id: string
  title: string
  price: string
  condition: string
  images: string[]
  createdAt: unknown
  category: string
  subcategory: string
  brand: string
  color: string[]
  talla?: string[]
}

interface RelatedProductsProps {
  products: ProductCardData[]
  onProductPress: (productId: string) => void
}

/** "También podría gustarte" — état vide propre : rien tant qu'il n'y a rien à montrer. */
export function RelatedProducts({ products, onProductPress }: RelatedProductsProps) {
  if (products.length === 0) return null

  return (
    <View style={styles.wrap}>
      <Text style={styles.title}>También podría gustarte</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
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

const CARD_WIDTH = 168

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
