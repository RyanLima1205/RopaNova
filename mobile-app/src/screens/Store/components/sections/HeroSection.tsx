import React from 'react'
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { SafeImage } from '../../../../components/SafeImage'
import { StorefrontHero } from '../../../../types/store'
import { brandColors, radii, spacing, typography } from '../../../../theme'

interface HeroSectionProps {
  hero: StorefrontHero
  accentColor: string
  onCtaPress?: () => void
}

/** ELITE seulement. Le parent (SectionRenderer) ne rend ce composant que si storefront.hero existe. */
export function HeroSection({ hero, accentColor, onCtaPress }: HeroSectionProps) {
  return (
    <View style={styles.wrap}>
      {hero.image && <SafeImage uri={hero.image} style={styles.image} fallbackText="" />}
      <View style={styles.overlay}>
        {hero.title && <Text style={styles.title}>{hero.title}</Text>}
        {hero.subtitle && <Text style={styles.subtitle}>{hero.subtitle}</Text>}
        {hero.ctaLabel && (
          <TouchableOpacity style={[styles.cta, { backgroundColor: accentColor }]} onPress={onCtaPress}>
            <Text style={styles.ctaText}>{hero.ctaLabel}</Text>
            <Ionicons name="arrow-forward" size={14} color={brandColors.white} />
          </TouchableOpacity>
        )}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  wrap: {
    width: '100%',
    minHeight: 200,
    backgroundColor: brandColors.textPrimary,
    justifyContent: 'flex-end',
  },
  image: {
    ...StyleSheet.absoluteFillObject,
  },
  overlay: {
    padding: spacing.lg,
    backgroundColor: 'rgba(17,24,39,0.35)',
  },
  title: {
    fontFamily: typography.screenTitle.fontFamily,
    fontSize: 22,
    color: brandColors.white,
  },
  subtitle: {
    fontFamily: typography.body.fontFamily,
    fontSize: 14,
    color: brandColors.white,
    marginTop: spacing.xs,
  },
  cta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    alignSelf: 'flex-start',
    borderRadius: radii.pill,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    marginTop: spacing.md,
  },
  ctaText: {
    fontFamily: typography.bodyMedium.fontFamily,
    fontSize: 13,
    color: brandColors.white,
  },
})
