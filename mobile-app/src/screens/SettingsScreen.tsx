import React from 'react'
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  StatusBar,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useNavigation } from '@react-navigation/native'
import { StackNavigationProp } from '@react-navigation/stack'
import { RootStackParamList } from '../../App'

type SettingsScreenNavigationProp = StackNavigationProp<RootStackParamList, 'SettingsScreen'>

const configItems = [
  {
    title: 'Mi Cuenta',
    description: 'Información personal y configuración',
    icon: 'person-outline',
    route: 'AccountSettings',
  },
  {
    title: 'Métodos de Pago',
    description: 'Tarjetas y cuentas bancarias',
    icon: 'card-outline',
    route: 'PaymentSettings',
  },
  {
    title: 'Mis Pedidos',
    description: 'Historial y seguimiento de tus compras',
    icon: 'bag-handle-outline',
    route: 'OrdersScreen',
  },
  {
    title: 'Notificaciones',
    description: 'Elige qué alertas quieres recibir',
    icon: 'notifications-outline',
    route: 'NotificationSettings',
  },
  {
    title: 'Privacidad y Seguridad',
    description: 'Configuración de privacidad y verificación',
    icon: 'shield-checkmark-outline',
    route: 'PrivacySettings',
  },
  {
    title: 'Direcciones',
    description: 'Direcciones de envío y facturación',
    icon: 'location-outline',
    route: 'AddressSettings',
  },
  {
    title: 'RopaNova Wallet',
    description: 'Gestiona tu billetera digital',
    icon: 'wallet-outline',
    route: 'Wallet',
  },
  {
    title: 'Centro de Ayuda',
    description: 'Preguntas frecuentes y soporte',
    icon: 'help-circle-outline',
    route: 'HelpCenter',
  },
  {
    title: 'Términos y Condiciones',
    description: 'Términos de uso de la plataforma',
    icon: 'document-text-outline',
    route: 'Terms',
  },
  {
    title: 'Política de Privacidad',
    description: 'Cómo protegemos tu información',
    icon: 'scale-outline',
    route: 'PrivacyPolicy',
  },
]

export const SettingsScreen: React.FC = () => {
  const navigation = useNavigation<SettingsScreenNavigationProp>()

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.headerButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Configuración</Text>
      </View>
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.card}>
          {configItems.map((item, idx) => (
            <TouchableOpacity
              key={item.title}
              style={[styles.item, idx !== configItems.length - 1 && styles.itemBorder]}
              onPress={() => navigation.navigate(item.route as any)}
              activeOpacity={0.7}
            >
              <Ionicons name={item.icon as any} size={22} color="#059669" style={{ marginRight: 12 }} />
              <View style={{ flex: 1 }}>
                <Text style={styles.itemTitle}>{item.title}</Text>
                <Text style={styles.itemDesc}>{item.description}</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color="#9ca3af" />
            </TouchableOpacity>
          ))}
        </View>
        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  header: { flexDirection: 'row', alignItems: 'center', padding: 16, backgroundColor: 'white', borderBottomWidth: 1, borderBottomColor: '#e5e7eb' },
  headerButton: { padding: 6, marginRight: 8 },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#111827' },
  content: { flex: 1 },
  card: { backgroundColor: 'white', borderRadius: 12, margin: 16, borderWidth: 1, borderColor: '#e5e7eb', overflow: 'hidden' },
  item: { flexDirection: 'row', alignItems: 'center', padding: 16, backgroundColor: 'white' },
  itemBorder: { borderBottomWidth: 1, borderBottomColor: '#f3f4f6' },
  itemTitle: { fontWeight: 'bold', color: '#111827', fontSize: 15 },
  itemDesc: { color: '#6b7280', fontSize: 12, marginTop: 2 },
}) 