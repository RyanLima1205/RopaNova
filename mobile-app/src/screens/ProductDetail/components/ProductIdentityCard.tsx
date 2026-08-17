import React from 'react'
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { brandColors, radii, spacing, typography } from '../../../theme'
import { formatPrice } from '../../../utils/formatters'
import { ProductBasicInfo, ProductPricing, SellerSummary } from '../../../types/product'

interface ProductIdentityCardProps {
  info: ProductBasicInfo
  pricing: ProductPricing
  seller: SellerSummary
  onSellerPress: () => void
}

/** *C'est mon style ? Combien ?* Composant signature de la fiche produit. */
export function ProductIdentityCard({ info, pricing, seller, onSellerPress }: ProductIdentityCardProps) {
  const chips = [info.brand, info.condition, info.material].filter(
    (value): value is string => !!value && value.trim() !== '',
  )

  const socialProofParts: string[] = []
  if (seller.reviewCount > 0) {
    socialProofParts.push(`⭐ ${seller.rating.toFixed(1)} (${seller.reviewCount})`)
  }

  return (
    <View style={styles.wrap}>
      <Text style={styles.title} numberOfLines={2}>
        {info.title}
      </Text>

      <View style={styles.priceRow}>
        <Text style={styles.price}>{formatPrice(pricing.price)}</Text>
        {pricing.originalPrice !== undefined && (
          <Text style={styles.originalPrice}>{formatPrice(pricing.originalPrice)}</Text>
        )}
        {pricing.discountPercent !== undefined && (
          <View style={styles.discountBadge}>
            <Text style={styles.discountText}>-{pricing.discountPercent}%</Text>
          </View>
        )}
      </View>

      <TouchableOpacity style={styles.socialProofRow} onPress={onSellerPress} activeOpacity={0.7}>
        {socialProofParts.map((part, index) => (
          <Text key={index} style={styles.socialProofText}>
            {index > 0 ? ' · ' : ''}
            {part}
          </Text>
        ))}
        <Text style={styles.socialProofText}>
          {socialProofParts.length > 0 ? ' · ' : ''}
          {seller.storeName}
        </Text>
        {seller.verified && (
          <Ionicons name="checkmark-circle" size={14} color={brandColors.primaryUI} style={styles.verifiedIcon} />
        )}
        {seller.city && <Text style={styles.socialProofText}> · {seller.city}</Text>}
      </TouchableOpacity>

      {chips.length > 0 && (
        <View style={styles.chipsRow}>
          {chips.map((chip, index) => (
            <View key={index} style={styles.chip}>
              <Text style={styles.chipText}>{chip}</Text>
            </View>
          ))}
        </View>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  wrap: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
  },
  title: {
    fontFamily: typography.screenTitle.fontFamily,
    fontSize: 18,
    color: brandColors.textPrimary,
    marginBottom: spacing.sm,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  price: {
    fontFamily: typography.screenTitle.fontFamily,
    fontSize: 28,
    color: brandColors.textPrimary,
  },
  originalPrice: {
    fontFamily: typography.body.fontFamily,
    fontSize: 16,
    color: brandColors.textSecondary,
    textDecorationLine: 'line-through',
  },
  discountBadge: {
    backgroundColor: brandColors.primaryLight,
    borderRadius: radii.small,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
  },
  discountText: {
    fontFamily: typography.bodyMedium.fontFamily,
    fontSize: 13,
    color: brandColors.primaryUI,
  },
  socialProofRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  socialProofText: {
    fontFamily: typography.body.fontFamily,
    fontSize: 13,
    color: brandColors.textSecondary,
  },
  verifiedIcon: {
    marginLeft: 3,
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  chip: {
    borderWidth: 1,
    borderColor: brandColors.border,
    borderRadius: radii.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  chipText: {
    fontFamily: typography.bodyMedium.fontFamily,
    fontSize: 12,
    color: brandColors.textPrimary,
  },
})
