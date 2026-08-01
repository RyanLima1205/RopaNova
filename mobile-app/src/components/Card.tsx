import React from 'react'
import { Pressable, StyleSheet, View, ViewStyle } from 'react-native'
import { brandColors, radii, shadows, spacing } from '../theme'

interface CardProps {
  children: React.ReactNode
  onPress?: () => void
  style?: ViewStyle
  padded?: boolean
}

export function Card({ children, onPress, style, padded = true }: CardProps) {
  const content = [styles.base, padded && styles.padded, style]

  if (onPress) {
    return (
      <Pressable onPress={onPress} style={content}>
        {children}
      </Pressable>
    )
  }

  return <View style={content}>{children}</View>
}

const styles = StyleSheet.create({
  base: {
    backgroundColor: brandColors.surface,
    borderRadius: radii.card,
    borderWidth: 1,
    borderColor: brandColors.border,
    ...shadows.card,
  },
  padded: {
    padding: spacing.lg,
  },
})
