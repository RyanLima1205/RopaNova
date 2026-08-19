import React, { useRef } from 'react'
import { View, Text, Pressable, Animated, StyleSheet } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { SafeImage } from '../../../components/SafeImage'
import { brandColors, radii, shadows, spacing, typography } from '../../../theme'
import { SellerSummary } from '../../../types/product'

interface SellerCardProps {
  seller: SellerSummary
  onPress: () => void
}

const accountTypeLabel = (accountType: SellerSummary['accountType']): string => {
  if (accountType === 'virtual') return 'Tienda virtual'
  if (accountType === 'fisica') return 'Tienda física'
  return 'Cuenta privada'
}

/** *Qui le vend ?* Carte boutique enrichie. */
export function SellerCard({ seller, onPress }: SellerCardProps) {
  const location = [seller.province, seller.city].filter(Boolean).join(', ')
  // memberSince par défaut = 1970 (année epoch, cf. mapper) : signal une date inconnue, on ne l'affiche pas.
  const showMemberSince = seller.memberSince > 1970
  const scale = useRef(new Animated.Value(1)).current

  const handlePressIn = () => {
    Animated.spring(scale, { toValue: 0.98, useNativeDriver: true }).start()
  }

  const handlePressOut = () => {
    Animated.spring(scale, { toValue: 1, useNativeDriver: true }).start()
  }

  return (
    <Pressable onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut}>
      <Animated.View style={[styles.wrap, { transform: [{ scale }] }]}>
        <Text style={styles.title}>Vendedor</Text>
        <View style={styles.row}>
          <SafeImage uri={seller.avatar} style={styles.avatar} fallbackText="V" />
          <View style={styles.info}>
            <View style={styles.nameRow}>
              <Text style={styles.name} numberOfLines={1}>
                {seller.storeName}
              </Text>
              {seller.verified && <Ionicons name="checkmark-circle" size={15} color={brandColors.primaryUI} />}
            </View>
            <Text style={styles.meta} numberOfLines={1}>
              {accountTypeLabel(seller.accountType)}
              {location ? ` · ${location}` : ''}
            </Text>
            {seller.reviewCount > 0 && (
              <Text style={styles.meta} numberOfLines={1}>
                ⭐ {seller.rating.toFixed(1)} ({seller.reviewCount} reseñas)
                {seller.salesCount > 0 ? ` · ${seller.salesCount} ventas` : ''}
              </Text>
            )}
            {seller.responseRate > 0 && (
              <Text style={styles.meta} numberOfLines={1}>
                {seller.responseRate}% respuesta
                {seller.responseTime ? ` · Responde en ~${seller.responseTime}` : ''}
              </Text>
            )}
            {showMemberSince && <Text style={styles.meta}>Miembro desde {seller.memberSince}</Text>}
          </View>
          <Ionicons name="chevron-forward" size={18} color={brandColors.textMuted} />
        </View>
      </Animated.View>
    </Pressable>
  )
}

const styles = StyleSheet.create({
  wrap: {
    marginHorizontal: spacing.lg,
    marginVertical: spacing.sm,
    padding: spacing.lg,
    backgroundColor: brandColors.surface,
    borderRadius: radii.card,
    ...shadows.card,
  },
  title: {
    fontFamily: typography.sectionTitle.fontFamily,
    fontSize: 16,
    color: brandColors.textPrimary,
    marginBottom: spacing.md,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  info: {
    flex: 1,
    gap: 2,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  name: {
    fontFamily: typography.cardTitle.fontFamily,
    fontSize: 15,
    color: brandColors.textPrimary,
    flexShrink: 1,
  },
  meta: {
    fontFamily: typography.caption.fontFamily,
    fontSize: 12,
    color: brandColors.textSecondary,
  },
})
