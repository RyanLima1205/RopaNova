import React from 'react'
import { View, Text, StyleSheet } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { brandColors, radii, spacing, typography } from '../../../../theme'

interface PromoSectionProps {
  promoText: string
  accentColor: string
}

/** ELITE seulement. Le parent (SectionRenderer) ne rend ce composant que si storefront.promoText existe. */
export function PromoSection({ promoText, accentColor }: PromoSectionProps) {
  return (
    <View style={styles.wrap}>
      <View style={[styles.banner, { borderColor: accentColor }]}>
        <Ionicons name="megaphone-outline" size={18} color={accentColor} />
        <Text style={styles.text}>{promoText}</Text>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  wrap: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    borderWidth: 1,
    borderRadius: radii.medium,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: brandColors.surface,
  },
  text: {
    flex: 1,
    fontFamily: typography.bodyMedium.fontFamily,
    fontSize: 13,
    color: brandColors.textPrimary,
  },
})
