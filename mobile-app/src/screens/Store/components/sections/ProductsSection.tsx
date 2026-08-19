import React from 'react'
import { View, Text, FlatList, ActivityIndicator, TouchableOpacity, Alert, StyleSheet } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { ProductCard } from '../../../../components/ProductCard'
import { EmptyState } from '../../../../components/EmptyState'
import { ProductCardData } from '../../../ProductDetail/components/RelatedProducts'
import { brandColors, radii, spacing, typography } from '../../../../theme'

interface ProductsSectionProps {
  products: ProductCardData[]
  loading: boolean
  reviewCount: number
  rating: number
  onProductPress: (productId: string) => void
}

const MAX_PREVIEW = 4

const handleViewAll = () => Alert.alert('Próximamente', 'Esta función estará disponible pronto.')

/**
 * Grille catalogue — tous les plans. Aperçu limité à MAX_PREVIEW produits ; le catalogue
 * complet vivra derrière "Ver todos los productos" (inactif en V1).
 */
export function ProductsSection({ products, loading, reviewCount, rating, onProductPress }: ProductsSectionProps) {
  const preview = products.slice(0, MAX_PREVIEW)

  return (
    <View style={styles.wrap}>
      <View style={styles.headerRow}>
        <View style={styles.headerLeft}>
          <Text style={styles.title}>Productos</Text>
          {reviewCount > 0 && (
            <View style={styles.stars}>
              {Array.from({ length: 5 }).map((_, index) => (
                <Ionicons
                  key={index}
                  name={index < Math.round(rating) ? 'star' : 'star-outline'}
                  size={12}
                  color="#F59E0B"
                />
              ))}
              <Text style={styles.reviewCount}>({reviewCount})</Text>
            </View>
          )}
        </View>
        <Text style={styles.count}>{products.length} artículos</Text>
      </View>

      {loading ? (
        <View style={styles.loadingBox}>
          <ActivityIndicator size="large" color={brandColors.primaryUI} />
        </View>
      ) : products.length === 0 ? (
        <EmptyState icon="bag-outline" title="No hay productos disponibles" subtitle="Todavía no se ha publicado nada aquí." />
      ) : (
        <>
          <FlatList
            data={preview}
            keyExtractor={(item) => item.id}
            numColumns={2}
            columnWrapperStyle={styles.row}
            scrollEnabled={false}
            renderItem={({ item }) => (
              <ProductCard product={item} onPress={() => onProductPress(item.id)} showRating={false} />
            )}
          />
          {products.length > MAX_PREVIEW && (
            <TouchableOpacity style={styles.viewAllButton} onPress={handleViewAll}>
              <Text style={styles.viewAllText}>Ver todos los productos</Text>
            </TouchableOpacity>
          )}
        </>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  wrap: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.lg,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
    paddingHorizontal: spacing.sm,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  title: {
    fontFamily: typography.sectionTitle.fontFamily,
    fontSize: 19,
    color: brandColors.textPrimary,
  },
  stars: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 1,
  },
  reviewCount: {
    fontFamily: typography.caption.fontFamily,
    fontSize: 11,
    color: brandColors.textSecondary,
    marginLeft: 2,
  },
  count: {
    fontFamily: typography.caption.fontFamily,
    fontSize: 12,
    color: brandColors.textSecondary,
  },
  row: {
    justifyContent: 'space-between',
  },
  loadingBox: {
    paddingVertical: spacing.section,
    alignItems: 'center',
  },
  viewAllButton: {
    backgroundColor: brandColors.surfaceSecondary,
    borderRadius: radii.medium,
    padding: spacing.md,
    marginTop: spacing.md,
    marginHorizontal: spacing.sm,
    alignItems: 'center',
  },
  viewAllText: {
    fontFamily: typography.bodyMedium.fontFamily,
    fontSize: 15,
    color: brandColors.primaryUI,
  },
})
