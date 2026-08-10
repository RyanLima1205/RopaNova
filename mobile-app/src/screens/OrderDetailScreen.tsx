import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  SafeAreaView,
  StatusBar,
  TouchableOpacity,
  Image,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, useFocusEffect, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../../App';
import { useAuth } from '../contexts/AuthContext';
import {
  fetchOrderForBuyer,
  cancelOrderAsBuyer,
  type BuyerOrder,
  type OrderStatus,
} from '../services/orderService';
import { createConversationIfNeeded } from '../services/chatService';
import {
  getStatusInfo,
  ORDER_TIMELINE_STEPS,
  getTimelineStepStates,
  formatOrderCurrency,
  formatOrderDate,
  type TimelineStepState,
} from '../utils/orderStatus';

type Nav = StackNavigationProp<RootStackParamList, 'OrderDetail'>;
type Route = RouteProp<RootStackParamList, 'OrderDetail'>;

/** Cancelable mientras no haya sido despachado (ropanova.com/devoluciones §7). */
const canCancelPending = (s: OrderStatus) => s === 'pending' || s === 'confirmed';

function TimelineDot({ state }: { state: TimelineStepState }) {
  if (state === 'done') {
    return (
      <View style={[styles.dot, styles.dotDone]}>
        <Ionicons name="checkmark" size={14} color="#fff" />
      </View>
    );
  }
  if (state === 'current') {
    return (
      <View style={[styles.dot, styles.dotCurrent]}>
        <View style={styles.dotInner} />
      </View>
    );
  }
  if (state === 'cancelled') {
    return (
      <View style={[styles.dot, styles.dotCancelled]}>
        <Ionicons name="close" size={14} color="#fff" />
      </View>
    );
  }
  return <View style={[styles.dot, styles.dotUpcoming]} />;
}

