import React, { useState } from 'react'
import { View, Text, TouchableOpacity, Modal, FlatList, StyleSheet } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { brandColors, radii, spacing, typography } from '../../../theme'
import { formatPrice } from '../../../utils/formatters'
import { ProductDelivery } from '../../../types/product'

interface DeliveryOptionsProps {
  delivery: ProductDelivery
}

const priceLabel = (price: number | null, fallback: string): string =>
  price !== null ? formatPrice(price) : fallback

/** *Comment je le reçois ?* Trois lignes maximum. Villes masquées derrière un bottom sheet. */
export function DeliveryOptions({ delivery }: DeliveryOptionsProps) {
  const [citiesVisible, setCitiesVisible] = useState(false)
  const { homeDelivery, storePickup, pickupPoint } = delivery

  const hasAnyMethod = homeDelivery.available || storePickup.available || pickupPoint.available
  if (!hasAnyMethod) return null

  return (
    <View style={styles.wrap}>
      <Text style={styles.title}>¿Cómo puedes recibirlo?</Text>

      {homeDelivery.available && (
        <TouchableOpacity
          style={styles.row}
          onPress={() => homeDelivery.cities.length > 0 && setCitiesVisible(true)}
          disabled={homeDelivery.cities.length === 0}
        >
          <Ionicons name="home-outline" size={20} color={brandColors.primaryUI} />
          <Text style={styles.rowLabel}>Entrega a domicilio</Text>
          <Text style={styles.rowValue}>
            {homeDelivery.startingPrice !== null ? `Desde ${formatPrice(homeDelivery.startingPrice)}` : 'A coordinar'}
          </Text>
          {homeDelivery.cities.length > 0 && (
            <Ionicons name="chevron-forward" size={16} color={brandColors.textMuted} />
          )}
        </TouchableOpacity>
      )}

      {storePickup.available && (
        <View style={styles.row}>
          <Ionicons name="location-outline" size={20} color={brandColors.primaryUI} />
          <Text style={styles.rowLabel}>Recoger en tienda</Text>
          <Text style={styles.rowValue}>{storePickup.city || 'Acordar con el vendedor'}</Text>
        </View>
      )}

      {pickupPoint.available && (
        <View style={styles.row}>
          <Ionicons name="cube-outline" size={20} color={brandColors.primaryUI} />
          <Text style={styles.rowLabel}>Punto de recogida</Text>
          <Text style={styles.rowValue}>{priceLabel(pickupPoint.price, 'Gratis')}</Text>
        </View>
      )}

      {delivery.instructions && (
        <View style={styles.instructions}>
          <Ionicons name="information-circle-outline" size={16} color={brandColors.textSecondary} />
          <Text style={styles.instructionsText}>{delivery.instructions}</Text>
        </View>
      )}

      <Modal visible={citiesVisible} transparent animationType="slide" onRequestClose={() => setCitiesVisible(false)}>
        <View style={styles.modalOverlay}>
          <TouchableOpacity style={styles.modalBackdrop} activeOpacity={1} onPress={() => setCitiesVisible(false)} />
          <View style={styles.sheet}>
            <View style={styles.sheetHandle} />
            <Text style={styles.sheetTitle}>Ciudades disponibles</Text>
            <FlatList
              data={homeDelivery.cities}
              keyExtractor={(item, index) => `${item.name}-${index}`}
              renderItem={({ item }) => (
                <View style={styles.cityRow}>
                  <Text style={styles.cityName}>{item.name}</Text>
                  <Text style={styles.cityPrice}>{priceLabel(item.price, 'A coordinar')}</Text>
                </View>
              )}
            />
          </View>
        </View>
      </Modal>
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
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: brandColors.border,
  },
  rowLabel: {
    flex: 1,
    fontFamily: typography.bodyMedium.fontFamily,
    fontSize: 14,
    color: brandColors.textPrimary,
  },
  rowValue: {
    fontFamily: typography.body.fontFamily,
    fontSize: 13,
    color: brandColors.textSecondary,
  },
  instructions: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  instructionsText: {
    flex: 1,
    fontFamily: typography.body.fontFamily,
    fontSize: 13,
    color: brandColors.textSecondary,
    lineHeight: 18,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(17,24,39,0.5)',
  },
  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  sheet: {
    maxHeight: '70%',
    backgroundColor: brandColors.surface,
    borderTopLeftRadius: radii.card,
    borderTopRightRadius: radii.card,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.xxl,
  },
  sheetHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: brandColors.border,
    alignSelf: 'center',
    marginBottom: spacing.md,
  },
  sheetTitle: {
    fontFamily: typography.sectionTitle.fontFamily,
    fontSize: 16,
    color: brandColors.textPrimary,
    marginBottom: spacing.md,
  },
  cityRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: brandColors.border,
  },
  cityName: {
    fontFamily: typography.body.fontFamily,
    fontSize: 14,
    color: brandColors.textPrimary,
  },
  cityPrice: {
    fontFamily: typography.bodyMedium.fontFamily,
    fontSize: 14,
    color: brandColors.textSecondary,
  },
})
