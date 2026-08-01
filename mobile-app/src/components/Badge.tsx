import React from 'react'
import { StyleSheet, Text, View } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { accountTypeColors, brandColors, radii, semanticColors, spacing, typography } from '../theme'

export type BadgeTone = 'success' | 'error' | 'warning' | 'info' | 'neutral' | 'virtualStore'

const TONES: Record<BadgeTone, { bg: string; text: string }> = {
  success: { bg: semanticColors.successBackground, text: semanticColors.success },
  error: { bg: semanticColors.errorBackground, text: semanticColors.error },
  warning: { bg: semanticColors.warningBackground, text: semanticColors.warning },
  info: { bg: semanticColors.infoBackground, text: semanticColors.info },
  neutral: { bg: brandColors.surfaceSecondary, text: brandColors.textSecondary },
  virtualStore: { bg: accountTypeColors.virtualStoreBackground, text: accountTypeColors.virtualStore },
}

interface BadgeProps {
  label: string
  tone?: BadgeTone
  icon?: keyof typeof Ionicons.glyphMap
}

export function Badge({ label, tone = 'neutral', icon }: BadgeProps) {
  const { bg, text } = TONES[tone]

  return (
    <View style={[styles.wrap, { backgroundColor: bg }]}>
      {icon && <Ionicons name={icon} size={12} color={text} style={styles.icon} />}
      <Text style={[styles.text, { color: text }]}>{label}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    borderRadius: radii.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  icon: {
    marginRight: 4,
  },
  text: {
    fontFamily: typography.caption.fontFamily,
    fontSize: typography.caption.fontSize,
  },
})
