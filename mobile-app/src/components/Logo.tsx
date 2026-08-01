import React from 'react'
import { View, Text, StyleSheet } from 'react-native'
import Svg, { Path } from 'react-native-svg'
import { brandColors, fontFamilies } from '../theme'

const SIZES = {
  sm: { barW: 20, barH: 26, fontSize: 15, gap: 3, tagSize: 6, tagGap: 2 },
  md: { barW: 28, barH: 36, fontSize: 22, gap: 4, tagSize: 8, tagGap: 3 },
  lg: { barW: 36, barH: 46, fontSize: 30, gap: 5, tagSize: 10, tagGap: 4 },
} as const

type LogoSize = keyof typeof SIZES

interface LogoProps {
  /** 'horizontal' = marque complète ROPA|NOVA. 'icon' = les deux barres seules. */
  variant?: 'horizontal' | 'icon'
  size?: LogoSize
  /** Affiche la tagline "THE DIGITAL FASHION MALL" sous le logo (splash, login, onboarding). */
  tagline?: boolean
  /** Sur fond sombre/bleu : NOVA passe en blanc au lieu de noir. */
  onDark?: boolean
}

function Bars({ height, onDark }: { height: number; onDark?: boolean }) {
  const width = height * 0.78
  return (
    <Svg width={width} height={height} viewBox="0 0 40 62" style={{ marginRight: 2 }}>
      <Path d="M4 18 L18 8 L22 52 L8 62 Z" fill={onDark ? brandColors.white : brandColors.primary} />
      <Path d="M22 16 L36 6 L40 50 L26 60 Z" fill={onDark ? brandColors.white : brandColors.primary} />
    </Svg>
  )
}

export function Logo({ variant = 'horizontal', size = 'md', tagline = false, onDark = false }: LogoProps) {
  const s = SIZES[size]

  if (variant === 'icon') {
    return <Bars height={s.barH} onDark={onDark} />
  }

  return (
    <View style={styles.wrap}>
      <View style={styles.row}>
        <Bars height={s.barH} onDark={onDark} />
        <View style={[styles.ropaBox, { paddingHorizontal: s.gap * 2, paddingVertical: s.gap }]}>
          <Text style={[styles.ropaText, { fontSize: s.fontSize }]}>ROPA</Text>
        </View>
        <Text
          style={[
            styles.novaText,
            { fontSize: s.fontSize, marginLeft: s.gap, color: onDark ? brandColors.white : brandColors.black },
          ]}
        >
          NOVA
        </Text>
      </View>
      {tagline && (
        <Text
          style={[
            styles.tagline,
            {
              fontSize: s.tagSize,
              letterSpacing: s.tagGap,
              marginTop: s.gap,
              color: onDark ? brandColors.white : brandColors.primary,
            },
          ]}
        >
          THE DIGITAL FASHION MALL
        </Text>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ropaBox: {
    backgroundColor: brandColors.primary,
    borderRadius: 3,
  },
  ropaText: {
    fontFamily: fontFamilies.bebasNeue,
    color: brandColors.white,
    letterSpacing: 1,
  },
  novaText: {
    fontFamily: fontFamilies.bebasNeue,
    letterSpacing: 1,
  },
  tagline: {
    fontFamily: fontFamilies.montserratMedium,
    textAlign: 'center',
  },
})
