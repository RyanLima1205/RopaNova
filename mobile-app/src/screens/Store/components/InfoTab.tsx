import React from 'react'
import { View, Text, StyleSheet } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { brandColors, spacing, typography } from '../../../theme'
import { StoreDelivery, StoreIdentity } from '../../../types/store'

interface InfoTabProps {
  identity: StoreIdentity
  delivery: StoreDelivery
}

/** Onglet "Información" : à propos, confiance, livraison. Pas de réseaux sociaux en V1. */
export function InfoTab({ identity, delivery }: InfoTabProps) {
  const location = [identity.province, identity.city].filter(Boolean).join(', ')
  // memberSince par défaut = 1970 (année epoch, cf. mapper) : signal une date inconnue.
  const showMemberSince = identity.memberSince > 1970
  const storeType =
    identity.kind !== 'store' ? null : identity.physicalStore ? 'Tienda Física' : 'Tienda Virtual'
  const deliveryMethods = [
    delivery.homeDelivery && { icon: 'home-outline' as const, label: 'Entrega a domicilio' },
    delivery.storePickup && { icon: 'location-outline' as const, label: 'Recoger en tienda' },
    delivery.pickupPoint && { icon: 'cube-outline' as const, label: 'Punto de recogida' },
  ].filter((method): method is { icon: 'home-outline' | 'location-outline' | 'cube-outline'; label: string } => !!method)

  return (
    <View style={styles.wrap}>
      <Text style={styles.pageTitle}>Información de la tienda</Text>

      {identity.description && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="storefront-outline" size={17} color={brandColors.textPrimary} />
            <Text style={styles.sectionTitle}>Acerca de esta tienda</Text>
          </View>
          <Text style={styles.paragraph}>{identity.description}</Text>
        </View>
      )}

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Ionicons name="shield-checkmark-outline" size={17} color={brandColors.textPrimary} />
          <Text style={styles.sectionTitle}>Confianza</Text>
        </View>
        {identity.verified && (
          <View style={styles.row}>
            <Ionicons name="checkmark-circle" size={16} color={brandColors.primaryUI} />
            <Text style={styles.rowText}>Vendedor verificado</Text>
          </View>
        )}
        {location !== '' && (
          <View style={styles.row}>
            <Ionicons name="location-outline" size={16} color={brandColors.textSecondary} />
            <Text style={styles.rowText}>{location}</Text>
          </View>
        )}
        {showMemberSince && (
          <View style={styles.row}>
            <Ionicons name="calendar-outline" size={16} color={brandColors.textSecondary} />
            <Text style={styles.rowText}>Miembro desde {identity.memberSince}</Text>
          </View>
        )}
        {storeType && (
          <View style={styles.row}>
            <Ionicons
              name={storeType === 'Tienda Física' ? 'storefront' : 'globe-outline'}
              size={16}
              color={brandColors.textSecondary}
            />
            <Text style={styles.rowText}>{storeType}</Text>
          </View>
        )}
      </View>

      {deliveryMethods.length > 0 && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="bicycle-outline" size={17} color={brandColors.textPrimary} />
            <Text style={styles.sectionTitle}>Entrega</Text>
          </View>
          {deliveryMethods.map((method) => (
            <View key={method.label} style={styles.row}>
              <Ionicons name={method.icon} size={16} color={brandColors.textSecondary} />
              <Text style={styles.rowText}>{method.label}</Text>
            </View>
          ))}
          {delivery.returnPolicy && <Text style={styles.paragraph}>{delivery.returnPolicy}</Text>}
        </View>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  wrap: {
    paddingVertical: spacing.lg,
  },
  pageTitle: {
    fontFamily: typography.screenTitle.fontFamily,
    fontSize: 20,
    color: brandColors.textPrimary,
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.lg,
  },
  section: {
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.xl,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  sectionTitle: {
    fontFamily: typography.sectionTitle.fontFamily,
    fontWeight: '700',
    fontSize: 15,
    color: brandColors.textPrimary,
  },
  paragraph: {
    fontFamily: typography.body.fontFamily,
    fontSize: 14,
    color: brandColors.textSecondary,
    lineHeight: 20,
    marginTop: spacing.sm,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  rowText: {
    fontFamily: typography.body.fontFamily,
    fontSize: 13,
    color: brandColors.textPrimary,
  },
})
