import React, { useCallback, useState } from 'react'
import {
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  RefreshControl,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import {
  useFocusEffect,
  useNavigation,
  useRoute,
  type RouteProp,
} from '@react-navigation/native'
import { type StackNavigationProp } from '@react-navigation/stack'
import { type RootStackParamList } from '../../App'
import { useAuth } from '../contexts/AuthContext'
import {
  fetchOrderForSeller,
  updateOrderStatus,
  type BuyerOrder,
  type OrderStatus,
} from '../services/orderService'
import { createConversationIfNeeded } from '../services/chatService'
import {
  formatOrderCurrency,
  formatOrderDate,
  getStatusInfo,
  getTimelineStepStates,
  ORDER_TIMELINE_STEPS,
  type TimelineStepState,
} from '../utils/orderStatus'

type Nav = StackNavigationProp<RootStackParamList, 'SellerOrderDetail'>
type Route = RouteProp<RootStackParamList, 'SellerOrderDetail'>

function TimelineDot({ state }: { state: TimelineStepState }) {
  if (state === 'done')
    return (
      <View style={[tl.dot, tl.dotDone]}>
        <Ionicons name="checkmark" size={13} color="#fff" />
      </View>
    )
  if (state === 'current')
    return (
      <View style={[tl.dot, tl.dotCurrent]}>
        <View style={tl.dotInner} />
      </View>
    )
  if (state === 'cancelled')
    return (
      <View style={[tl.dot, tl.dotCancelled]}>
        <Ionicons name="close" size={13} color="#fff" />
      </View>
    )
  return <View style={[tl.dot, tl.dotUpcoming]} />
}

export default function SellerOrderDetailScreen() {
  const navigation = useNavigation<Nav>()
  const route = useRoute<Route>()
  const { orderId } = route.params
  const { user } = useAuth()

  const [order, setOrder] = useState<BuyerOrder | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [updatingId, setUpdatingId] = useState<string | null>(null)
  const [contactLoading, setContactLoading] = useState(false)

  const [trackingModal, setTrackingModal] = useState(false)
  const [trackingInput, setTrackingInput] = useState('')

  const load = useCallback(
    async (isRefresh = false) => {
      if (!user?.id) return
      if (!isRefresh) setLoading(true)
      setError(null)
      try {
        const row = await fetchOrderForSeller(orderId, user.id)
        if (!row) {
          setError('Pedido no encontrado o no tienes permiso para verlo.')
          setOrder(null)
        } else {
          setOrder(row)
        }
      } catch {
        setError('No se pudo cargar el pedido.')
      } finally {
        setLoading(false)
        setRefreshing(false)
      }
    },
    [orderId, user?.id],
  )

  useFocusEffect(
    useCallback(() => {
      setLoading(true)
      load()
    }, [load]),
  )

  const doUpdate = async (
    newStatus: OrderStatus,
    extras?: { trackingNumber?: string },
  ) => {
    if (!order || !user?.id) return
    setUpdatingId(order.id)
    try {
      await updateOrderStatus(order.id, user.id, newStatus, extras)
      setOrder((prev) =>
        prev
          ? {
              ...prev,
              status: newStatus,
              ...(extras?.trackingNumber
                ? { trackingNumber: extras.trackingNumber }
                : {}),
            }
          : prev,
      )
    } catch (e: any) {
      Alert.alert(
        'Error',
        e.message === 'FORBIDDEN'
          ? 'No tienes permiso para actualizar este pedido.'
          : 'No se pudo actualizar el estado.',
      )
    } finally {
      setUpdatingId(null)
    }
  }

  const handleConfirm = () => {
    if (!order) return
    Alert.alert(
      'Confirmar pedido',
      `¿Aceptas el pedido #${order.orderCode}? Se notificará al comprador.`,
      [
        { text: 'No', style: 'cancel' },
        { text: 'Confirmar', onPress: () => doUpdate('confirmed') },
      ],
    )
  }

  const handleShip = () => {
    setTrackingInput('')
    setTrackingModal(true)
  }

  const handleConfirmShip = async () => {
    setTrackingModal(false)
    await doUpdate(
      'shipped',
      trackingInput.trim() ? { trackingNumber: trackingInput.trim() } : undefined,
    )
  }

  const handleDeliver = () => {
    Alert.alert(
      'Marcar como entregado',
      '¿Confirmas que el comprador recibió el pedido?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Sí, entregado', onPress: () => doUpdate('delivered') },
      ],
    )
  }

  const handleCancelOrder = () => {
    if (!order) return
    Alert.alert(
      'Cancelar pedido',
      'El comprador será notificado. ¿Seguro que deseas cancelar?',
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Cancelar pedido',
          style: 'destructive',
          onPress: () => doUpdate('cancelled'),
        },
      ],
    )
  }

  const handleMessage = async () => {
    if (!order || !user?.id) return
    setContactLoading(true)
    try {
      const conversationId = await createConversationIfNeeded(
        user.id,
        order.buyerId,
        { id: order.productId, title: order.productTitle },
      )
      navigation.navigate('Chat', {
        conversationId,
        productInfo: {
          id: order.productId,
          title: order.productTitle,
          price: order.amount,
          image: order.productImage,
          sellerId: user.id,
          sellerName: user.name || '',
        },
      })
    } catch {
      Alert.alert('Error', 'No se pudo abrir el chat con el comprador.')
    } finally {
      setContactLoading(false)
    }
  }

  // ── Loading / error states ──────────────────────────────────────────────────

  if (loading && !order) {
    return (
      <SafeAreaView style={s.safe}>
        <StatusBar barStyle="dark-content" backgroundColor="#fff" />
        <View style={s.centered}>
          <ActivityIndicator size="large" color="#059669" />
          <Text style={s.muted}>Cargando pedido...</Text>
        </View>
      </SafeAreaView>
    )
  }

  if (error || !order) {
    return (
      <SafeAreaView style={s.safe}>
        <StatusBar barStyle="dark-content" backgroundColor="#fff" />
        <View style={s.header}>
          <TouchableOpacity style={s.headerBtn} onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color="#111827" />
          </TouchableOpacity>
          <Text style={s.headerTitle}>Detalle de venta</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={s.centered}>
          <Ionicons name="alert-circle-outline" size={48} color="#9ca3af" />
          <Text style={s.errorText}>{error ?? 'Pedido no disponible'}</Text>
          <TouchableOpacity style={s.retryBtn} onPress={() => load()}>
            <Text style={s.retryText}>Reintentar</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    )
  }

  // ── Derived ─────────────────────────────────────────────────────────────────

  const statusInfo = getStatusInfo(order.status)
  const stepStates = getTimelineStepStates(order.status)
  const initials = order.buyerName
    ? order.buyerName
        .split(' ')
        .map((w) => w[0])
        .slice(0, 2)
        .join('')
        .toUpperCase()
    : 'C'
  const sizeRows = order.sizeQuantities
    ? Object.entries(order.sizeQuantities).filter(([, qty]) => qty > 0)
    : null

  // ── Main render ─────────────────────────────────────────────────────────────

  return (
    <SafeAreaView style={s.safe}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />

      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity style={s.headerBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#111827" />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={s.headerTitle}>Pedido {order.orderCode}</Text>
          <Text style={s.headerSub}>{formatOrderDate(order.createdAt)}</Text>
        </View>
        <View
          style={[s.statusBadge, { backgroundColor: `${statusInfo.color}20` }]}
        >
          <Ionicons
            name={statusInfo.icon as any}
            size={15}
            color={statusInfo.color}
          />
          <Text style={[s.statusBadgeText, { color: statusInfo.color }]}>
            {statusInfo.label}
          </Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={s.scroll}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true)
              load(true)
            }}
            tintColor="#059669"
          />
        }
      >
        {/* Cancelled banner */}
        {order.status === 'cancelled' && (
          <View style={s.cancelBanner}>
            <Ionicons name="close-circle" size={18} color="#b91c1c" />
            <Text style={s.cancelBannerText}>Este pedido fue cancelado.</Text>
          </View>
        )}

        {/* ── Buyer card ─────────────────────────────────────────────────── */}
        <View style={s.card}>
          <Text style={s.cardTitle}>Comprador</Text>
          <View style={s.buyerRow}>
            {order.buyerAvatar ? (
              <Image source={{ uri: order.buyerAvatar }} style={s.avatar} />
            ) : (
              <View style={s.avatarPlaceholder}>
                <Text style={s.avatarInitials}>{initials}</Text>
              </View>
            )}
            <View style={{ flex: 1 }}>
              <Text style={s.buyerName}>{order.buyerName || 'Cliente'}</Text>
              <Text style={s.buyerSub}>ID: {order.buyerId.slice(0, 8)}…</Text>
            </View>
            <TouchableOpacity
              style={s.msgBtn}
              onPress={handleMessage}
              disabled={contactLoading}
            >
              {contactLoading ? (
                <ActivityIndicator size="small" color="#059669" />
              ) : (
                <>
                  <Ionicons name="chatbubble-outline" size={16} color="#059669" />
                  <Text style={s.msgBtnText}>Mensaje</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* ── Product card ───────────────────────────────────────────────── */}
        <View style={s.card}>
          <Text style={s.cardTitle}>Producto</Text>
          <TouchableOpacity
            style={s.productRow}
            onPress={() =>
              navigation.navigate('ProductDetail', { productId: order.productId })
            }
          >
            {order.productImage ? (
              <Image source={{ uri: order.productImage }} style={s.productImg} />
            ) : (
              <View style={[s.productImg, s.productImgPlaceholder]}>
                <Ionicons name="shirt-outline" size={24} color="#9ca3af" />
              </View>
            )}
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={s.productTitle}>{order.productTitle}</Text>
              <Text style={s.productLine}>{order.lineSummary}</Text>
              {sizeRows && sizeRows.length > 0 && (
                <View style={s.sizeGrid}>
                  {sizeRows.map(([size, qty]) => (
                    <View key={size} style={s.sizeChip}>
                      <Text style={s.sizeChipText}>
                        {size} × {qty}
                      </Text>
                    </View>
                  ))}
                </View>
              )}
            </View>
            <Ionicons name="chevron-forward" size={18} color="#9ca3af" />
          </TouchableOpacity>
        </View>

        {/* ── Payment summary ────────────────────────────────────────────── */}
        <View style={s.card}>
          <Text style={s.cardTitle}>Resumen del pago</Text>
          <View style={s.summaryRow}>
            <Text style={s.summaryLabel}>
              {order.unitCount > 1
                ? `Subtotal (${order.unitCount} artículos)`
                : 'Subtotal'}
            </Text>
            <Text style={s.summaryValue}>{formatOrderCurrency(order.amount)}</Text>
          </View>
          {order.includeInsurance && (
            <View style={s.summaryRow}>
              <Text style={s.summaryLabel}>Seguro de envío</Text>
              <Text style={s.summaryValue}>Incluido</Text>
            </View>
          )}
          <View style={[s.summaryRow, s.summaryTotal]}>
            <Text style={s.summaryTotalLabel}>Total cobrado</Text>
            <Text style={s.summaryTotalValue}>
              {formatOrderCurrency(order.amount)}
            </Text>
          </View>
        </View>

        {/* ── Delivery card ──────────────────────────────────────────────── */}
        <View style={s.card}>
          <Text style={s.cardTitle}>Entrega</Text>
          <View style={s.deliveryRow}>
            <View style={s.deliveryIcon}>
              <Ionicons
                name={
                  order.shippingMethodId === 'pickup'
                    ? 'storefront-outline'
                    : 'car-outline'
                }
                size={18}
                color="#2563eb"
              />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={s.deliveryMethod}>{order.shippingLabel}</Text>
              {order.deliveryCity ? (
                <Text style={s.deliverySub}>Ciudad: {order.deliveryCity}</Text>
              ) : null}
              {order.deliveryAddressSummary ? (
                <Text style={s.deliverySub}>
                  Dirección: {order.deliveryAddressSummary}
                </Text>
              ) : null}
              {order.includeInsurance ? (
                <View style={s.insurancePill}>
                  <Ionicons name="shield-checkmark-outline" size={13} color="#059669" />
                  <Text style={s.insurancePillText}>Seguro incluido</Text>
                </View>
              ) : null}
            </View>
          </View>

          {/* Tracking */}
          {order.trackingNumber ? (
            <View style={s.trackingBox}>
              <View style={s.trackingHeader}>
                <Ionicons name="barcode-outline" size={16} color="#6b7280" />
                <Text style={s.trackingLabel}>Número de seguimiento</Text>
              </View>
              <Text style={s.trackingValue}>{order.trackingNumber}</Text>
              {order.estimatedDelivery ? (
                <Text style={s.trackingEta}>
                  Entrega estimada:{' '}
                  {formatOrderDate(new Date(order.estimatedDelivery))}
                </Text>
              ) : null}
            </View>
          ) : order.status === 'shipped' ? (
            <Text style={s.trackingMissing}>
              Sin número de seguimiento registrado.
            </Text>
          ) : null}
        </View>

        {/* ── Timeline ───────────────────────────────────────────────────── */}
        <View style={s.card}>
          <Text style={s.cardTitle}>Estado del pedido</Text>
          {ORDER_TIMELINE_STEPS.map((step, index) => {
            const state = stepStates[index]
            const isLast = index === ORDER_TIMELINE_STEPS.length - 1
            return (
              <View key={step.status} style={tl.row}>
                <View style={tl.rail}>
                  <TimelineDot state={state} />
                  {!isLast && (
                    <View
                      style={[
                        tl.line,
                        state === 'done' && tl.lineDone,
                        state === 'current' && tl.linePartial,
                      ]}
                    />
                  )}
                </View>
                <View style={[tl.content, !isLast && tl.contentSpaced]}>
                  <View style={tl.titleRow}>
                    <Ionicons
                      name={step.icon as any}
                      size={17}
                      color={
                        state === 'upcoming'
                          ? '#9ca3af'
                          : state === 'cancelled'
                            ? '#ef4444'
                            : '#059669'
                      }
                      style={{ marginRight: 6 }}
                    />
                    <Text
                      style={[
                        tl.label,
                        state === 'current' && tl.labelCurrent,
                        state === 'upcoming' && tl.labelMuted,
                      ]}
                    >
                      {step.label}
                    </Text>
                  </View>
                  <Text
                    style={state === 'current' ? tl.descActive : tl.desc}
                  >
                    {state === 'current' || state === 'done'
                      ? step.descriptionActive
                      : step.descriptionPending}
                  </Text>
                </View>
              </View>
            )
          })}
        </View>

        {/* ── Status actions ─────────────────────────────────────────────── */}
        <View style={s.actionsBlock}>
          {updatingId ? (
            <View style={s.updatingRow}>
              <ActivityIndicator size="small" color="#059669" />
              <Text style={s.updatingText}>Actualizando...</Text>
            </View>
          ) : (
            <>
              {order.status === 'pending' && (
                <>
                  <TouchableOpacity style={s.btnPrimary} onPress={handleConfirm}>
                    <Ionicons name="checkmark-circle-outline" size={18} color="#fff" />
                    <Text style={s.btnPrimaryText}>Confirmar pedido</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={s.btnDanger} onPress={handleCancelOrder}>
                    <Ionicons name="close-circle-outline" size={18} color="#b91c1c" />
                    <Text style={s.btnDangerText}>Cancelar pedido</Text>
                  </TouchableOpacity>
                </>
              )}
              {order.status === 'confirmed' && (
                <TouchableOpacity style={s.btnBlue} onPress={handleShip}>
                  <Ionicons name="car-outline" size={18} color="#fff" />
                  <Text style={s.btnPrimaryText}>Marcar como enviado</Text>
                </TouchableOpacity>
              )}
              {order.status === 'shipped' && (
                <TouchableOpacity style={s.btnPurple} onPress={handleDeliver}>
                  <Ionicons name="checkmark-done-outline" size={18} color="#fff" />
                  <Text style={s.btnPrimaryText}>Marcar como entregado</Text>
                </TouchableOpacity>
              )}
            </>
          )}

          <TouchableOpacity
            style={s.btnOutline}
            onPress={handleMessage}
            disabled={contactLoading}
          >
            {contactLoading ? (
              <ActivityIndicator size="small" color="#059669" />
            ) : (
              <>
                <Ionicons name="chatbubble-ellipses-outline" size={18} color="#059669" />
                <Text style={s.btnOutlineText}>Enviar mensaje al comprador</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Tracking modal */}
      <Modal
        visible={trackingModal}
        transparent
        animationType="fade"
        onRequestClose={() => setTrackingModal(false)}
      >
        <View style={s.modalOverlay}>
          <View style={s.modalCard}>
            <Text style={s.modalTitle}>Marcar como enviado</Text>
            <Text style={s.modalSub}>{order.productTitle}</Text>
            <Text style={s.modalLabel}>
              Número de tracking{' '}
              <Text style={s.modalOptional}>(opcional)</Text>
            </Text>
            <TextInput
              style={s.modalInput}
              placeholder="Ej: CAEX12345678DO"
              value={trackingInput}
              onChangeText={setTrackingInput}
              autoCapitalize="characters"
              returnKeyType="done"
              onSubmitEditing={handleConfirmShip}
            />
            <View style={s.modalActions}>
              <TouchableOpacity
                style={s.modalBtnSecondary}
                onPress={() => setTrackingModal(false)}
              >
                <Text style={s.modalBtnSecondaryText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={s.modalBtnPrimary}
                onPress={handleConfirmShip}
              >
                <Ionicons name="car-outline" size={15} color="#fff" />
                <Text style={s.modalBtnPrimaryText}>Confirmar envío</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  )
}

// ── Timeline styles (shared with OrderDetailScreen look) ──────────────────────

const tl = StyleSheet.create({
  row: { flexDirection: 'row' },
  rail: { width: 28, alignItems: 'center' },
  dot: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dotDone: { backgroundColor: '#22c55e' },
  dotCurrent: { backgroundColor: '#059669', borderWidth: 2, borderColor: '#a7f3d0' },
  dotInner: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#fff' },
  dotUpcoming: { backgroundColor: '#e5e7eb', borderWidth: 2, borderColor: '#d1d5db' },
  dotCancelled: { backgroundColor: '#ef4444' },
  line: {
    flex: 1,
    width: 2,
    backgroundColor: '#e5e7eb',
    marginVertical: 4,
    minHeight: 24,
  },
  lineDone: { backgroundColor: '#22c55e' },
  linePartial: { backgroundColor: '#a7f3d0' },
  content: { flex: 1, paddingLeft: 10 },
  contentSpaced: { paddingBottom: 18 },
  titleRow: { flexDirection: 'row', alignItems: 'center' },
  label: { fontSize: 14, fontWeight: '600', color: '#374151', flex: 1 },
  labelCurrent: { color: '#059669' },
  labelMuted: { color: '#9ca3af' },
  desc: { fontSize: 12, color: '#9ca3af', marginTop: 4, lineHeight: 17 },
  descActive: {
    fontSize: 12,
    color: '#047857',
    marginTop: 4,
    lineHeight: 17,
    fontWeight: '500',
  },
})

// ── Main styles ───────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#f3f4f6' },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    gap: 10,
  },
  headerBtn: {
    padding: 6,
    borderRadius: 20,
    backgroundColor: '#f3f4f6',
  },
  headerTitle: { fontSize: 17, fontWeight: '700', color: '#111827' },
  headerSub: { fontSize: 11, color: '#9ca3af', marginTop: 1 },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 5,
    gap: 4,
  },
  statusBadgeText: { fontSize: 11, fontWeight: '700' },

  // Scroll
  scroll: { padding: 16, paddingBottom: 48, gap: 12 },

  // Banners
  cancelBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fef2f2',
    borderRadius: 10,
    padding: 12,
    gap: 8,
  },
  cancelBannerText: { color: '#b91c1c', fontSize: 13, fontWeight: '600' },

  // States
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    gap: 12,
  },
  muted: { color: '#6b7280', fontSize: 14 },
  errorText: { color: '#dc2626', textAlign: 'center', fontSize: 14 },
  retryBtn: {
    backgroundColor: '#059669',
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryText: { color: '#fff', fontWeight: '600' },

  // Card
  card: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 16,
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 12,
  },

  // Buyer row
  buyerRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatar: { width: 44, height: 44, borderRadius: 22 },
  avatarPlaceholder: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#f0fdf4',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitials: { fontSize: 16, fontWeight: '700', color: '#059669' },
  buyerName: { fontSize: 15, fontWeight: '600', color: '#111827' },
  buyerSub: { fontSize: 11, color: '#9ca3af', marginTop: 2 },
  msgBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    borderWidth: 1,
    borderColor: '#059669',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  msgBtnText: { color: '#059669', fontWeight: '600', fontSize: 13 },

  // Product row
  productRow: { flexDirection: 'row', alignItems: 'flex-start' },
  productImg: {
    width: 76,
    height: 76,
    borderRadius: 10,
    backgroundColor: '#f3f4f6',
  },
  productImgPlaceholder: { alignItems: 'center', justifyContent: 'center' },
  productTitle: { fontSize: 14, fontWeight: '600', color: '#111827', lineHeight: 20 },
  productLine: { fontSize: 12, color: '#6b7280', marginTop: 3 },
  sizeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 5, marginTop: 6 },
  sizeChip: {
    backgroundColor: '#f3f4f6',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  sizeChipText: { fontSize: 11, fontWeight: '600', color: '#374151' },

  // Payment summary
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  summaryLabel: { fontSize: 13, color: '#6b7280' },
  summaryValue: { fontSize: 13, color: '#374151' },
  summaryTotal: {
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    paddingTop: 10,
    marginTop: 4,
    marginBottom: 0,
  },
  summaryTotalLabel: { fontSize: 14, fontWeight: '700', color: '#111827' },
  summaryTotalValue: { fontSize: 16, fontWeight: '700', color: '#059669' },

  // Delivery
  deliveryRow: { flexDirection: 'row', gap: 12, alignItems: 'flex-start' },
  deliveryIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#eff6ff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  deliveryMethod: { fontSize: 14, fontWeight: '600', color: '#111827' },
  deliverySub: { fontSize: 13, color: '#6b7280', marginTop: 4, lineHeight: 18 },
  insurancePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 8,
    backgroundColor: '#f0fdf4',
    alignSelf: 'flex-start',
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  insurancePillText: { fontSize: 11, color: '#059669', fontWeight: '600' },
  trackingBox: {
    backgroundColor: '#f9fafb',
    borderRadius: 8,
    padding: 12,
    marginTop: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  trackingHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 },
  trackingLabel: { fontSize: 12, color: '#6b7280' },
  trackingValue: { fontSize: 14, fontWeight: '700', color: '#111827', fontFamily: 'monospace' },
  trackingEta: { fontSize: 12, color: '#059669', marginTop: 4 },
  trackingMissing: { fontSize: 12, color: '#9ca3af', marginTop: 10 },

  // Actions
  actionsBlock: { gap: 10 },
  updatingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 16,
  },
  updatingText: { color: '#6b7280', fontSize: 14 },
  btnPrimary: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#059669',
    borderRadius: 12,
    paddingVertical: 14,
    gap: 8,
  },
  btnBlue: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2563eb',
    borderRadius: 12,
    paddingVertical: 14,
    gap: 8,
  },
  btnPurple: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#7c3aed',
    borderRadius: 12,
    paddingVertical: 14,
    gap: 8,
  },
  btnPrimaryText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  btnOutline: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: '#059669',
    gap: 8,
  },
  btnOutlineText: { color: '#059669', fontWeight: '700', fontSize: 15 },
  btnDanger: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fef2f2',
    borderRadius: 12,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: '#fecaca',
    gap: 8,
  },
  btnDangerText: { color: '#b91c1c', fontWeight: '700', fontSize: 15 },

  // Modal
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
  modalTitle: { fontSize: 17, fontWeight: '700', color: '#111827', marginBottom: 4 },
  modalSub: { fontSize: 13, color: '#6b7280', marginBottom: 20 },
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
