import React, { useCallback, useState } from 'react'
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  Alert,
  ActivityIndicator,
  RefreshControl,
} from 'react-native'
import { Ionicons, MaterialCommunityIcons, FontAwesome5, Feather } from '@expo/vector-icons'
import { useFocusEffect, useNavigation } from '@react-navigation/native'
import { StackNavigationProp } from '@react-navigation/stack'
import { RootStackParamList } from '../../App'
import { useAuth } from '../contexts/AuthContext'
import {
  deleteAddress,
  formatLastUsedLabel,
  getAddresses,
  setDefaultAddress,
  type SavedAddress,
} from '../services/addressService'

type AddressSettingsNavigationProp = StackNavigationProp<RootStackParamList, 'AddressSettings'>

export const AddressSettingsScreen: React.FC = () => {
  const navigation = useNavigation<AddressSettingsNavigationProp>()
  const { user } = useAuth()
  const [addresses, setAddresses] = useState<SavedAddress[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const loadAddresses = useCallback(async () => {
    if (!user?.id) {
      setAddresses([])
      setLoading(false)
      return
    }
    try {
      const list = await getAddresses(user.id)
      setAddresses(list)
    } catch {
      Alert.alert('Error', 'No se pudieron cargar las direcciones.')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [user?.id])

  useFocusEffect(
    useCallback(() => {
      setLoading(true)
      loadAddresses()
    }, [loadAddresses]),
  )

  const onRefresh = () => {
    setRefreshing(true)
    loadAddresses()
  }

  const getAddressIcon = (type: string) => {
    switch (type) {
      case 'home':
        return <Ionicons name="home" size={20} color="#059669" />
      case 'work':
        return <FontAwesome5 name="building" size={18} color="#7c3aed" />
      default:
        return <Feather name="map-pin" size={20} color="#6b7280" />
    }
  }

  const getAddressTypeLabel = (type: string) => {
    switch (type) {
      case 'home':
        return 'Casa'
      case 'work':
        return 'Trabajo'
      default:
        return 'Otro'
    }
  }

  const handleSetDefault = async (id: string) => {
    if (!user?.id) return
    try {
      await setDefaultAddress(user.id, id)
      await loadAddresses()
    } catch {
      Alert.alert('Error', 'No se pudo establecer como dirección principal.')
    }
  }

  const handleDelete = (id: string, name: string) => {
    Alert.alert(
      '¿Eliminar dirección?',
      `Se eliminará «${name}» de tu cuenta. Esta acción no se puede deshacer.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            if (!user?.id) return
            try {
              await deleteAddress(user.id, id)
              await loadAddresses()
            } catch {
              Alert.alert('Error', 'No se pudo eliminar la dirección.')
            }
          },
        },
      ],
    )
  }

  const defaultAddress = addresses.find((addr) => addr.isDefault)
  const otherAddresses = addresses.filter((addr) => !addr.isDefault)

  const renderAddressCard = (address: SavedAddress, isDefault: boolean = false) => (
    <View key={address.id} style={[styles.addressCard, isDefault && styles.defaultAddressCard]}>
      <View style={styles.addressHeader}>
        <View style={[styles.addressIcon, isDefault && styles.defaultAddressIcon]}>
          {getAddressIcon(address.type)}
        </View>
        <View style={{ flex: 1 }}>
          <View style={styles.addressTitleRow}>
            <Text style={styles.addressName}>{address.name}</Text>
            {isDefault && (
              <View style={styles.badgePrimary}>
                <Text style={styles.badgePrimaryText}>Principal</Text>
              </View>
            )}
            {address.isVerified && (
              <View style={styles.badgeVerified}>
                <Ionicons name="checkmark" size={12} color="#2563eb" />
                <Text style={styles.badgeVerifiedText}>Verificada</Text>
              </View>
            )}
          </View>
        </View>
      </View>

      <View style={styles.addressDetails}>
        <View style={styles.detailRow}>
          <Ionicons name="person" size={14} color="#6b7280" />
          <Text style={styles.detailText}>{address.recipient}</Text>
        </View>
        <View style={styles.detailRow}>
          <Ionicons name="call" size={14} color="#6b7280" />
          <Text style={styles.detailText}>{address.phone}</Text>
        </View>
        <View style={styles.detailRow}>
          <Feather name="map-pin" size={14} color="#6b7280" />
          <View style={{ flex: 1 }}>
            <Text style={styles.detailText}>{address.street}</Text>
            {address.references ? (
              <Text style={styles.detailTextMuted}>{address.references}</Text>
            ) : null}
            <Text style={styles.detailText}>
              {address.sector}, {address.city}
            </Text>
            <Text style={styles.detailText}>
              {address.province}
              {address.postalCode ? ` · ${address.postalCode}` : ''}
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.addressFooter}>
        <Text style={styles.lastUsedText}>{formatLastUsedLabel(address.lastUsedAt)}</Text>
        <View style={styles.typeBadge}>
          <Text style={styles.typeBadgeText}>{getAddressTypeLabel(address.type)}</Text>
        </View>
      </View>

      <View style={styles.actionMenu}>
        {!isDefault && (
          <TouchableOpacity style={styles.actionItem} onPress={() => handleSetDefault(address.id)}>
            <Ionicons name="star" size={16} color="#059669" />
            <Text style={styles.actionText}>Hacer principal</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity
          style={styles.actionItem}
          onPress={() => navigation.navigate('AddAddress', { addressId: address.id })}
        >
          <Feather name="edit" size={16} color="#6b7280" />
          <Text style={styles.actionText}>Editar</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionItem} onPress={() => handleDelete(address.id, address.name)}>
          <Feather name="trash-2" size={16} color="#ef4444" />
          <Text style={[styles.actionText, { color: '#ef4444' }]}>Eliminar</Text>
        </TouchableOpacity>
      </View>
    </View>
  )

  const renderEmptyState = () => (
    <View style={styles.emptyCard}>
      <Feather name="map-pin" size={48} color="#9ca3af" />
      <Text style={styles.emptyTitle}>No tienes direcciones guardadas</Text>
      <Text style={styles.emptyText}>
        Agrega una dirección para recibir tus compras de forma rápida y segura.
      </Text>
      <TouchableOpacity
        style={styles.addFirstButton}
        onPress={() => navigation.navigate('AddAddress')}
      >
        <Ionicons name="add" size={20} color="#fff" style={{ marginRight: 8 }} />
        <Text style={styles.addFirstButtonText}>Agregar Primera Dirección</Text>
      </TouchableOpacity>
    </View>
  )

  const renderShippingTips = () => (
    <View style={styles.tipsCard}>
      <View style={styles.tipsHeader}>
        <MaterialCommunityIcons name="truck-delivery" size={20} color="#92400e" />
        <Text style={styles.tipsTitle}>Consejos de Envío</Text>
      </View>
      <View style={styles.tipsContent}>
        <Text style={styles.tipText}>
          • <Text style={styles.tipBold}>Verifica tu dirección:</Text> Asegúrate de que todos los datos sean correctos para evitar retrasos.
        </Text>
        <Text style={styles.tipText}>
          • <Text style={styles.tipBold}>Incluye referencias:</Text> Agrega puntos de referencia para facilitar la entrega.
        </Text>
        <Text style={styles.tipText}>
          • <Text style={styles.tipBold}>Número de contacto:</Text> Mantén tu teléfono disponible durante el horario de entrega.
        </Text>
        <Text style={styles.tipText}>
          • <Text style={styles.tipBold}>Horarios de entrega:</Text> Lunes a viernes 8:00 AM - 6:00 PM, sábados 8:00 AM - 2:00 PM.
        </Text>
      </View>
    </View>
  )

  if (!user?.id) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerBtn}>
            <Ionicons name="arrow-back" size={24} color="#111827" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Direcciones de Envío</Text>
        </View>
        <View style={styles.centered}>
          <Text style={styles.emptyText}>Inicia sesión para gestionar tus direcciones.</Text>
        </View>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerBtn}>
          <Ionicons name="arrow-back" size={24} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Direcciones de Envío</Text>
        <TouchableOpacity style={styles.headerBtnAdd} onPress={() => navigation.navigate('AddAddress')}>
          <Ionicons name="add" size={24} color="#059669" />
        </TouchableOpacity>
      </View>

      {loading && addresses.length === 0 ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#059669" />
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#059669" />}
        >
          {defaultAddress && (
            <View style={{ marginBottom: 24 }}>
              <View style={styles.sectionHeader}>
                <Ionicons name="star" size={18} color="#eab308" style={styles.sectionHeaderIcon} />
                <Text style={styles.sectionHeaderTitle}>Dirección Principal</Text>
              </View>
              {renderAddressCard(defaultAddress, true)}
            </View>
          )}

          {otherAddresses.length > 0 && (
            <View style={{ marginBottom: 24 }}>
              <Text style={styles.sectionTitle}>Otras Direcciones</Text>
              {otherAddresses.map((address) => renderAddressCard(address))}
            </View>
          )}

          {addresses.length === 0 && !loading && renderEmptyState()}

          {renderShippingTips()}
        </ScrollView>
      )}
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  headerBtn: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: '#f3f4f6',
    marginRight: 8,
  },
  headerTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
  },
  headerBtnAdd: {
    padding: 8,
    marginLeft: 8,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionHeaderIcon: {
    marginRight: 6,
  },
  sectionHeaderTitle: {
    fontWeight: 'bold',
    fontSize: 17,
    color: '#111827',
    lineHeight: 20,
  },
  sectionTitle: {
    fontWeight: 'bold',
    fontSize: 17,
    color: '#111827',
    marginBottom: 12,
  },
  addressCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 1 },
  },
  defaultAddressCard: {
    borderWidth: 2,
    borderColor: '#10b981',
  },
  addressHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  addressIcon: {
    width: 40,
    height: 40,
    backgroundColor: '#f3f4f6',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  defaultAddressIcon: {
    backgroundColor: '#d1fae5',
  },
  addressTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
  },
  addressName: {
    fontWeight: 'bold',
    fontSize: 16,
    color: '#111827',
  },
  badgePrimary: {
    backgroundColor: '#d1fae5',
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  badgePrimaryText: {
    color: '#059669',
    fontWeight: 'bold',
    fontSize: 11,
  },
  badgeVerified: {
    backgroundColor: '#dbeafe',
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  badgeVerifiedText: {
    color: '#2563eb',
    fontWeight: 'bold',
    fontSize: 11,
  },
  addressDetails: {
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 6,
    gap: 8,
  },
  detailText: {
    fontSize: 14,
    color: '#6b7280',
    flex: 1,
  },
  detailTextMuted: {
    fontSize: 13,
    color: '#9ca3af',
    fontStyle: 'italic',
    marginBottom: 2,
  },
  addressFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
  },
  lastUsedText: {
    fontSize: 12,
    color: '#9ca3af',
  },
  typeBadge: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  typeBadgeText: {
    fontSize: 11,
    color: '#6b7280',
  },
  actionMenu: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
  },
  actionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 8,
  },
  actionText: {
    fontSize: 14,
    color: '#6b7280',
  },
  emptyCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 32,
    alignItems: 'center',
    marginBottom: 24,
  },
  emptyTitle: {
    fontWeight: 'bold',
    fontSize: 18,
    color: '#111827',
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },
  addFirstButton: {
    backgroundColor: '#059669',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  addFirstButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  tipsCard: {
    backgroundColor: '#fef3c7',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#fde68a',
  },
  tipsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  tipsTitle: {
    fontWeight: 'bold',
    fontSize: 17,
    color: '#92400e',
  },
  tipsContent: {
    gap: 8,
  },
  tipText: {
    fontSize: 13,
    color: '#92400e',
    lineHeight: 18,
  },
  tipBold: {
    fontWeight: 'bold',
  },
})
