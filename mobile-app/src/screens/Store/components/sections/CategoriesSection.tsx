import React from 'react'
import { View, Text, ScrollView, StyleSheet } from 'react-native'
import { ProductCardData } from '../../../ProductDetail/components/RelatedProducts'
import { brandColors, radii, spacing, typography } from '../../../../theme'

interface CategoriesSectionProps {
  products: ProductCardData[]
}

/**
 * Catégories présentes dans le catalogue de la boutique — lecture seule (pas de filtre
 * interne au catalogue en V1). Comme pour NEW_ARRIVALS, le switch de SectionRenderer ne
 * garde pas cette section : elle décide elle-même de ne rien afficher si vide.
 */
export function CategoriesSection({ products }: CategoriesSectionProps) {
  const categories = Array.from(new Set(products.map((p) => p.category).filter((c) => c.trim() !== '')))

  if (categories.length === 0) return null

  return (
    <View style={styles.wrap}>
      <Text style={styles.title}>Categorías</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
        {categories.map((category) => (
          <View key={category} style={styles.chip}>
            <Text style={styles.chipText}>{category}</Text>
          </View>
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
  chip: {
    borderWidth: 1,
    borderColor: brandColors.border,
    borderRadius: radii.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: brandColors.surface,
  },
  chipText: {
    fontFamily: typography.bodyMedium.fontFamily,
    fontSize: 13,
    color: brandColors.textPrimary,
  },
})
