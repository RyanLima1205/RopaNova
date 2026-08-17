import React, { useState } from 'react'
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native'
import { brandColors, spacing, typography } from '../../../theme'

const COLLAPSED_LINES = 3
const SHORT_DESCRIPTION_LENGTH = 120

interface ProductDescriptionProps {
  description: string
}

/** "Acerca de este artículo" — tronquée à 3 lignes, "Ver más" si nécessaire. */
export function ProductDescription({ description }: ProductDescriptionProps) {
  const [expanded, setExpanded] = useState(false)
  const trimmed = description.trim()

  if (!trimmed) return null

  const canExpand = trimmed.length > SHORT_DESCRIPTION_LENGTH

  return (
    <View style={styles.wrap}>
      <Text style={styles.title}>Acerca de este artículo</Text>
      <Text style={styles.description} numberOfLines={expanded ? undefined : COLLAPSED_LINES}>
        {trimmed}
      </Text>
      {canExpand && (
        <TouchableOpacity onPress={() => setExpanded((value) => !value)}>
          <Text style={styles.link}>{expanded ? 'Ver menos ‹' : 'Ver más ›'}</Text>
        </TouchableOpacity>
      )}
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
    marginBottom: spacing.sm,
  },
  description: {
    fontFamily: typography.body.fontFamily,
    fontSize: 14,
    color: brandColors.textSecondary,
    lineHeight: 20,
  },
  link: {
    fontFamily: typography.bodyMedium.fontFamily,
    fontSize: 13,
    color: brandColors.primaryUI,
    marginTop: spacing.sm,
  },
})
