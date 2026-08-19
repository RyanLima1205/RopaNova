import React, { useEffect, useRef } from 'react'
import { Animated, StyleSheet, View, ViewStyle } from 'react-native'
import { brandColors, radii, spacing } from '../../../theme'

const PULSE_DURATION = 600 // aller-retour 0.3 ↔ 0.7 = 1200 ms par cycle
const GALLERY_HEIGHT = 380

interface SkeletonBlockProps {
  opacity: Animated.Value
  width: number | `${number}%`
  height: number
  borderRadius?: number
  style?: ViewStyle
}

function SkeletonBlock({ opacity, width, height, borderRadius = radii.small, style }: SkeletonBlockProps) {
  return (
    <Animated.View
      style={[{ width, height, borderRadius, backgroundColor: brandColors.surfaceSecondary, opacity }, style]}
    />
  )
}

/** Remplace le spinner pendant le chargement — mêmes proportions que la fiche produit réelle. */
export function ProductDetailSkeleton() {
  const opacity = useRef(new Animated.Value(0.3)).current

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 0.7, duration: PULSE_DURATION, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.3, duration: PULSE_DURATION, useNativeDriver: true }),
      ]),
    )
    loop.start()
    return () => loop.stop()
  }, [opacity])

  return (
    <View style={styles.wrap}>
      <SkeletonBlock opacity={opacity} width="100%" height={GALLERY_HEIGHT} borderRadius={0} />

      <View style={styles.body}>
        <SkeletonBlock opacity={opacity} width="80%" height={22} style={styles.spacer} />
        <SkeletonBlock opacity={opacity} width="45%" height={30} style={styles.spacer} />

        <SkeletonBlock opacity={opacity} width="100%" height={72} borderRadius={radii.medium} style={styles.block} />
        <SkeletonBlock opacity={opacity} width="100%" height={90} borderRadius={radii.medium} style={styles.block} />
        <SkeletonBlock opacity={opacity} width="100%" height={110} borderRadius={radii.card} style={styles.block} />
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  wrap: {
    flex: 1,
    backgroundColor: brandColors.surface,
  },
  body: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
  },
  spacer: {
    marginBottom: spacing.md,
  },
  block: {
    marginTop: spacing.lg,
  },
})
