import React from 'react'
import { View, Text, StyleSheet } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { brandColors, radii, spacing, typography } from '../../../theme'
import { ProductDelivery, ProductMarketing } from '../../../types/product'

interface TrustRowProps {
  marketing: ProductMarketing
  delivery: ProductDelivery
}

/** *Je peux faire confiance ?* Bloc confiance compact : Compra Protegida / Entrega / Devolución. */
export function TrustRow({ marketing, delivery }: TrustRowProps) {
  const hasDelivery = delivery.homeDelivery.available || delivery.storePickup.available || delivery.pickupPoint.available

  const items: { icon: keyof typeof Ionicons.glyphMap; label: string }[] = []
  if (marketing.protectedPurchase) {
    items.push({ icon: 'shield-checkmark-outline', label: 'Compra Protegida' })
  }
  if (hasDelivery) {
    items.push({ icon: 'cube-outline', label: 'Entrega disponible' })
  }
  items.push({ icon: 'arrow-undo-outline', label: marketing.returnPolicy || 'Según política de la tienda' })

  if (items.length === 0) return null

  return (
    <View style={styles.wrap}>
      {items.map((item, index) => (
        <View key={index} style={styles.item}>
          <View style={styles.iconCircle}>
            <Ionicons name={item.icon} size={18} color={brandColors.primaryUI} />
          </View>
          <Text style={styles.label} numberOfLines={2}>
            {item.label}
          </Text>
        </View>
      ))}
    </View>
  )
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
    gap: spacing.sm,
  },
  item: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: brandColors.surfaceSecondary,
    borderRadius: radii.medium,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xs,
  },
  iconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: brandColors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs,
  },
  label: {
    fontFamily: typography.caption.fontFamily,
    fontSize: 11,
    color: brandColors.textPrimary,
    textAlign: 'center',
  },
})
