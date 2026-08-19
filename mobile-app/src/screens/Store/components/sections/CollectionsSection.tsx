import React from 'react'
import { View, Text, ScrollView, StyleSheet } from 'react-native'
import { SafeImage } from '../../../../components/SafeImage'
import { StoreCollection } from '../../../../types/store'
import { brandColors, radii, spacing, typography } from '../../../../theme'

interface CollectionsSectionProps {
  collections: StoreCollection[]
}

const CARD_WIDTH = 150

/** ELITE seulement. Le parent (SectionRenderer) ne rend ce composant que si collections.length > 0. */
export function CollectionsSection({ collections }: CollectionsSectionProps) {
  return (
    <View style={styles.wrap}>
      <Text style={styles.title}>Colecciones</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
        {collections.map((collection) => (
          <View key={collection.id} style={styles.card}>
            <SafeImage uri={collection.cover || ''} style={styles.cover} fallbackText={collection.title.charAt(0)} />
            <Text style={styles.cardTitle} numberOfLines={1}>
              {collection.title}
            </Text>
            <Text style={styles.cardCount}>{collection.productCount} artículos</Text>
          </View>
        ))}
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  wrap: {
    paddingVertical: spacing.lg,
  },
  title: {
    fontFamily: typography.sectionTitle.fontFamily,
    fontSize: 16,
    color: brandColors.textPrimary,
    marginBottom: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  row: {
    paddingHorizontal: spacing.lg,
    gap: spacing.sm,
  },
  card: {
    width: CARD_WIDTH,
  },
  cover: {
    width: CARD_WIDTH,
    height: CARD_WIDTH,
    borderRadius: radii.medium,
    backgroundColor: brandColors.surfaceSecondary,
    marginBottom: spacing.xs,
  },
  cardTitle: {
    fontFamily: typography.bodyMedium.fontFamily,
    fontSize: 13,
    color: brandColors.textPrimary,
  },
  cardCount: {
    fontFamily: typography.caption.fontFamily,
    fontSize: 11,
    color: brandColors.textSecondary,
  },
})
