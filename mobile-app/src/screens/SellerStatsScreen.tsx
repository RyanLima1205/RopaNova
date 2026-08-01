import React from 'react'
import {
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { useNavigation } from '@react-navigation/native'

const COMING_FEATURES = [
  {
    icon: 'bar-chart-outline',
    color: '#059669',
    bg: '#f0fdf4',
    title: 'Estadísticas de ventas e ingresos',
    desc: 'Visualiza tus ingresos diarios, semanales y mensuales en tiempo real.',
  },
  {
    icon: 'people-outline',
    color: '#2563eb',
    bg: '#eff6ff',
    title: 'Seguimiento de compradores',
    desc: 'Conoce cuántos compradores únicos tienes y su tasa de retorno.',
  },
  {
    icon: 'trending-up-outline',
    color: '#7c3aed',
    bg: '#f5f3ff',
    title: 'Categorías más exitosas',
    desc: 'Descubre qué prendas y tallas se venden más rápido en tu tienda.',
  },
  {
    icon: 'star-outline',
    color: '#d97706',
    bg: '#fffbeb',
    title: 'Valoración promedio',
    desc: 'Tu puntuación como vendedor y el historial de reseñas de compradores.',
  },
  {
    icon: 'notifications-outline',
    color: '#dc2626',
    bg: '#fef2f2',
    title: 'Alertas inteligentes',
    desc: 'Recibe notificaciones cuando un producto esté próximo a agotarse o tenga alta demanda.',
  },
  {
    icon: 'wallet-outline',
    color: '#059669',
    bg: '#f0fdf4',
    title: 'Resumen financiero',
    desc: 'Balance de ingresos netos, comisiones y fondos disponibles para retirar.',
  },
] as const

export default function SellerStatsScreen() {
  const navigation = useNavigation()

  return (
    <SafeAreaView style={s.safe}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />

      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity style={s.headerBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#111827" />
        </TouchableOpacity>
        <Text style={s.headerTitle}>Estadísticas</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>

        {/* Hero */}
        <View style={s.hero}>
          <View style={s.rocketCircle}>
            <Ionicons name="rocket" size={48} color="#059669" />
          </View>
          <Text style={s.heroTitle}>¡Tu centro de mando está en camino! 🚀</Text>
          <Text style={s.heroBody}>
            Estamos construyendo algo increíble para ti. Muy pronto podrás ver en tiempo
            real tus ventas, ingresos, compradores recurrentes y mucho más — todo desde
            aquí, en la palma de tu mano.
          </Text>
          <View style={s.heroPill}>
            <Ionicons name="time-outline" size={14} color="#059669" />
            <Text style={s.heroPillText}>Próximamente disponible</Text>
          </View>
        </View>

        {/* Features */}
        <Text style={s.sectionLabel}>Lo que viene para ti</Text>
        {COMING_FEATURES.map((f, i) => (
          <View key={i} style={s.featureCard}>
            <View style={[s.featureIcon, { backgroundColor: f.bg }]}>
              <Ionicons name={f.icon as any} size={22} color={f.color} />
            </View>
            <View style={s.featureText}>
              <Text style={s.featureTitle}>{f.title}</Text>
              <Text style={s.featureDesc}>{f.desc}</Text>
            </View>
          </View>
        ))}

        {/* Footer note */}
        <View style={s.footerNote}>
          <Ionicons name="information-circle-outline" size={16} color="#9ca3af" />
          <Text style={s.footerNoteText}>
            Las estadísticas estarán disponibles en una próxima actualización de RopaNova.
            Asegúrate de tener activadas las actualizaciones automáticas.
          </Text>
        </View>

      </ScrollView>
    </SafeAreaView>
  )
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#f3f4f6' },

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
  headerBtn: { padding: 6, borderRadius: 20, backgroundColor: '#f3f4f6' },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#111827' },

  scroll: { padding: 16, paddingBottom: 48, gap: 12 },

  // Hero card
  hero: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#d1fae5',
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  rocketCircle: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: '#f0fdf4',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 18,
  },
  heroTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#111827',
    textAlign: 'center',
    lineHeight: 28,
    marginBottom: 12,
  },
  heroBody: {
    fontSize: 14,
    color: '#4b5563',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 20,
  },
  heroPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#f0fdf4',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderWidth: 1,
    borderColor: '#bbf7d0',
  },
  heroPillText: { fontSize: 13, color: '#059669', fontWeight: '600' },

  sectionLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#6b7280',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginTop: 8,
    marginBottom: 4,
    paddingHorizontal: 2,
  },

  // Feature cards
  featureCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    gap: 14,
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  featureIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  featureText: { flex: 1 },
  featureTitle: { fontSize: 14, fontWeight: '600', color: '#111827', marginBottom: 3 },
  featureDesc: { fontSize: 12, color: '#6b7280', lineHeight: 18 },

  // Footer
  footerNote: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    paddingHorizontal: 4,
    marginTop: 8,
  },
  footerNoteText: {
    flex: 1,
    fontSize: 12,
    color: '#9ca3af',
    lineHeight: 18,
  },
})
