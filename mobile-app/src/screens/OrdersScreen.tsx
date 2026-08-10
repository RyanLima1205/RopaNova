import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  SafeAreaView,
  StatusBar,
  TouchableOpacity,
  Image,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../../App';
import { useAuth } from '../contexts/AuthContext';
import { fetchOrdersForBuyer, cancelOrderAsBuyer, type BuyerOrder, type OrderStatus } from '../services/orderService';
import { getStatusInfo, formatOrderCurrency, formatOrderDate } from '../utils/orderStatus';
import { createConversationIfNeeded } from '../services/chatService';
import { Header } from '../components/Header';
import { EmptyState } from '../components/EmptyState';
import { brandColors, radii, semanticColors, shadows, spacing, typography } from '../theme';

export const OrdersScreen: React.FC = () => {
  const navigation = useNavigation<StackNavigationProp<RootStackParamList, 'OrdersScreen'>>();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'all' | 'active' | 'delivered' | 'cancelled'>('all');
  const [orders, setOrders] = useState<BuyerOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!user?.id || user.id === 'guest') {
      setOrders([]);
      setLoading(false);
      setError(null);
      return;
    }
    setError(null);
    try {
      const list = await fetchOrdersForBuyer(user.id);
      setOrders(list);
    } catch {
      setError('No se pudieron cargar los pedidos.');
      setOrders([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user?.id]);

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

  const filterList = (list: BuyerOrder[]): BuyerOrder[] => {
    switch (activeTab) {
      case 'active':
        return list.filter((o) => ['pending', 'confirmed', 'shipped'].includes(o.status));
      case 'delivered':
        return list.filter((o) => o.status === 'delivered');
      case 'cancelled':
        return list.filter((o) => o.status === 'cancelled');
      default:
        return list;
    }
  };

  const filteredOrders = filterList(orders);

  /** Cancelable mientras no haya sido despachado (ropanova.com/devoluciones §7); para cambios hay que anular y volver a comprar (v2: edición). */
  const canCancelPending = (s: OrderStatus) => s === 'pending' || s === 'confirmed';

  const OrderCard = ({ order }: { order: BuyerOrder }) => {
    const statusInfo = getStatusInfo(order.status);
    const titleLine = order.productTitle;
    const detailLine =
      order.unitCount > 1 || (order.lineSummary && order.lineSummary !== '—')
        ? `${order.lineSummary}${order.unitCount > 0 ? ` · ${order.unitCount} ${order.unitCount === 1 ? 'artículo' : 'artículos'}` : ''}`
        : null;

    const openDetail = () => navigation.navigate('OrderDetail', { orderId: order.id });

    return (
      <View style={styles.card}>
        <TouchableOpacity onPress={openDetail} activeOpacity={0.85} accessibilityRole="button" accessibilityLabel={`Ver detalle del pedido ${order.orderCode}`}>
        <View style={styles.cardHeader}>
          <View style={{ flex: 1 }}>
            <Text style={styles.cardTitle}>Pedido {order.orderCode}</Text>
            <Text style={styles.cardDate}>{formatOrderDate(order.createdAt)}</Text>
          </View>
          <View style={[styles.badge, { backgroundColor: statusInfo.color + '22' }]}>
            <Ionicons name={statusInfo.icon as any} size={16} color={statusInfo.color} style={{ marginRight: 4 }} />
            <Text style={{ color: statusInfo.color, fontWeight: 'bold', fontSize: 12 }}>{statusInfo.label}</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={brandColors.textMuted} style={{ marginLeft: 4 }} />
        </View>
        <View style={styles.cardContent}>
          {order.productImage ? (
            <Image source={{ uri: order.productImage }} style={styles.productImg} />
          ) : (
            <View style={[styles.productImg, { justifyContent: 'center', alignItems: 'center' }]}>
              <Ionicons name="image-outline" size={28} color={brandColors.textMuted} />
            </View>
          )}
          <View style={{ flex: 1, marginLeft: 10 }}>
            <Text style={styles.productTitle}>{titleLine}</Text>
            {detailLine ? <Text style={styles.productDetail}>{detailLine}</Text> : null}
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 2, marginTop: 4 }}>
              {order.sellerAvatar ? (
                <Image source={{ uri: order.sellerAvatar }} style={styles.sellerAvatar} />
              ) : (
                <View style={[styles.sellerAvatar, { backgroundColor: brandColors.surfaceSecondary, justifyContent: 'center', alignItems: 'center' }]}>
                  <Ionicons name="person" size={12} color={brandColors.textMuted} />
                </View>
              )}
              <Text style={styles.sellerName}>{order.sellerName}</Text>
            </View>
            <Text style={styles.shippingHint} numberOfLines={2}>
              {order.shippingLabel}
            </Text>
            <Text style={styles.price}>{formatOrderCurrency(order.amount)}</Text>
          </View>
        </View>
        </TouchableOpacity>
        {order.trackingNumber ? (
          <View style={styles.trackingBox}>
            <Text style={styles.trackingLabel}>N° seguimiento:</Text>
            <Text style={styles.trackingValue}>{order.trackingNumber}</Text>
            {order.estimatedDelivery ? (
              <Text style={styles.trackingDelivery}>Entrega estimada: {formatOrderDate(new Date(order.estimatedDelivery))}</Text>
            ) : null}
          </View>
        ) : null}
        <View style={styles.actionsRow}>
          {canCancelPending(order.status) && user?.id ? (
            <TouchableOpacity
              style={styles.actionBtnDanger}
              onPress={() => {
                Alert.alert(
                  'Cancelar pedido',
                  `¿Anular el pedido ${order.orderCode}? Solo es posible mientras el pedido está pendiente (antes de que el vendedor lo confirme). Para cambiar tallas o envío, cancela y vuelve a realizar el pedido.`,
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
                          Alert.alert(
                            'Error',
                            'No se pudo cancelar. Solo puedes cancelar mientras el pedido está pendiente.',
                          );
                        }
                      },
                    },
                  ],
                );
              }}
            >
              <Ionicons name="close-circle-outline" size={16} color={semanticColors.error} style={{ marginRight: 4 }} />
              <Text style={[styles.actionText, { color: semanticColors.error }]}>Cancelar</Text>
            </TouchableOpacity>
          ) : null}
          {order.status === 'delivered' &&
            (order.hasReview || order.reviewId ? (
              <View style={styles.actionBtn}>
                <Ionicons name="checkmark-circle" size={16} color={semanticColors.success} style={{ marginRight: 4 }} />
                <Text style={[styles.actionText, { color: semanticColors.success }]}>Reseña enviada</Text>
              </View>
            ) : (
              <TouchableOpacity
                style={styles.actionBtn}
                onPress={() => navigation.navigate('WriteReview', { orderId: order.id })}
                accessibilityRole="button"
                accessibilityLabel="Dejar reseña"
              >
                <Ionicons name="star-outline" size={16} color={semanticColors.warning} style={{ marginRight: 4 }} />
                <Text style={styles.actionText}>Reseña</Text>
              </TouchableOpacity>
            ))}
          {order.status === 'shipped' && (
            <TouchableOpacity style={styles.actionBtn} onPress={openDetail}>
              <Ionicons name="car-outline" size={16} color={brandColors.primaryUI} style={{ marginRight: 4 }} />
              <Text style={styles.actionText}>Rastrear</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity
            style={styles.actionBtn}
            onPress={async () => {
              if (!user?.id) return;
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
                Alert.alert('Error', 'No se pudo abrir el chat.');
              }
            }}
          >
            <Ionicons name="chatbubble-outline" size={16} color={brandColors.primaryUI} style={{ marginRight: 4 }} />
            <Text style={styles.actionText}>Contactar</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionBtn} onPress={openDetail}>
            <Ionicons name="document-text-outline" size={16} color={brandColors.textSecondary} style={{ marginRight: 4 }} />
            <Text style={[styles.actionText, { color: brandColors.textSecondary }]}>Detalle</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  if (!user?.id || user.id === 'guest') {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: brandColors.background }}>
        <StatusBar barStyle="dark-content" backgroundColor={brandColors.surface} />
        <Header title="Mis Pedidos" onBack={() => navigation.goBack()} />
        <EmptyState icon="person-outline" title="Inicia sesión para ver tus pedidos" />
      </SafeAreaView>
    );
  }

  if (loading && orders.length === 0) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: brandColors.background, justifyContent: 'center', alignItems: 'center' }}>
        <StatusBar barStyle="dark-content" backgroundColor={brandColors.surface} />
        <ActivityIndicator size="large" color={brandColors.primaryUI} />
        <Text style={{ marginTop: 12, color: brandColors.textSecondary, fontFamily: typography.body.fontFamily }}>
          Cargando pedidos...
        </Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: brandColors.background }}>
      <StatusBar barStyle="dark-content" backgroundColor={brandColors.surface} />
      <Header title="Mis Pedidos" onBack={() => navigation.goBack()} />
      <View style={styles.tabsRow}>
        <TouchableOpacity style={[styles.tab, activeTab === 'all' && styles.tabActive]} onPress={() => setActiveTab('all')}>
          <Text style={[styles.tabText, activeTab === 'all' && styles.tabTextActive]}>Todos</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.tab, activeTab === 'active' && styles.tabActive]} onPress={() => setActiveTab('active')}>
          <Text style={[styles.tabText, activeTab === 'active' && styles.tabTextActive]}>Activos</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'delivered' && styles.tabActive]}
          onPress={() => setActiveTab('delivered')}
        >
          <Text style={[styles.tabText, activeTab === 'delivered' && styles.tabTextActive]}>Entregados</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'cancelled' && styles.tabActive]}
          onPress={() => setActiveTab('cancelled')}
        >
          <Text style={[styles.tabText, activeTab === 'cancelled' && styles.tabTextActive]}>Cancelados</Text>
        </TouchableOpacity>
      </View>
      {error ? (
        <View style={{ padding: spacing.lg }}>
          <Text style={{ color: semanticColors.error, textAlign: 'center', fontFamily: typography.body.fontFamily }}>{error}</Text>
          <TouchableOpacity onPress={load} style={{ marginTop: spacing.md, alignSelf: 'center' }}>
            <Text style={{ color: brandColors.primaryUI, fontFamily: typography.bodyMedium.fontFamily }}>Reintentar</Text>
          </TouchableOpacity>
        </View>
      ) : null}
      <FlatList
        data={filteredOrders}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: spacing.lg, paddingBottom: 32 }}
        renderItem={({ item }) => <OrderCard order={item} />}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={brandColors.primaryUI} />}
        ListEmptyComponent={
          !error ? (
            <EmptyState
              icon="cube-outline"
              title="No hay pedidos"
              subtitle={
                activeTab === 'all'
                  ? 'Aún no has realizado ningún pedido'
                  : `No tienes pedidos ${activeTab === 'active' ? 'activos' : activeTab === 'delivered' ? 'entregados' : 'cancelados'}`
              }
              actionLabel="Explorar Productos"
              onAction={() => (navigation as any).navigate('MainTabs', { screen: 'Home' })}
            />
          ) : null
        }
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  tabsRow: { flexDirection: 'row', justifyContent: 'space-between', backgroundColor: brandColors.surface, borderBottomWidth: 1, borderBottomColor: brandColors.border },
  tab: { flex: 1, alignItems: 'center', paddingVertical: spacing.md },
  tabActive: { borderBottomWidth: 2, borderBottomColor: brandColors.primaryUI },
  tabText: { color: brandColors.textSecondary, fontFamily: typography.bodyMedium.fontFamily, fontSize: 13 },
  tabTextActive: { color: brandColors.primaryUI },
  card: { backgroundColor: brandColors.surface, borderRadius: radii.card, marginBottom: spacing.lg, padding: spacing.md, borderWidth: 1, borderColor: brandColors.border, ...shadows.card },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: spacing.sm, gap: spacing.sm },
  cardTitle: { fontFamily: typography.bodyMedium.fontFamily, color: brandColors.textSecondary, fontSize: 13 },
  cardDate: { color: brandColors.textMuted, fontFamily: typography.caption.fontFamily, fontSize: 12 },
  badge: { flexDirection: 'row', alignItems: 'center', borderRadius: radii.pill, paddingHorizontal: spacing.sm, paddingVertical: 2 },
  cardContent: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: spacing.sm },
  productImg: { width: 60, height: 60, borderRadius: radii.small, backgroundColor: brandColors.surfaceSecondary },
  productTitle: { fontFamily: typography.cardTitle.fontFamily, color: brandColors.textPrimary, fontSize: 14, marginBottom: 2 },
  productDetail: { color: brandColors.textSecondary, fontFamily: typography.caption.fontFamily, fontSize: 12 },
  sellerAvatar: { width: 20, height: 20, borderRadius: 10, marginRight: 4 },
  sellerName: { color: brandColors.textSecondary, fontFamily: typography.caption.fontFamily, fontSize: 12 },
  shippingHint: { color: brandColors.textMuted, fontFamily: typography.caption.fontFamily, fontSize: 11, marginTop: 2 },
  price: { color: brandColors.primaryUI, fontFamily: typography.cardTitle.fontFamily, fontSize: 15, marginTop: spacing.xs },
  trackingBox: { backgroundColor: brandColors.surfaceSecondary, borderRadius: radii.small, padding: spacing.sm, marginBottom: spacing.sm },
  trackingLabel: { color: brandColors.textSecondary, fontFamily: typography.caption.fontFamily, fontSize: 12 },
  trackingValue: { color: brandColors.textPrimary, fontFamily: typography.bodyMedium.fontFamily, fontSize: 13 },
  trackingDelivery: { color: semanticColors.success, fontFamily: typography.caption.fontFamily, fontSize: 12, marginTop: 2 },
  actionsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginTop: spacing.xs },
  actionBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: brandColors.primaryExtraLight, borderRadius: radii.small, paddingVertical: spacing.sm, paddingHorizontal: spacing.md, marginRight: spacing.sm },
  actionBtnDanger: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: semanticColors.errorBackground,
    borderRadius: radii.small,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    marginRight: spacing.sm,
    borderWidth: 1,
    borderColor: semanticColors.error,
  },
  actionText: { color: brandColors.primaryUI, fontFamily: typography.bodyMedium.fontFamily, fontSize: 13 },
});

export default OrdersScreen;
