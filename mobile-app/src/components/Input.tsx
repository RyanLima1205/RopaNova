import React, { useState } from 'react'
import { StyleSheet, Text, TextInput, TextInputProps, TouchableOpacity, View } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { brandColors, radii, semanticColors, spacing, typography } from '../theme'

interface InputProps extends TextInputProps {
  label?: string
  error?: string
  leftIcon?: keyof typeof Ionicons.glyphMap
  secureToggle?: boolean
}

export function Input({ label, error, leftIcon, secureToggle, secureTextEntry, style, ...rest }: InputProps) {
  const [focused, setFocused] = useState(false)
  const [hidden, setHidden] = useState(!!secureTextEntry)

  const borderColor = error ? semanticColors.error : focused ? brandColors.primaryUI : brandColors.border

  return (
    <View style={styles.wrap}>
      {label && <Text style={styles.label}>{label}</Text>}
      <View style={[styles.field, { borderColor }]}>
        {leftIcon && <Ionicons name={leftIcon} size={20} color={brandColors.textSecondary} style={styles.leftIcon} />}
        <TextInput
          style={[styles.input, style]}
          placeholderTextColor={brandColors.textMuted}
          secureTextEntry={secureToggle ? hidden : secureTextEntry}
          onFocus={(e) => {
            setFocused(true)
            rest.onFocus?.(e)
          }}
          onBlur={(e) => {
            setFocused(false)
            rest.onBlur?.(e)
          }}
          {...rest}
        />
        {secureToggle && (
          <TouchableOpacity onPress={() => setHidden((h) => !h)} hitSlop={8}>
            <Ionicons name={hidden ? 'eye-outline' : 'eye-off-outline'} size={20} color={brandColors.textSecondary} />
          </TouchableOpacity>
        )}
      </View>
      {error && <Text style={styles.error}>{error}</Text>}
    </View>
  )
}

const styles = StyleSheet.create({
  wrap: {
    marginBottom: spacing.lg,
  },
  label: {
    fontFamily: typography.bodyMedium.fontFamily,
    fontSize: typography.bodyMedium.fontSize,
    color: brandColors.textPrimary,
    marginBottom: spacing.xs,
  },
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 52,
    borderRadius: radii.medium + 2,
    borderWidth: 1.5,
    paddingHorizontal: spacing.lg,
    backgroundColor: brandColors.surface,
  },
  leftIcon: {
    marginRight: spacing.sm,
  },
  input: {
    flex: 1,
    fontFamily: typography.body.fontFamily,
    fontSize: typography.body.fontSize,
    color: brandColors.textPrimary,
    height: '100%',
  },
  error: {
    fontFamily: typography.caption.fontFamily,
    fontSize: typography.caption.fontSize,
    color: semanticColors.error,
    marginTop: spacing.xs,
  },
})
