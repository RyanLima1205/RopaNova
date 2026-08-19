import React from 'react'
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { StoreStats } from '../../../../types/store'
import { brandColors, radii, spacing, typography } from '../../../../theme'

interface ReviewsSectionProps {
  stats: StoreStats
  onViewAll: () => void
}

/**
 * PRO + ELITE. Le parent (SectionRenderer) ne rend ce composant que si stats.reviewCount > 0.
 * StoreDetail n'expose que des compteurs agrégés (pas la liste des avis) : c'est un résumé,
 * le détail vit dans l'écran SellerReviews existant.
 */
export function ReviewsSection({ stats, onViewAll }: ReviewsSectionProps) {
  return (
    <View style={styles.wrap}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>Reseñas</Text>
        <TouchableOpacity style={styles.viewAll} onPress={onViewAll}>
          <Text style={styles.viewAllText}>Ver todas</Text>
          <Ionicons name="chevron-forward" size={14} color={brandColors.primaryUI} />
        </TouchableOpacity>
      </View>
      <TouchableOpacity style={styles.card} onPress={onViewAll}>
        <View style={styles.ratingCircle}>
          <Text style={styles.ratingValue}>{stats.rating.toFixed(1)}</Text>
        </View>
        <View style={styles.info}>
          <View style={styles.stars}>
            {Array.from({ length: 5 }).map((_, index) => (
              <Ionicons
                key={index}
                name={index < Math.round(stats.rating) ? 'star' : 'star-outline'}
                size={14}
                color="#F59E0B"
              />
            ))}
          </View>
          <Text style={styles.count}>
            {stats.reviewCount} {stats.reviewCount === 1 ? 'reseña' : 'reseñas'}
          </Text>
        </View>
      </TouchableOpacity>
    </View>
  )
}

const styles = StyleSheet.create({
  wrap: {
    paddingVertical: spacing.lg,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.md,
  },
  title: {
    fontFamily: typography.sectionTitle.fontFamily,
    fontSize: 16,
    color: brandColors.textPrimary,
  },
  viewAll: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  viewAllText: {
    fontFamily: typography.bodyMedium.fontFamily,
    fontSize: 13,
    color: brandColors.primaryUI,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginHorizontal: spacing.lg,
    padding: spacing.lg,
    borderRadius: radii.card,
    backgroundColor: brandColors.surfaceSecondary,
  },
  ratingCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: brandColors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ratingValue: {
    fontFamily: typography.screenTitle.fontFamily,
    fontSize: 16,
    color: brandColors.textPrimary,
  },
  info: {
    gap: 2,
  },
  stars: {
    flexDirection: 'row',
    gap: 2,
  },
  count: {
    fontFamily: typography.caption.fontFamily,
    fontSize: 12,
    color: brandColors.textSecondary,
  },
})
