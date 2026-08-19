import React, { useRef } from 'react'
import { View, Text, TouchableOpacity, Pressable, Animated, StyleSheet } from 'react-native'
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
  const scale = useRef(new Animated.Value(1)).current

  const handlePressIn = () => {
    Animated.spring(scale, { toValue: 0.97, useNativeDriver: true }).start()
  }

  const handlePressOut = () => {
    Animated.spring(scale, { toValue: 1, useNativeDriver: true }).start()
  }

  return (
    <View style={styles.wrap}>
      <TouchableOpacity style={styles.chatButton} onPress={onChat}>
        <Ionicons name="chatbubble-outline" size={22} color={brandColors.primaryUI} />
      </TouchableOpacity>
      <Pressable style={styles.buyButton} onPress={onBuy} onPressIn={handlePressIn} onPressOut={handlePressOut}>
        <Animated.View style={[styles.buyContent, { transform: [{ scale }] }]}>
          <Text style={styles.buyTitle}>Comprar ahora</Text>
          <Text style={styles.buySubtitle}>{formatPrice(price)}</Text>
        </Animated.View>
      </Pressable>
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
    paddingVertical: spacing.sm,
    backgroundColor: brandColors.primaryUI,
    borderRadius: radii.medium,
    overflow: 'hidden',
  },
  buyContent: {
    alignItems: 'center',
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
