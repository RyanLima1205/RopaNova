import React from 'react'
import { ActivityIndicator, Pressable, StyleSheet, Text, ViewStyle } from 'react-native'
import { brandColors, radii, typography } from '../theme'

interface ButtonProps {
  title: string
  onPress: () => void
  variant?: 'primary' | 'secondary'
  disabled?: boolean
  loading?: boolean
  fullWidth?: boolean
  style?: ViewStyle
}

export function Button({
  title,
  onPress,
  variant = 'primary',
  disabled = false,
  loading = false,
  fullWidth = true,
  style,
}: ButtonProps) {
  const isDisabled = disabled || loading

  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      style={({ pressed }) => [
        styles.base,
        fullWidth && styles.fullWidth,
        variant === 'primary' ? styles.primary : styles.secondary,
        pressed && !isDisabled && (variant === 'primary' ? styles.primaryPressed : styles.secondaryPressed),
        isDisabled && styles.disabled,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={variant === 'primary' && !isDisabled ? brandColors.white : brandColors.primaryUI} />
      ) : (
        <Text
          style={[
            styles.text,
            variant === 'primary' ? styles.primaryText : styles.secondaryText,
            isDisabled && styles.disabledText,
          ]}
        >
          {title}
        </Text>
      )}
    </Pressable>
  )
}

const styles = StyleSheet.create({
  base: {
    height: 52,
    borderRadius: radii.medium + 2,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  fullWidth: {
    width: '100%',
  },
  primary: {
    backgroundColor: brandColors.primaryUI,
  },
  primaryPressed: {
    backgroundColor: brandColors.primaryDark,
  },
  secondary: {
    backgroundColor: brandColors.white,
    borderWidth: 1.5,
    borderColor: brandColors.borderStrong,
  },
  secondaryPressed: {
    backgroundColor: brandColors.primaryExtraLight,
  },
  disabled: {
    backgroundColor: brandColors.border,
    borderWidth: 0,
  },
  text: {
    fontFamily: typography.button.fontFamily,
    fontSize: typography.button.fontSize,
    lineHeight: typography.button.lineHeight,
  },
  primaryText: {
    color: brandColors.white,
  },
  secondaryText: {
    color: brandColors.primaryUI,
  },
  disabledText: {
    color: brandColors.textMuted,
  },
})
