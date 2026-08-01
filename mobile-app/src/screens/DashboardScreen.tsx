import React, { useCallback, useEffect, useState } from 'react'
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  Modal,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  StatusBar,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { useNavigation } from '@react-navigation/native'
import { StackNavigationProp } from '@react-navigation/stack'
import { RootStackParamList } from '../../App'

type Nav = StackNavigationProp<RootStackParamList>
import { useAuth } from '../contexts/AuthContext'
import {
  BuyerOrder,
  OrderStatus,
  fetchOrdersForSeller,
  updateOrderStatus,
} from '../services/orderService'
import {
  formatOrderCurrency,
  formatOrderDate,
  getStatusInfo,
} from '../utils/orderStatus'

type TabKey = 'all' | OrderStatus

const TABS: { key: TabKey; label: string }[] = [
  { key: 'all', label: 'Todos' },
  { key: 'pending', label: 'Pendientes' },
  { key: 'confirmed', label: 'Confirmados' },
  { key: 'shipped', label: 'Enviados' },
  { key: 'delivered', label: 'Entregados' },
  { key: 'cancelled', label: 'Cancelados' },
]

export const DashboardScreen: React.FC = () => {
  const navigation = useNavigation<Nav>()
  const { user } = useAuth()

  const [orders, setOrders] = useState<BuyerOrder[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<TabKey>('all')
  const [updatingId, setUpdatingId] = useState<string | null>(null)

  const [trackingModal, setTrackingModal] = useState<{
    orderId: string
    title: string
  } | null>(null)
  const [trackingInput, setTrackingInput] = useState('')

  const load = useCallback(
    async (isRefresh = false) => {
      if (!user?.id) return
      if (isRefresh) setRefreshing(true)
      else setLoading(true)
      setError(null)
      try {
        const data = await fetchOrdersForSeller(user.id)
        setOrders(data)
      } catch {
        setError('No se pudieron cargar tus ventas.')
      } finally {
        setLoading(false)
        setRefreshing(false)
      }
    },
    [user?.id],
  )

  useEffect(() => {
    load()
  }, [load])

  const filtered =
    activeTab === 'all' ? orders : orders.filter((o) => o.status === activeTab)

  const doUpdate = async (
    order: BuyerOrder,
    newStatus: OrderStatus,
    extras?: { trackingNumber?: string },
  ) => {
    if (!user?.id) return
    setUpdatingId(order.id)
    try {
      await updateOrderStatus(order.id, user.id, newStatus, extras)
      setOrders((prev) =>
        prev.map((o) =>
          o.id === order.id
            ? {
                ...o,
                status: newStatus,
                ...(extras?.trackingNumber
                  ? { trackingNumber: extras.trackingNumber }
                  : {}),
              }
            : o,
        ),
      )
    } catch (e: any) {
      Alert.alert(
        'Error',
        e.message === 'FORBIDDEN'
          ? 'No tienes permiso para actualizar este pedido.'
          : 'No se pudo actualizar el estado. Intenta de nuevo.',
      )
    } finally {
      setUpdatingId(null)
    }
  }

  const handleConfirm = (order: BuyerOrder) => {
    Alert.alert(
      'Confirmar pedido',
      `¿Aceptas el pedido #${order.orderCode}?`,
      [
        { text: 'No', style: 'cancel' },
        { text: 'Confirmar', onPress: () => doUpdate(order, 'confirmed') },
      ],
    )
  }

  const handleShip = (order: BuyerOrder) => {
    setTrackingInput('')
    setTrackingModal({ orderId: order.id, title: order.productTitle })
  }

  const handleConfirmShip = async () => {
    if (!trackingModal) return
    const order = orders.find((o) => o.id === trackingModal.orderId)
    if (!order) return
    setTrackingModal(null)
    await doUpdate(
      order,
      'shipped',
      trackingInput.trim() ? { trackingNumber: trackingInput.trim() } : undefined,
    )
  }

  const handleDeliver = (order: BuyerOrder) => {
    Alert.alert(
      'Marcar como entregado',
      '¿Confirmas que el comprador recibió el pedido?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Sí, entregado', onPress: () => doUpdate(order, 'delivered') },
      ],
    )
  }

  const handleCancelOrder = (order: BuyerOrder) => {
    Alert.alert(
      'Cancelar pedido',
      '¿Seguro que deseas cancelar este pedido? El comprador será notificado.',
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Cancelar pedido',
          style: 'destructive',
          onPress: () => doUpdate(order, 'cancelled'),
        },
      ],
    )
  }

  const renderOrder = ({ item }: { item: BuyerOrder }) => {
    const { label: statusLabel, color: statusColor } = getStatusInfo(item.status)
    const isUpdating = updatingId === item.id
    const initials = item.buyerName
      ? item.buyerName
          .split(' ')
          .map((w) => w[0])
          .slice(0, 2)
          .join('')
          .toUpperCase()
      : 'C'

    return (
      <View style={styles.orderCard}>
        {/* Tappable info area → detail screen */}
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => navigation.navigate('SellerOrderDetail', { orderId: item.id })}
        >
          {/* Product info */}
          <View style={styles.productRow}>
            {item.productImage ? (
              <Image source={{ uri: item.productImage }} style={styles.productImg} />
            ) : (
              <View style={[styles.productImg, styles.productImgPlaceholder]}>
                <Ionicons name="shirt-outline" size={22} color="#9ca3af" />
              </View>
            )}
            <View style={styles.productInfo}>
              <Text style={styles.productTitle} numberOfLines={2}>
                {item.productTitle}
              </Text>
              <Text style={styles.productLine}>{item.lineSummary}</Text>
              <View style={styles.productMeta}>
                <Text style={styles.productAmount}>
                  {formatOrderCurrency(item.amount)}
                </Text>
                <Text style={styles.productDate}>
                  {formatOrderDate(item.createdAt)}
                </Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#d1d5db" style={{ alignSelf: 'center' }} />
          </View>

          <Text style={styles.orderCode}>Pedido #{item.orderCode}</Text>

          {/* Buyer */}
          <View style={styles.infoRow}>
            <View style={styles.iconCircle}>
              {item.buyerAvatar ? (
                <Image source={{ uri: item.buyerAvatar }} style={styles.avatarImg} />
              ) : (
                <Text style={styles.initials}>{initials}</Text>
              )}
            </View>
            <View style={styles.infoTexts}>
              <Text style={styles.infoLabel}>Comprador</Text>
              <Text style={styles.infoValue}>{item.buyerName || 'Cliente'}</Text>
            </View>
          </View>

          {/* Delivery */}
          <View style={styles.infoRow}>
            <View style={[styles.iconCircle, styles.iconCircleBlue]}>
              <Ionicons
                name={
                  item.shippingMethodId === 'pickup'
                    ? 'storefront-outline'
                    : 'car-outline'
                }
                size={16}
                color="#2563eb"
              />
            </View>
            <View style={styles.infoTexts}>
              <Text style={styles.infoLabel}>{item.shippingLabel}</Text>
              {item.deliveryCity ? (
                <Text style={styles.infoValue}>{item.deliveryCity}</Text>
              ) : null}
              {item.deliveryAddressSummary ? (
                <Text style={styles.infoAddress} numberOfLines={2}>
                  {item.deliveryAddressSummary}
                </Text>
              ) : null}
            </View>
          </View>

          {/* Tracking */}
          {item.trackingNumber ? (
            <View style={styles.trackingRow}>
              <Ionicons name="barcode-outline" size={14} color="#6b7280" />
              <Text style={styles.trackingText}> {item.trackingNumber}</Text>
            </View>
          ) : null}

          {/* Status badge */}
          <View
            style={[
              styles.statusBadge,
              { backgroundColor: `${statusColor}18`, borderColor: `${statusColor}40` },
            ]}
          >
            <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
            <Text style={[styles.statusText, { color: statusColor }]}>
              {statusLabel}
            </Text>
          </View>
        </TouchableOpacity>

        {/* Actions — outside the tappable area */}
        {isUpdating ? (
          <ActivityIndicator
            size="small"
            color="#059669"
            style={{ marginTop: 12, alignSelf: 'center' }}
          />
        ) : (
          <View style={styles.actionsRow}>
            {item.status === 'pending' && (
              <>
                <TouchableOpacity
                  style={styles.btnPrimary}
                  onPress={() => handleConfirm(item)}
                >
                  <Ionicons name="checkmark-outline" size={15} color="#fff" />
                  <Text style={styles.btnPrimaryText}>Confirmar</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.btnGhost}
                  onPress={() => handleCancelOrder(item)}
                >
                  <Text style={styles.btnGhostText}>Cancelar</Text>
                </TouchableOpacity>
              </>
            )}
            {item.status === 'confirmed' && (
              <TouchableOpacity
                style={[styles.btnPrimary, styles.btnBlue]}
                onPress={() => handleShip(item)}
              >
                <Ionicons name="car-outline" size={15} color="#fff" />
                <Text style={styles.btnPrimaryText}>Marcar como enviado</Text>
              </TouchableOpacity>
            )}
            {item.status === 'shipped' && (
              <TouchableOpacity
                style={[styles.btnPrimary, styles.btnPurple]}
                onPress={() => handleDeliver(item)}
              >
                <Ionicons name="checkmark-done-outline" size={15} color="#fff" />
                <Text style={styles.btnPrimaryText}>Marcar como entregado</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </View>
    )
  }

  const renderEmpty = () => {
    if (loading) return null
    const tabLabel = TABS.find((t) => t.key === activeTab)?.label.toLowerCase() ?? ''
    return (
      <View style={styles.emptyState}>
        <Ionicons name="bag-outline" size={52} color="#e5e7eb" />
        <Text style={styles.emptyTitle}>
          {activeTab === 'all'
            ? 'Aún no tienes ventas'
            : `Sin pedidos ${tabLabel}`}
        </Text>
        <Text style={styles.emptyBody}>
          {activeTab === 'all'
            ? 'Cuando recibas tu primera venta aparecerá aquí.'
            : 'Cambia de pestaña para ver otros pedidos.'}
        </Text>
      </View>
    )
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.headerBtn}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Mis Ventas</Text>
        <TouchableOpacity style={styles.headerBtn} onPress={() => load(true)}>
          <Ionicons name="refresh-outline" size={22} color="#6b7280" />
        </TouchableOpacity>
      </View>

      {/* Tabs */}
      <View style={styles.tabWrapper}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tabScroll}
        >
          {TABS.map((tab) => {
            const count =
              tab.key === 'all'
                ? orders.length
                : orders.filter((o) => o.status === tab.key).length
            return (
              <TouchableOpacity
                key={tab.key}
                style={[styles.tab, activeTab === tab.key && styles.tabActive]}
                onPress={() => setActiveTab(tab.key)}
              >
                <Text
                  style={[
                    styles.tabText,
                    activeTab === tab.key && styles.tabTextActive,
                  ]}
                >
                  {tab.label}
                </Text>
                {count > 0 && (
                  <View
                    style={[
                      styles.tabBadge,
                      activeTab === tab.key && styles.tabBadgeActive,
                    ]}
                  >
                    <Text
                      style={[
                        styles.tabBadgeText,
                        activeTab === tab.key && styles.tabBadgeTextActive,
                      ]}
                    >
                      {count}
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
            )
          })}
        </ScrollView>
      </View>

      {/* Body */}
      {loading && !refreshing ? (
        <View style={styles.loadingState}>
          <ActivityIndicator size="large" color="#059669" />
          <Text style={styles.loadingText}>Cargando ventas...</Text>
        </View>
      ) : error ? (
        <View style={styles.errorState}>
          <Ionicons name="wifi-outline" size={44} color="#d1d5db" />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={() => load()}>
            <Text style={styles.retryText}>Reintentar</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          renderItem={renderOrder}
          ListEmptyComponent={renderEmpty}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => load(true)}
              colors={['#059669']}
              tintColor="#059669"
            />
          }
          contentContainerStyle={styles.listContent}
          ListHeaderComponent={
            <TouchableOpacity
              style={styles.statsTeaser}
              activeOpacity={0.7}
              onPress={() => navigation.navigate('SellerStats')}
            >
              <Ionicons name="rocket-outline" size={15} color="#059669" />
              <Text style={[styles.statsTeaserText, { flex: 1 }]}>
                Estadísticas detalladas —{' '}
                <Text style={styles.statsTeaserHighlight}>próximamente</Text>
              </Text>
              <Ionicons name="chevron-forward" size={15} color="#059669" />
            </TouchableOpacity>
          }
          ListFooterComponent={
            <View style={styles.quickActions}>
              <Text style={styles.quickActionsTitle}>Acciones Rápidas</Text>
              <View style={styles.quickActionsRow}>
                <TouchableOpacity
                  style={styles.quickActionBtn}
                  onPress={() => navigation.navigate('MainTabs', { screen: 'Sell' })}
                >
                  <Ionicons name="add-circle-outline" size={20} color="#059669" />
                  <Text style={styles.quickActionText}>Publicar</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.quickActionBtn}
                  onPress={() => navigation.navigate('MainTabs', { screen: 'Messages' })}
                >
                  <Ionicons name="chatbubble-outline" size={20} color="#2563eb" />
                  <Text style={styles.quickActionText}>Mensajes</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.quickActionBtn}
                  onPress={() => navigation.navigate('MainTabs', { screen: 'Profile' })}
                >
                  <Ionicons name="person-outline" size={20} color="#a21caf" />
                  <Text style={styles.quickActionText}>Perfil</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.quickActionBtn}
                  onPress={() => navigation.navigate('SettingsScreen')}
                >
                  <Ionicons name="settings-outline" size={20} color="#b45309" />
                  <Text style={styles.quickActionText}>Config</Text>
                </TouchableOpacity>
              </View>
            </View>
          }
        />
      )}

      {/* Tracking modal */}
      <Modal
        visible={!!trackingModal}
        transparent
        animationType="fade"
        onRequestClose={() => setTrackingModal(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Marcar como enviado</Text>
            <Text style={styles.modalSubtitle} numberOfLines={2}>
              {trackingModal?.title}
            </Text>
            <Text style={styles.modalLabel}>
              Número de tracking{' '}
              <Text style={styles.modalOptional}>(opcional)</Text>
            </Text>
            <TextInput
              style={styles.modalInput}
              placeholder="Ej: CAEX12345678DO"
              value={trackingInput}
              onChangeText={setTrackingInput}
              autoCapitalize="characters"
              returnKeyType="done"
              onSubmitEditing={handleConfirmShip}
            />
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.modalBtnSecondary}
                onPress={() => setTrackingModal(null)}
              >
                <Text style={styles.modalBtnSecondaryText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalBtnPrimary}
                onPress={handleConfirmShip}
              >
                <Ionicons name="car-outline" size={15} color="#fff" />
                <Text style={styles.modalBtnPrimaryText}>Confirmar envío</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f3f4f6' },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  headerBtn: { padding: 6 },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#111827' },

  // Tabs
  tabWrapper: {
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  tabScroll: { paddingHorizontal: 12, paddingVertical: 10, gap: 6 },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: '#f3f4f6',
    gap: 6,
  },
  tabActive: { backgroundColor: '#059669' },
  tabText: { fontSize: 13, fontWeight: '500', color: '#6b7280' },
  tabTextActive: { color: '#fff' },
  tabBadge: {
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#d1d5db',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  tabBadgeActive: { backgroundColor: 'rgba(255,255,255,0.3)' },
  tabBadgeText: { fontSize: 10, fontWeight: '700', color: '#6b7280' },
  tabBadgeTextActive: { color: '#fff' },

  // States
  loadingState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  loadingText: { fontSize: 14, color: '#6b7280' },
  errorState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    gap: 12,
  },
  errorText: { fontSize: 14, color: '#374151', textAlign: 'center' },
  retryBtn: {
    marginTop: 4,
    backgroundColor: '#059669',
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryText: { color: '#fff', fontWeight: '600', fontSize: 14 },

  // List
  listContent: { padding: 16, paddingBottom: 40, gap: 12 },

  // Stats teaser
  statsTeaser: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0fdf4',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 4,
    gap: 6,
    borderWidth: 1,
    borderColor: '#bbf7d0',
  },
  statsTeaserText: { fontSize: 13, color: '#374151' },
  statsTeaserHighlight: { fontWeight: '600', color: '#059669' },

  // Order card
  orderCard: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 16,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  productRow: { flexDirection: 'row', gap: 12, marginBottom: 10 },
  productImg: {
    width: 72,
    height: 72,
    borderRadius: 10,
    backgroundColor: '#f3f4f6',
  },
  productImgPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  productInfo: { flex: 1 },
  productTitle: { fontSize: 14, fontWeight: '600', color: '#111827', lineHeight: 20 },
  productLine: { fontSize: 12, color: '#6b7280', marginTop: 2 },
  productMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 6,
  },
  productAmount: { fontSize: 15, fontWeight: '700', color: '#059669' },
  productDate: { fontSize: 11, color: '#9ca3af' },

  orderCode: {
    fontSize: 11,
    color: '#9ca3af',
    marginBottom: 10,
    fontFamily: 'monospace',
  },

  // Info rows (buyer + delivery)
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    marginBottom: 8,
  },
  iconCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#f3f4f6',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  iconCircleBlue: { backgroundColor: '#eff6ff' },
  avatarImg: { width: 34, height: 34, borderRadius: 17 },
  initials: { fontSize: 13, fontWeight: '700', color: '#059669' },
  infoTexts: { flex: 1 },
  infoLabel: { fontSize: 11, color: '#9ca3af', marginBottom: 1 },
  infoValue: { fontSize: 13, fontWeight: '500', color: '#111827' },
  infoAddress: { fontSize: 12, color: '#6b7280', marginTop: 2, lineHeight: 17 },

  // Tracking
  trackingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginBottom: 8,
  },
  trackingText: { fontSize: 12, color: '#6b7280', fontFamily: 'monospace' },

  // Status badge
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1,
    gap: 5,
    marginBottom: 10,
    marginTop: 2,
  },
  statusDot: { width: 7, height: 7, borderRadius: 3.5 },
  statusText: { fontSize: 12, fontWeight: '600' },

  // Action buttons
  actionsRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 2,
  },
  btnPrimary: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    backgroundColor: '#059669',
    borderRadius: 8,
    paddingVertical: 10,
  },
  btnBlue: { backgroundColor: '#2563eb' },
  btnPurple: { backgroundColor: '#7c3aed' },
  btnPrimaryText: { color: '#fff', fontWeight: '600', fontSize: 13 },
  btnGhost: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  btnGhostText: { color: '#6b7280', fontWeight: '500', fontSize: 13 },

  // Empty state
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 32,
    gap: 10,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    textAlign: 'center',
  },
  emptyBody: {
    fontSize: 13,
    color: '#9ca3af',
    textAlign: 'center',
    lineHeight: 20,
  },

  // Quick Actions footer
  quickActions: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 14,
    marginTop: 8,
  },
  quickActionsTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 12,
  },
  quickActionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  quickActionBtn: { flex: 1, alignItems: 'center', paddingVertical: 6, gap: 4 },
  quickActionText: { fontSize: 11, color: '#374151' },

  // Tracking Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  modalCard: {
    width: '100%',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
  },
  modalSubtitle: {
    fontSize: 13,
    color: '#6b7280',
    marginBottom: 20,
  },
  modalLabel: { fontSize: 13, fontWeight: '500', color: '#374151', marginBottom: 6 },
  modalOptional: { fontWeight: '400', color: '#9ca3af' },
  modalInput: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#111827',
    backgroundColor: '#f9fafb',
    marginBottom: 20,
  },
  modalActions: { flexDirection: 'row', gap: 10 },
  modalBtnSecondary: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 11,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  modalBtnSecondaryText: { color: '#6b7280', fontWeight: '500', fontSize: 14 },
  modalBtnPrimary: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    paddingVertical: 11,
    borderRadius: 8,
    backgroundColor: '#2563eb',
  },
  modalBtnPrimaryText: { color: '#fff', fontWeight: '600', fontSize: 14 },
})
