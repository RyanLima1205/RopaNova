import React from 'react'
import { Pressable, StyleSheet, ViewStyle } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { brandColors, iconSizes, shadows } from '../theme'

interface IconButtonProps {
  name: keyof typeof Ionicons.glyphMap
  onPress: () => void
  /** 'surface' = cercle blanc avec ombre (favoris, édition). 'ghost' = icône seule, sans fond (header). */
  variant?: 'surface' | 'ghost'
  color?: string
  size?: number
  style?: ViewStyle
}

export function IconButton({
  name,
  onPress,
  variant = 'surface',
  color = brandColors.textPrimary,
  size = iconSizes.action,
  style,
}: IconButtonProps) {
  return (
    <Pressable
      onPress={onPress}
      hitSlop={8}
      style={({ pressed }) => [
        variant === 'surface' && styles.surface,
        pressed && { opacity: 0.7 },
        style,
      ]}
    >
      <Ionicons name={name} size={size} color={color} />
    </Pressable>
  )
}

const styles = StyleSheet.create({
  surface: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: brandColors.white,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.card,
  },
})
