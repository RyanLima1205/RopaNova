import React, { useEffect, useRef, useState } from 'react'
import { View, Text, TouchableOpacity, Animated, LayoutAnimation, Platform, UIManager, StyleSheet } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { brandColors, spacing, typography } from '../../../theme'
import { ProductBasicInfo } from '../../../types/product'

if (Platform.OS === 'android') {
  UIManager.setLayoutAnimationEnabledExperimental?.(true)
}

interface ProductDetailsAccordionProps {
  info: ProductBasicInfo
}

const formatCreatedAt = (isoDate: string): string => {
  const date = new Date(isoDate)
  if (isNaN(date.getTime()) || date.getTime() === 0) return ''
  return date.toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' })
}

/** "Detalles", replié par défaut. */
export function ProductDetailsAccordion({ info }: ProductDetailsAccordionProps) {
  const [open, setOpen] = useState(false)
  const rotation = useRef(new Animated.Value(0)).current
  const publishedLabel = formatCreatedAt(info.createdAt)

  useEffect(() => {
    Animated.timing(rotation, { toValue: open ? 1 : 0, duration: 250, useNativeDriver: true }).start()
  }, [open, rotation])

  const rows: { icon: keyof typeof Ionicons.glyphMap; label: string; value: string }[] = [
    { icon: 'pricetag-outline' as const, label: 'Categoría', value: info.category },
    ...(info.subcategory ? [{ icon: 'shirt-outline' as const, label: 'Tipo', value: info.subcategory }] : []),
    ...(info.material ? [{ icon: 'water-outline' as const, label: 'Material', value: info.material }] : []),
    ...(info.color ? [{ icon: 'color-palette-outline' as const, label: 'Color', value: info.color }] : []),
    { icon: 'checkmark-circle-outline' as const, label: 'Condición', value: info.condition },
    ...(publishedLabel ? [{ icon: 'calendar-outline' as const, label: 'Publicado', value: publishedLabel }] : []),
  ].filter((row) => row.value)

  if (rows.length === 0) return null

  const toggleOpen = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut)
    setOpen((value) => !value)
  }

  const arrowStyle = {
    transform: [
      {
        rotate: rotation.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '180deg'] }),
      },
    ],
  }

  return (
    <View style={styles.wrap}>
      <TouchableOpacity style={styles.header} onPress={toggleOpen}>
        <Text style={styles.title}>Detalles</Text>
        <Animated.View style={arrowStyle}>
          <Ionicons name="chevron-down" size={18} color={brandColors.textSecondary} />
        </Animated.View>
      </TouchableOpacity>
      {open && (
        <View style={styles.list}>
          {rows.map((row) => (
            <View key={row.label} style={styles.row}>
              <View style={styles.rowLabelGroup}>
                <Ionicons name={row.icon} size={16} color={brandColors.textSecondary} />
                <Text style={styles.rowLabel}>{row.label}</Text>
              </View>
              <Text style={styles.rowValue}>{row.value}</Text>
            </View>
          ))}
        </View>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  wrap: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: {
    fontFamily: typography.sectionTitle.fontFamily,
    fontSize: 16,
    color: brandColors.textPrimary,
  },
  list: {
    marginTop: spacing.md,
    gap: spacing.sm,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  rowLabelGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  rowLabel: {
    fontFamily: typography.body.fontFamily,
    fontSize: 13,
    color: brandColors.textSecondary,
  },
  rowValue: {
    fontFamily: typography.bodyMedium.fontFamily,
    fontSize: 13,
    color: brandColors.textPrimary,
    flexShrink: 1,
    textAlign: 'right',
  },
})
