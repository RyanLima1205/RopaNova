import React from 'react'
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { brandColors, radii, spacing, typography } from '../../../theme'
import { formatPrice } from '../../../utils/formatters'

interface BottomPurchaseBarProps {
  price: number
  onChat: () => void
  onBuy: () => void
}

/** *Je l'achète ?* Fixe en bas d'écran. CTA "Comprar ahora" dominant, prix en sous-titre. */
export function BottomPurchaseBar({ price, onChat, onBuy }: BottomPurchaseBarProps) {
  return (
    <View style={styles.wrap}>
      <TouchableOpacity style={styles.chatButton} onPress={onChat}>
        <Ionicons name="chatbubble-outline" size={22} color={brandColors.primaryUI} />
      </TouchableOpacity>
      <TouchableOpacity style={styles.buyButton} onPress={onBuy} activeOpacity={0.85}>
        <Text style={styles.buyTitle}>Comprar ahora</Text>
        <Text style={styles.buySubtitle}>{formatPrice(price)}</Text>
      </TouchableOpacity>
    </View>
  )
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.lg,
    backgroundColor: brandColors.surface,
    borderTopWidth: 1,
    borderTopColor: brandColors.border,
  },
  chatButton: {
    width: 52,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: brandColors.surfaceSecondary,
    borderRadius: radii.medium,
  },
  buyButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: spacing.sm,
    backgroundColor: brandColors.primaryUI,
    borderRadius: radii.medium,
  },
  buyTitle: {
    fontFamily: typography.button.fontFamily,
    fontSize: 16,
    color: brandColors.white,
  },
  buySubtitle: {
    fontFamily: typography.caption.fontFamily,
    fontSize: 12,
    color: brandColors.primaryExtraLight,
    marginTop: 1,
  },
})