export const OrderDetailScreen: React.FC = () => {
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const { orderId } = route.params;
  const { user } = useAuth();
  const [order, setOrder] = useState<BuyerOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [contactLoading, setContactLoading] = useState(false);

  const load = useCallback(async () => {
    if (!user?.id || user.id === 'guest') {
      setError('Inicia sesión para ver este pedido.');
      setOrder(null);
      setLoading(false);
      setRefreshing(false);
      return;
    }
    setError(null);
    try {
      const row = await fetchOrderForBuyer(orderId, user.id);
      if (!row) {
        setError('Pedido no encontrado.');
        setOrder(null);
      } else {
        setOrder(row);
      }
    } catch {
      setError('No se pudo cargar el pedido.');
      setOrder(null);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [orderId, user?.id]);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      load();
    }, [load]),
  );

  const onRefresh = () => {
    setRefreshing(true);
    load();
  };

  const handleCancel = () => {
    if (!order || !user?.id) return;
    Alert.alert(
      'Cancelar pedido',
      `¿Anular el pedido ${order.orderCode}? Solo es posible mientras está pendiente (antes de que el vendedor lo confirme).`,
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Sí, cancelar',
          style: 'destructive',
          onPress: async () => {
            try {
              await cancelOrderAsBuyer(order.id, user.id);
              await load();
            } catch {
              Alert.alert('Error', 'No se pudo cancelar el pedido.');
            }
          },
        },
      ],
    );
  };

  const handleContactSeller = async () => {
    if (!order || !user?.id) return;
    setContactLoading(true);
    try {
      const conversationId = await createConversationIfNeeded(user.id, order.sellerId, {
        id: order.productId,
        title: order.productTitle,
      });
      navigation.navigate('Chat', {
        conversationId,
        productInfo: {
          id: order.productId,
          title: order.productTitle,
          price: order.amount,
          image: order.productImage,
          sellerId: order.sellerId,
          sellerName: order.sellerName,
        },
      });
    } catch {
      Alert.alert('Error', 'No se pudo abrir el chat con el vendedor.');
    } finally {
      setContactLoading(false);
    }
  };

  if (loading && !order) {
    return (
      <SafeAreaView style={styles.safe}>
        <StatusBar barStyle="dark-content" backgroundColor="#fff" />
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#059669" />
          <Text style={styles.muted}>Cargando pedido...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error || !order) {
    return (
      <SafeAreaView style={styles.safe}>
        <StatusBar barStyle="dark-content" backgroundColor="#fff" />
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerBtn}>
            <Ionicons name="arrow-back" size={24} color="#111827" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Detalle del pedido</Text>
        </View>
        <View style={styles.centered}>
          <Ionicons name="alert-circle-outline" size={48} color="#9ca3af" />
          <Text style={styles.errorText}>{error ?? 'Pedido no disponible'}</Text>
          <TouchableOpacity onPress={load} style={styles.retryBtn}>
            <Text style={styles.retryText}>Reintentar</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const statusInfo = getStatusInfo(order.status);
  const stepStates = getTimelineStepStates(order.status);
  const detailLine =
    order.unitCount > 1 || (order.lineSummary && order.lineSummary !== '—')
      ? `${order.lineSummary}${order.unitCount > 0 ? ` · ${order.unitCount} ${order.unitCount === 1 ? 'artículo' : 'artículos'}` : ''}`
      : null;

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerBtn} accessibilityLabel="Volver">
          <Ionicons name="arrow-back" size={24} color="#111827" />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>Pedido {order.orderCode}</Text>
          <Text style={styles.headerSub}>{formatOrderDate(order.createdAt)}</Text>
        </View>
        <View style={[styles.badge, { backgroundColor: statusInfo.color + '22' }]}>
          <Ionicons name={statusInfo.icon as keyof typeof Ionicons.glyphMap} size={16} color={statusInfo.color} />
          <Text style={[styles.badgeText, { color: statusInfo.color }]}>{statusInfo.label}</Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#059669" />}
      >
        {order.status === 'cancelled' ? (
          <View style={styles.cancelBanner}>
            <Ionicons name="close-circle" size={20} color="#b91c1c" />
            <Text style={styles.cancelBannerText}>Este pedido fue cancelado.</Text>
          </View>
        ) : (
          <View style={styles.hintBanner}>
            <Ionicons name="information-circle-outline" size={20} color="#059669" />
            <Text style={styles.hintBannerText}>
              Consulta aquí el estado de tu pedido. El vendedor actualizará cada etapa cuando corresponda.
            </Text>
          </View>
        )}

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Estado del pedido</Text>
          {ORDER_TIMELINE_STEPS.map((step, index) => {
            const state = stepStates[index];
            const isLast = index === ORDER_TIMELINE_STEPS.length - 1;
            const description =
              state === 'current' || state === 'done'
                ? step.descriptionActive
                : step.descriptionPending;
            return (
              <View key={step.status} style={styles.timelineRow}>
                <View style={styles.timelineRail}>
                  <TimelineDot state={state} />
                  {!isLast ? (
                    <View
                      style={[
                        styles.timelineLine,
                        state === 'done' && styles.timelineLineDone,
                        state === 'current' && styles.timelineLinePartial,
                      ]}
                    />
                  ) : null}
                </View>
                <View style={[styles.timelineContent, !isLast && styles.timelineContentSpaced]}>
                  <View style={styles.timelineTitleRow}>
                    <Ionicons
                      name={step.icon as keyof typeof Ionicons.glyphMap}
                      size={18}
                      color={state === 'upcoming' ? '#9ca3af' : state === 'cancelled' ? '#ef4444' : '#059669'}
                      style={{ marginRight: 6 }}
                    />
                    <Text
                      style={[
                        styles.timelineLabel,
                        state === 'current' && styles.timelineLabelCurrent,
                        state === 'upcoming' && styles.timelineLabelMuted,
                      ]}
                    >
                      {step.label}
                    </Text>
                  </View>
                  {state === 'current' ? (
                    <Text style={styles.timelineDescActive}>{description}</Text>
                  ) : (
                    <Text style={styles.timelineDesc}>{description}</Text>
                  )}
                </View>
              </View>
            );
          })}
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Producto</Text>
          <TouchableOpacity
            style={styles.productRow}
            onPress={() => navigation.navigate('ProductDetail', { productId: order.productId })}
            accessibilityRole="button"
            accessibilityLabel="Ver producto"
          >
            {order.productImage ? (
              <Image source={{ uri: order.productImage }} style={styles.productImg} />
            ) : (
              <View style={[styles.productImg, { justifyContent: 'center', alignItems: 'center' }]}>
                <Ionicons name="image-outline" size={32} color="#d1d5db" />
              </View>
            )}
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={styles.productTitle}>{order.productTitle}</Text>
              {detailLine ? <Text style={styles.productDetail}>{detailLine}</Text> : null}
              <Text style={styles.price}>{formatOrderCurrency(order.amount)}</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
          </TouchableOpacity>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Vendedor</Text>
          <TouchableOpacity
            style={styles.sellerRow}
            onPress={() => navigation.navigate('UserProfile', { viewUserId: order.sellerId })}
          >
            {order.sellerAvatar ? (
              <Image source={{ uri: order.sellerAvatar }} style={styles.sellerAvatar} />
            ) : (
              <View style={[styles.sellerAvatar, { backgroundColor: '#e5e7eb', justifyContent: 'center', alignItems: 'center' }]}>
                <Ionicons name="person" size={20} color="#9ca3af" />
              </View>
            )}
            <Text style={styles.sellerName}>{order.sellerName}</Text>
            <Ionicons name="chevron-forward" size={18} color="#9ca3af" />
          </TouchableOpacity>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Envío</Text>
          <Text style={styles.infoLine}>{order.shippingLabel}</Text>
          {order.deliveryAddressSummary ? (
            <Text style={styles.infoSub}>Dirección: {order.deliveryAddressSummary}</Text>
          ) : null}
          {order.deliveryCity ? <Text style={styles.infoSub}>Ciudad: {order.deliveryCity}</Text> : null}
          {order.includeInsurance ? (
            <Text style={styles.infoSub}>Seguro de envío incluido</Text>
          ) : null}
          {order.trackingNumber ? (
            <View style={styles.trackingBox}>
              <Text style={styles.trackingLabel}>N° de seguimiento</Text>
              <Text style={styles.trackingValue}>{order.trackingNumber}</Text>
              {order.estimatedDelivery ? (
                <Text style={styles.trackingEta}>
                  Entrega estimada: {formatOrderDate(new Date(order.estimatedDelivery))}
                </Text>
              ) : null}
            </View>
          ) : order.status === 'shipped' ? (
            <Text style={styles.infoSub}>El vendedor aún no ha añadido un número de seguimiento.</Text>
          ) : null}
        </View>

        <View style={styles.actionsBlock}>
          {canCancelPending(order.status) ? (
            <TouchableOpacity style={styles.btnDanger} onPress={handleCancel}>
              <Ionicons name="close-circle-outline" size={18} color="#b91c1c" />
              <Text style={styles.btnDangerText}>Cancelar pedido</Text>
            </TouchableOpacity>
          ) : null}

          {order.status === 'delivered' &&
            (order.hasReview || order.reviewId ? (
              <View style={styles.btnMuted}>
                <Ionicons name="checkmark-circle" size={18} color="#16a34a" />
                <Text style={styles.btnMutedText}>Reseña enviada</Text>
              </View>
            ) : (
              <TouchableOpacity
                style={styles.btnPrimary}
                onPress={() => navigation.navigate('WriteReview', { orderId: order.id })}
              >
                <Ionicons name="star-outline" size={18} color="#fff" />
                <Text style={styles.btnPrimaryText}>Dejar reseña</Text>
              </TouchableOpacity>
            ))}

          <TouchableOpacity
            style={styles.btnOutline}
            onPress={handleContactSeller}
            disabled={contactLoading}
          >
            {contactLoading ? (
              <ActivityIndicator size="small" color="#059669" />
            ) : (
              <>
                <Ionicons name="chatbubble-outline" size={18} color="#059669" />
                <Text style={styles.btnOutlineText}>Contactar vendedor</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#f9fafb' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    gap: 8,
  },
  headerBtn: { padding: 8, borderRadius: 20, backgroundColor: '#f3f4f6' },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#111827' },
  headerSub: { fontSize: 12, color: '#9ca3af', marginTop: 2 },
  badge: { flexDirection: 'row', alignItems: 'center', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4, gap: 4 },
  badgeText: { fontWeight: 'bold', fontSize: 11 },
  scrollContent: { padding: 16, paddingBottom: 40 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  muted: { marginTop: 12, color: '#6b7280' },
  errorText: { marginTop: 12, color: '#dc2626', textAlign: 'center' },
  retryBtn: { marginTop: 16 },
  retryText: { color: '#059669', fontWeight: '600' },
  hintBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#ecfdf5',
    borderRadius: 10,
    padding: 12,
    marginBottom: 12,
    gap: 8,
  },
  hintBannerText: { flex: 1, color: '#065f46', fontSize: 13, lineHeight: 18 },
  cancelBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fef2f2',
    borderRadius: 10,
    padding: 12,
    marginBottom: 12,
    gap: 8,
  },
  cancelBannerText: { color: '#b91c1c', fontSize: 13, fontWeight: '600' },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  sectionTitle: { fontWeight: 'bold', fontSize: 15, color: '#111827', marginBottom: 12 },
  timelineRow: { flexDirection: 'row' },
  timelineRail: { width: 28, alignItems: 'center' },
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
  timelineLine: { flex: 1, width: 2, backgroundColor: '#e5e7eb', marginVertical: 4, minHeight: 24 },
  timelineLineDone: { backgroundColor: '#22c55e' },
  timelineLinePartial: { backgroundColor: '#a7f3d0' },
  timelineContent: { flex: 1, paddingLeft: 8 },
  timelineContentSpaced: { paddingBottom: 20 },
  timelineTitleRow: { flexDirection: 'row', alignItems: 'center' },
  timelineLabel: { fontWeight: '600', fontSize: 14, color: '#374151', flex: 1 },
  timelineLabelCurrent: { color: '#059669' },
  timelineLabelMuted: { color: '#9ca3af' },
  timelineDesc: { fontSize: 12, color: '#9ca3af', marginTop: 4, lineHeight: 17 },
  timelineDescActive: { fontSize: 12, color: '#047857', marginTop: 4, lineHeight: 17, fontWeight: '500' },
  productRow: { flexDirection: 'row', alignItems: 'center' },
  productImg: { width: 72, height: 72, borderRadius: 10, backgroundColor: '#f3f4f6' },
  productTitle: { fontWeight: 'bold', fontSize: 15, color: '#111827' },
  productDetail: { color: '#64748b', fontSize: 12, marginTop: 4 },
  price: { color: '#059669', fontWeight: 'bold', fontSize: 16, marginTop: 6 },
  sellerRow: { flexDirection: 'row', alignItems: 'center' },
  sellerAvatar: { width: 40, height: 40, borderRadius: 20, marginRight: 10 },
  sellerName: { flex: 1, fontWeight: '600', color: '#111827' },
  infoLine: { color: '#374151', fontSize: 14 },
  infoSub: { color: '#6b7280', fontSize: 13, marginTop: 6 },
  trackingBox: { backgroundColor: '#f3f4f6', borderRadius: 8, padding: 10, marginTop: 10 },
  trackingLabel: { color: '#6b7280', fontSize: 12 },
  trackingValue: { color: '#111827', fontWeight: 'bold', fontSize: 14, marginTop: 2 },
  trackingEta: { color: '#059669', fontSize: 12, marginTop: 4 },
  actionsBlock: { gap: 10, marginTop: 4 },
  btnPrimary: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#059669',
    borderRadius: 10,
    paddingVertical: 14,
    gap: 8,
  },
  btnPrimaryText: { color: '#fff', fontWeight: 'bold', fontSize: 15 },
  btnOutline: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    borderRadius: 10,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: '#059669',
    gap: 8,
  },
  btnOutlineText: { color: '#059669', fontWeight: 'bold', fontSize: 15 },
  btnDanger: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fef2f2',
    borderRadius: 10,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: '#fecaca',
    gap: 8,
  },
  btnDangerText: { color: '#b91c1c', fontWeight: 'bold', fontSize: 15 },
  btnMuted: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f0fdf4',
    borderRadius: 10,
    paddingVertical: 14,
    gap: 8,
  },
  btnMutedText: { color: '#16a34a', fontWeight: '600', fontSize: 15 },
});

export default OrderDetailScreen;
