import React, { useState } from 'react'
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  Dimensions,
} from 'react-native'
import { Ionicons, MaterialIcons, FontAwesome5 } from '@expo/vector-icons'
import { useNavigation } from '@react-navigation/native'

const { width } = Dimensions.get('window')

export const DashboardScreen: React.FC = () => {
  const navigation = useNavigation()
  const [timeRange, setTimeRange] = useState<'7d' | '30d'>('7d')

  // Mock dashboard data
  const stats = {
    totalSales: 89,
    totalRevenue: 45600,
    activeListings: 12,
    totalViews: 2340,
    averageRating: 4.8,
    responseRate: 92,
    conversionRate: 8.5,
    repeatCustomers: 23,
  }

  const recentSales = [
    {
      id: 1,
      item: 'Vestido Elegante de Noche Zara',
      price: 2500,
      buyer: 'Ana Rodríguez',
      date: 'Hace 2 horas',
      status: 'completed',
    },
    {
      id: 2,
      item: 'Bolso de Cuero Genuino Coach',
      price: 1800,
      buyer: 'Carmen López',
      date: 'Hace 1 día',
      status: 'completed',
    },
    {
      id: 3,
      item: 'Zapatos de Tacón Steve Madden',
      price: 2200,
      buyer: 'Isabella Martínez',
      date: 'Hace 2 días',
      status: 'pending',
    },
  ]

  const topPerformingItems = [
    {
      id: 1,
      item: 'Vestidos de Noche',
      sales: 15,
      revenue: 37500,
      growth: 25,
    },
    {
      id: 2,
      item: 'Bolsos de Cuero',
      sales: 8,
      revenue: 14400,
      growth: 12,
    },
    {
      id: 3,
      item: 'Zapatos de Tacón',
      sales: 12,
      revenue: 26400,
      growth: -5,
    },
  ]

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.headerButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Dashboard de Vendedor</Text>
        <View style={{ width: 32 }} />
      </View>
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Sélecteur de période */}
        <View style={styles.timeRangeRow}>
          <TouchableOpacity
            style={[styles.timeRangeButton, timeRange === '7d' && styles.timeRangeButtonActive]}
            onPress={() => setTimeRange('7d')}
          >
            <Text style={[styles.timeRangeText, timeRange === '7d' && styles.timeRangeTextActive]}>7 días</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.timeRangeButton, timeRange === '30d' && styles.timeRangeButtonActive]}
            onPress={() => setTimeRange('30d')}
          >
            <Text style={[styles.timeRangeText, timeRange === '30d' && styles.timeRangeTextActive]}>30 días</Text>
          </TouchableOpacity>
        </View>
        {/* Statistiques clés */}
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <View style={styles.statCardTop}>
              <View>
                <Text style={styles.statLabel}>Ventas Totales</Text>
                <Text style={styles.statValue}>{stats.totalSales}</Text>
              </View>
              <View style={[styles.iconCircle, { backgroundColor: '#d1fae5' }] }>
                <Ionicons name="bag-outline" size={22} color="#059669" />
              </View>
            </View>
            <View style={styles.statCardBottom}>
              <Ionicons name="trending-up" size={14} color="#16a34a" style={{ marginRight: 2 }} />
              <Text style={styles.statGrowth}>+12% vs mes anterior</Text>
            </View>
          </View>
          <View style={styles.statCard}>
            <View style={styles.statCardTop}>
              <View>
                <Text style={styles.statLabel}>Ingresos</Text>
                <Text style={styles.statValue}>RD${stats.totalRevenue.toLocaleString()}</Text>
              </View>
              <View style={[styles.iconCircle, { backgroundColor: '#dbeafe' }] }>
                <Ionicons name="cash-outline" size={22} color="#2563eb" />
              </View>
            </View>
            <View style={styles.statCardBottom}>
              <Ionicons name="trending-up" size={14} color="#16a34a" style={{ marginRight: 2 }} />
              <Text style={styles.statGrowth}>+8% vs mes anterior</Text>
            </View>
          </View>
        </View>
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <View style={styles.statCardTop}>
              <View>
                <Text style={styles.statLabel}>Publicaciones</Text>
                <Text style={styles.statValue}>{stats.activeListings}</Text>
              </View>
              <View style={[styles.iconCircle, { backgroundColor: '#ede9fe' }] }>
                <Ionicons name="eye-outline" size={22} color="#7c3aed" />
              </View>
            </View>
            <View style={styles.statCardBottom}>
              <Text style={styles.statSub}>Activas actualmente</Text>
            </View>
          </View>
          <View style={styles.statCard}>
            <View style={styles.statCardTop}>
              <View>
                <Text style={styles.statLabel}>Calificación</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 2 }}>
                  <Text style={styles.statValue}>{stats.averageRating}</Text>
                  <Ionicons name="star" size={16} color="#fbbf24" />
                </View>
              </View>
              <View style={[styles.iconCircle, { backgroundColor: '#fef9c3' }] }>
                <Ionicons name="star" size={22} color="#fbbf24" />
              </View>
            </View>
            <View style={styles.statCardBottom}>
              <Text style={styles.statSub}>Basado en 127 reseñas</Text>
            </View>
          </View>
        </View>
        {/* Métriques de performance */}
        <View style={styles.metricsGrid}>
          <View style={styles.metricCard}>
            <Text style={styles.metricTitle}>Tasa de Respuesta</Text>
            <View style={styles.metricRow}>
              <Text style={styles.metricValue}>{stats.responseRate}%</Text>
              <Ionicons name="chatbubble-ellipses-outline" size={18} color="#059669" />
            </View>
            <View style={styles.progressBarBg}>
              <View style={[styles.progressBarFill, { width: `${stats.responseRate}%` }]} />
            </View>
            <Text style={styles.metricSub}>Excelente tiempo de respuesta</Text>
          </View>
          <View style={styles.metricCard}>
            <Text style={styles.metricTitle}>Conversión</Text>
            <View style={styles.metricRow}>
              <Text style={[styles.metricValue, { color: '#2563eb' }]}>{stats.conversionRate}%</Text>
              <Ionicons name="trending-up" size={18} color="#2563eb" />
            </View>
            <View style={styles.progressBarBg}>
              <View style={[styles.progressBarFill, { width: `${stats.conversionRate * 10}%`, backgroundColor: '#2563eb' }]} />
            </View>
            <Text style={styles.metricSub}>Visitas que se convierten en ventas</Text>
          </View>
          <View style={styles.metricCard}>
            <Text style={styles.metricTitle}>Clientes Recurrentes</Text>
            <View style={styles.metricRow}>
              <Text style={[styles.metricValue, { color: '#a21caf' }]}>{stats.repeatCustomers}</Text>
              <Ionicons name="people-outline" size={18} color="#a21caf" />
            </View>
            <Text style={styles.metricSub}>Compradores que han vuelto</Text>
          </View>
        </View>
        {/* Ventes récentes */}
        <View style={styles.sectionBox}>
          <Text style={styles.sectionTitle}>Ventas Recientes</Text>
          {recentSales.map((sale) => (
            <View key={sale.id} style={styles.saleRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.saleItem}>{sale.item}</Text>
                <Text style={styles.saleSub}>Comprado por {sale.buyer}</Text>
                <Text style={styles.saleDate}>{sale.date}</Text>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={styles.salePrice}>RD${sale.price.toLocaleString()}</Text>
                <View style={[styles.saleBadge, { backgroundColor: sale.status === 'completed' ? '#d1fae5' : '#fef9c3' }] }>
                  <Text style={{ color: sale.status === 'completed' ? '#059669' : '#b45309', fontSize: 11 }}>
                    {sale.status === 'completed' ? 'Completada' : 'Pendiente'}
                  </Text>
                </View>
              </View>
            </View>
          ))}
        </View>
        {/* Top catégories */}
        <View style={styles.sectionBox}>
          <Text style={styles.sectionTitle}>Categorías Más Vendidas</Text>
          {topPerformingItems.map((item) => (
            <View key={item.id} style={styles.topCatRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.topCatItem}>{item.item}</Text>
                <Text style={styles.topCatSub}>{item.sales} ventas</Text>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={styles.topCatPrice}>RD${item.revenue.toLocaleString()}</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 2 }}>
                  <Ionicons name="trending-up" size={14} color={item.growth > 0 ? '#16a34a' : '#dc2626'} style={item.growth > 0 ? {} : { transform: [{ rotate: '180deg' }] }} />
                  <Text style={{ color: item.growth > 0 ? '#16a34a' : '#dc2626', fontSize: 12 }}>
                    {item.growth > 0 ? '+' : ''}{item.growth}%
                  </Text>
                </View>
              </View>
            </View>
          ))}
        </View>
        {/* Actions rapides */}
        <View style={styles.sectionBox}>
          <Text style={styles.sectionTitle}>Acciones Rápidas</Text>
          <View style={styles.quickActionsRow}>
            <TouchableOpacity style={styles.quickActionBtn}>
              <Ionicons name="add-circle-outline" size={20} color="#059669" />
              <Text style={styles.quickActionText}>Publicar</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.quickActionBtn}>
              <Ionicons name="chatbubble-outline" size={20} color="#2563eb" />
              <Text style={styles.quickActionText}>Mensajes</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.quickActionBtn}>
              <Ionicons name="person-outline" size={20} color="#a21caf" />
              <Text style={styles.quickActionText}>Perfil</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.quickActionBtn}>
              <Ionicons name="settings-outline" size={20} color="#b45309" />
              <Text style={styles.quickActionText}>Config</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, backgroundColor: 'white', borderBottomWidth: 1, borderBottomColor: '#e5e7eb' },
  headerButton: { padding: 6 },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#111827' },
  content: { flex: 1 },
  timeRangeRow: { flexDirection: 'row', justifyContent: 'center', gap: 12, marginVertical: 12 },
  timeRangeButton: { paddingHorizontal: 18, paddingVertical: 6, borderRadius: 16, backgroundColor: '#f3f4f6' },
  timeRangeButtonActive: { backgroundColor: '#059669' },
  timeRangeText: { color: '#6b7280', fontSize: 13 },
  timeRangeTextActive: { color: 'white', fontWeight: 'bold' },
  statsGrid: { flexDirection: 'row', gap: 12, marginHorizontal: 12, marginBottom: 8 },
  statCard: { flex: 1, backgroundColor: 'white', borderRadius: 12, padding: 14, elevation: 1 },
  statCardTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  statLabel: { color: '#6b7280', fontSize: 12 },
  statValue: { color: '#111827', fontWeight: 'bold', fontSize: 20, marginTop: 2 },
  iconCircle: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  statCardBottom: { flexDirection: 'row', alignItems: 'center', marginTop: 8 },
  statGrowth: { color: '#16a34a', fontSize: 12 },
  statSub: { color: '#6b7280', fontSize: 12 },
  metricsGrid: { flexDirection: 'row', gap: 12, marginHorizontal: 12, marginBottom: 8 },
  metricCard: { flex: 1, backgroundColor: 'white', borderRadius: 12, padding: 14, elevation: 1 },
  metricTitle: { color: '#111827', fontWeight: 'bold', fontSize: 14, marginBottom: 4 },
  metricRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 },
  metricValue: { color: '#059669', fontWeight: 'bold', fontSize: 18 },
  metricSub: { color: '#6b7280', fontSize: 12, marginTop: 4 },
  progressBarBg: { height: 6, backgroundColor: '#e5e7eb', borderRadius: 4, marginVertical: 4, overflow: 'hidden' },
  progressBarFill: { height: 6, backgroundColor: '#059669', borderRadius: 4 },
  sectionBox: { backgroundColor: 'white', borderRadius: 12, margin: 12, padding: 14, elevation: 1, marginBottom: 8 },
  sectionTitle: { color: '#111827', fontWeight: 'bold', fontSize: 15, marginBottom: 10 },
  saleRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  saleItem: { color: '#111827', fontWeight: 'bold', fontSize: 14 },
  saleSub: { color: '#6b7280', fontSize: 12 },
  saleDate: { color: '#9ca3af', fontSize: 11 },
  salePrice: { color: '#059669', fontWeight: 'bold', fontSize: 14 },
  saleBadge: { marginTop: 4, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 2, alignItems: 'center', alignSelf: 'flex-end' },
  topCatRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  topCatItem: { color: '#111827', fontWeight: 'bold', fontSize: 14 },
  topCatSub: { color: '#6b7280', fontSize: 12 },
  topCatPrice: { color: '#2563eb', fontWeight: 'bold', fontSize: 14 },
  quickActionsRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 },
  quickActionBtn: { flex: 1, alignItems: 'center', padding: 8 },
  quickActionText: { color: '#374151', fontSize: 12, marginTop: 2 },
}) 