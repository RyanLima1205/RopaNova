import React from 'react'
import { View, Text, TouchableOpacity, Alert, StyleSheet } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { brandColors, radii, spacing, typography } from '../../../theme'

interface OwnerBarProps {
  visible: boolean
}

/** Visible seulement si isOwner. "Personalizar tienda" est inactif en V1 (V2 : dashboard web). */
export function OwnerBar({ visible }: OwnerBarProps) {
  if (!visible) return null

  const handleCustomize = () => {
    Alert.alert('Próximamente', 'La personalización de tienda estará disponible pronto.')
  }

  return (
    <View style={styles.wrap}>
      <View style={styles.previewBadge}>
        <Ionicons name="eye-outline" size={14} color={brandColors.primaryUI} />
        <Text style={styles.previewText}>Vista previa de tu tienda</Text>
      </View>
      <TouchableOpacity style={styles.customizeButton} onPress={handleCustomize}>
        <Ionicons name="color-palette-outline" size={14} color={brandColors.textSecondary} />
        <Text style={styles.customizeText}>Personalizar tienda</Text>
      </TouchableOpacity>
    </View>
  )
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    backgroundColor: brandColors.primaryLight,
    gap: spacing.sm,
  },
  previewBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  previewText: {
    fontFamily: typography.caption.fontFamily,
    fontSize: 12,
    color: brandColors.primaryUI,
  },
  customizeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radii.pill,
    backgroundColor: brandColors.surface,
    opacity: 0.8,
  },
  customizeText: {
    fontFamily: typography.caption.fontFamily,
    fontSize: 11,
    color: brandColors.textSecondary,
  },
})
