import React from 'react'
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native'
import { brandColors, radii, spacing, typography } from '../../../theme'
import { ProductVariant } from '../../../types/product'

interface SizeSelectorProps {
  variants: ProductVariant[]
  selectedSize: string
  onSelect: (size: string) => void
}

/** Affiché uniquement si variants.length > 1 (décision du parent). */
export function SizeSelector({ variants, selectedSize, onSelect }: SizeSelectorProps) {
  return (
    <View style={styles.wrap}>
      <Text style={styles.title}>Selecciona tu talla</Text>
      <View style={styles.row}>
        {variants.map((variant) => {
          const isSelected = selectedSize === variant.size
          return (
            <TouchableOpacity
              key={variant.size}
              style={[styles.item, isSelected && styles.itemSelected, !variant.available && styles.itemDisabled]}
              onPress={() => variant.available && onSelect(variant.size)}
              disabled={!variant.available}
            >
              <Text
                style={[
                  styles.itemText,
                  isSelected && styles.itemTextSelected,
                  !variant.available && styles.itemTextDisabled,
                ]}
              >
                {variant.size}
              </Text>
            </TouchableOpacity>
          )
        })}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  wrap: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
  },
  title: {
    fontFamily: typography.sectionTitle.fontFamily,
    fontSize: 16,
    color: brandColors.textPrimary,
    marginBottom: spacing.md,
  },
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  item: {
    minWidth: 56,
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: radii.medium,
    borderWidth: 1,
    borderColor: brandColors.border,
    backgroundColor: brandColors.surface,
  },
  itemSelected: {
    backgroundColor: brandColors.primaryUI,
    borderColor: brandColors.primaryUI,
  },
  itemDisabled: {
    backgroundColor: brandColors.surfaceSecondary,
    borderColor: brandColors.border,
  },
  itemText: {
    fontFamily: typography.bodyMedium.fontFamily,
    fontSize: 14,
    color: brandColors.textPrimary,
  },
  itemTextSelected: {
    color: brandColors.white,
  },
  itemTextDisabled: {
    color: brandColors.textMuted,
    textDecorationLine: 'line-through',
  },
})
