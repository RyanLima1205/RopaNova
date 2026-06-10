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

  /** Solo cancelar en pendiente; para cambios hay que anular y volver a comprar (v2: edición). */
  const canCancelPending = (s: OrderStatus) => s === 'pending';

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
          <Ionicons name="chevron-forward" size={18} color="#9ca3af" style={{ marginLeft: 4 }} />
        </View>
        <View style={styles.cardContent}>
          <Image
            source={{ uri: order.productImage || 'https://via.placeholder.com/120' }}
            style={styles.productImg}
          />
          <View style={{ flex: 1, marginLeft: 10 }}>
            <Text style={styles.productTitle}>{titleLine}</Text>
            {detailLine ? <Text style={styles.productDetail}>{detailLine}</Text> : null}
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 2, marginTop: 4 }}>
              <Image source={{ uri: order.sellerAvatar || 'https://via.placeholder.com/40' }} style={styles.sellerAvatar} />
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
              <Ionicons name="close-circle-outline" size={16} color="#b91c1c" style={{ marginRight: 4 }} />
              <Text style={[styles.actionText, { color: '#b91c1c' }]}>Cancelar</Text>
            </TouchableOpacity>
          ) : null}
          {order.status === 'delivered' &&
            (order.hasReview || order.reviewId ? (
              <View style={styles.actionBtn}>
                <Ionicons name="checkmark-circle" size={16} color="#22c55e" style={{ marginRight: 4 }} />
                <Text style={[styles.actionText, { color: '#16a34a' }]}>Reseña enviada</Text>
              </View>
            ) : (
              <TouchableOpacity
                style={styles.actionBtn}
                onPress={() => navigation.navigate('WriteReview', { orderId: order.id })}
                accessibilityRole="button"
                accessibilityLabel="Dejar reseña"
              >
                <Ionicons name="star-outline" size={16} color="#fbbf24" style={{ marginRight: 4 }} />
                <Text style={styles.actionText}>Reseña</Text>
              </TouchableOpacity>
            ))}
          {order.status === 'shipped' && (
            <TouchableOpacity style={styles.actionBtn} onPress={openDetail}>
              <Ionicons name="car-outline" size={16} color="#a78bfa" style={{ marginRight: 4 }} />
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
            <Ionicons name="chatbubble-outline" size={16} color="#059669" style={{ marginRight: 4 }} />
            <Text style={styles.actionText}>Contactar</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionBtn} onPress={openDetail}>
            <Ionicons name="document-text-outline" size={16} color="#64748b" style={{ marginRight: 4 }} />
            <Text style={[styles.actionText, { color: '#64748b' }]}>Detalle</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  if (!user?.id || user.id === 'guest') {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#f9fafb' }}>
        <StatusBar barStyle="dark-content" backgroundColor="#fff" />
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerBtn}>
            <Ionicons name="arrow-back" size={24} color="#111827" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Mis Pedidos</Text>
        </View>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 }}>
          <Ionicons name="person-outline" size={48} color="#9ca3af" />
          <Text style={{ marginTop: 12, fontWeight: '600', color: '#111827', textAlign: 'center' }}>
            Inicia sesión para ver tus pedidos
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (loading && orders.length === 0) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#f9fafb', justifyContent: 'center', alignItems: 'center' }}>
        <StatusBar barStyle="dark-content" backgroundColor="#fff" />
        <ActivityIndicator size="large" color="#059669" />
        <Text style={{ marginTop: 12, color: '#6b7280' }}>Cargando pedidos...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#f9fafb' }}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerBtn}>
          <Ionicons name="arrow-back" size={24} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Mis Pedidos</Text>
      </View>
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
        <View style={{ padding: 16 }}>
          <Text style={{ color: '#dc2626', textAlign: 'center' }}>{error}</Text>
          <TouchableOpacity onPress={load} style={{ marginTop: 12, alignSelf: 'center' }}>
            <Text style={{ color: '#059669', fontWeight: '600' }}>Reintentar</Text>
          </TouchableOpacity>
        </View>
      ) : null}
      <FlatList
        data={filteredOrders}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
        renderItem={({ item }) => <OrderCard order={item} />}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#059669" />}
        ListEmptyComponent={
          !error ? (
            <View style={{ alignItems: 'center', marginTop: 48 }}>
              <Ionicons name="cube-outline" size={48} color="#9ca3af" style={{ marginBottom: 12 }} />
              <Text style={{ fontWeight: 'bold', fontSize: 16, color: '#111827', marginBottom: 4 }}>No hay pedidos</Text>
              <Text style={{ color: '#6b7280', marginBottom: 16, textAlign: 'center', paddingHorizontal: 24 }}>
                {activeTab === 'all'
                  ? 'Aún no has realizado ningún pedido'
                  : `No tienes pedidos ${activeTab === 'active' ? 'activos' : activeTab === 'delivered' ? 'entregados' : 'cancelados'}`}
              </Text>
              <TouchableOpacity style={styles.exploreBtn} onPress={() => (navigation as any).navigate('MainTabs', { screen: 'Home' })}>
                <Text style={styles.exploreBtnText}>Explorar Productos</Text>
              </TouchableOpacity>
            </View>
          ) : null
        }
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', padding: 16, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#e5e7eb' },
  headerBtn: { padding: 8, borderRadius: 20, backgroundColor: '#f3f4f6', marginRight: 8 },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: '#111827' },
  tabsRow: { flexDirection: 'row', justifyContent: 'space-between', backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#f3f4f6' },
  tab: { flex: 1, alignItems: 'center', paddingVertical: 12 },
  tabActive: { borderBottomWidth: 2, borderBottomColor: '#059669' },
  tabText: { color: '#6b7280', fontWeight: '500', fontSize: 13 },
  tabTextActive: { color: '#059669' },
  card: { backgroundColor: '#fff', borderRadius: 12, marginBottom: 16, padding: 14, shadowColor: '#000', shadowOpacity: 0.03, shadowRadius: 4, elevation: 1 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8, gap: 8 },
  cardTitle: { fontWeight: 'bold', color: '#6b7280', fontSize: 13 },
  cardDate: { color: '#9ca3af', fontSize: 12 },
  badge: { flexDirection: 'row', alignItems: 'center', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 2 },
  cardContent: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 8 },
  productImg: { width: 60, height: 60, borderRadius: 8, backgroundColor: '#f3f4f6' },
  productTitle: { fontWeight: 'bold', color: '#111827', fontSize: 14, marginBottom: 2 },
  productDetail: { color: '#64748b', fontSize: 12 },
  sellerAvatar: { width: 20, height: 20, borderRadius: 10, marginRight: 4 },
  sellerName: { color: '#6b7280', fontSize: 12 },
  shippingHint: { color: '#94a3b8', fontSize: 11, marginTop: 2 },
  price: { color: '#059669', fontWeight: 'bold', fontSize: 15, marginTop: 4 },
  trackingBox: { backgroundColor: '#f3f4f6', borderRadius: 8, padding: 8, marginBottom: 8 },
  trackingLabel: { color: '#6b7280', fontSize: 12 },
  trackingValue: { color: '#111827', fontWeight: 'bold', fontSize: 13 },
  trackingDelivery: { color: '#059669', fontSize: 12, marginTop: 2 },
  actionsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 4 },
  actionBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f0fdf4', borderRadius: 8, paddingVertical: 8, paddingHorizontal: 12, marginRight: 8 },
  actionBtnDanger: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fef2f2',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#fecaca',
  },
  actionText: { color: '#059669', fontWeight: 'bold', fontSize: 13 },
  exploreBtn: { backgroundColor: '#059669', borderRadius: 8, paddingVertical: 12, paddingHorizontal: 24 },
  exploreBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 15 },
});

export default OrdersScreen;
