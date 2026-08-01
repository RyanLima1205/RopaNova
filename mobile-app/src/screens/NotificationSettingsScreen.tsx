import React, { useCallback, useEffect, useState } from 'react'
import {
  ActivityIndicator,
  Alert,
  Linking,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { useNavigation } from '@react-navigation/native'
import { doc, getDoc, getFirestore, updateDoc } from 'firebase/firestore'
import * as Notifications from 'expo-notifications'
import { app } from '../firebaseConfig'
import { useAuth } from '../contexts/AuthContext'

export interface NotificationPrefs {
  messages: boolean
  orderStatus: boolean
  newSales: boolean
}

const DEFAULT_PREFS: NotificationPrefs = {
  messages: true,
  orderStatus: true,
  newSales: true,
}

const PREF_ITEMS: {
  key: keyof NotificationPrefs
  icon: string
  color: string
  bg: string
  title: string
  desc: string
}[] = [
  {
    key: 'messages',
    icon: 'chatbubble-ellipses-outline',
    color: '#2563eb',
    bg: '#eff6ff',
    title: 'Mensajes nuevos',
    desc: 'Recibe una alerta cuando un comprador o vendedor te escribe.',
  },
  {
    key: 'orderStatus',
    icon: 'bag-handle-outline',
    color: '#7c3aed',
    bg: '#f5f3ff',
    title: 'Actualizaciones de pedidos',
    desc: 'Cuando tu pedido es confirmado, enviado o entregado.',
  },
  {
    key: 'newSales',
    icon: 'cash-outline',
    color: '#059669',
    bg: '#f0fdf4',
    title: 'Nuevas ventas',
    desc: 'Recibe un aviso cada vez que alguien compra uno de tus productos.',
  },
]

export default function NotificationSettingsScreen() {
  const navigation = useNavigation()
  const { user } = useAuth()
  const db = getFirestore(app)

  const [prefs, setPrefs] = useState<NotificationPrefs>(DEFAULT_PREFS)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState<keyof NotificationPrefs | null>(null)
  const [systemGranted, setSystemGranted] = useState<boolean | null>(null)

  const loadPrefs = useCallback(async () => {
    if (!user?.id) return
    setLoading(true)
    try {
      const snap = await getDoc(doc(db, 'users', user.id))
      if (snap.exists()) {
        const data = snap.data()
        const saved = data.notificationPrefs as Partial<NotificationPrefs> | undefined
        setPrefs({ ...DEFAULT_PREFS, ...saved })
      }
    } catch {
      // keep defaults on error
    } finally {
      setLoading(false)
    }
  }, [user?.id])

  const checkSystemPermission = useCallback(async () => {
    const { status } = await Notifications.getPermissionsAsync()
    setSystemGranted(status === 'granted')
  }, [])

  useEffect(() => {
    loadPrefs()
    checkSystemPermission()
  }, [loadPrefs, checkSystemPermission])

  const toggle = async (key: keyof NotificationPrefs, value: boolean) => {
    if (!user?.id) return
    const optimistic = { ...prefs, [key]: value }
    setPrefs(optimistic)
    setSaving(key)
    try {
      await updateDoc(doc(db, 'users', user.id), {
        [`notificationPrefs.${key}`]: value,
      })
    } catch {
      setPrefs(prefs) // revert
      Alert.alert('Error', 'No se pudo guardar la preferencia. Intenta de nuevo.')
    } finally {
      setSaving(null)
    }
  }

  const openSystemSettings = () => {
    if (Platform.OS === 'ios') {
      Linking.openURL('app-settings:')
    } else {
      Linking.openSettings()
    }
  }

  return (
    <SafeAreaView style={s.safe}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />

      <View style={s.header}>
        <TouchableOpacity style={s.headerBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#111827" />
        </TouchableOpacity>
        <Text style={s.headerTitle}>Notificaciones</Text>
        <View style={{ width: 40 }} />
      </View>

      {loading ? (
        <View style={s.centered}>
          <ActivityIndicator size="large" color="#059669" />
        </View>
      ) : (
        <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>

          {/* System permission banner */}
          {systemGranted === false && (
            <TouchableOpacity style={s.permBanner} onPress={openSystemSettings} activeOpacity={0.8}>
              <Ionicons name="notifications-off-outline" size={20} color="#b45309" />
              <Text style={s.permBannerText}>
                Las notificaciones están desactivadas en tu dispositivo.{' '}
                <Text style={s.permBannerLink}>Activar en Ajustes →</Text>
              </Text>
            </TouchableOpacity>
          )}

          {/* Toggles */}
          <View style={s.card}>
            {PREF_ITEMS.map((item, idx) => {
              const isLast = idx === PREF_ITEMS.length - 1
              const isSaving = saving === item.key
              return (
                <View key={item.key} style={[s.row, !isLast && s.rowBorder]}>
                  <View style={[s.iconCircle, { backgroundColor: item.bg }]}>
                    <Ionicons name={item.icon as any} size={20} color={item.color} />
                  </View>
                  <View style={s.rowText}>
                    <Text style={s.rowTitle}>{item.title}</Text>
                    <Text style={s.rowDesc}>{item.desc}</Text>
                  </View>
                  {isSaving ? (
                    <ActivityIndicator size="small" color="#059669" style={{ marginLeft: 8 }} />
                  ) : (
                    <Switch
                      value={prefs[item.key]}
                      onValueChange={(val) => toggle(item.key, val)}
                      trackColor={{ false: '#e5e7eb', true: '#a7f3d0' }}
                      thumbColor={prefs[item.key] ? '#059669' : '#9ca3af'}
                      disabled={systemGranted === false}
                    />
                  )}
                </View>
              )
            })}
          </View>

          {/* Note */}
          <View style={s.note}>
            <Ionicons name="information-circle-outline" size={15} color="#9ca3af" />
            <Text style={s.noteText}>
              Los cambios se aplican de inmediato. Las notificaciones requieren que el dispositivo
              tenga permisos activos del sistema.
            </Text>
          </View>

        </ScrollView>
      )}
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

  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },

  scroll: { padding: 16, paddingBottom: 48, gap: 12 },

  // Permission banner
  permBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    backgroundColor: '#fef3c7',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#fde68a',
  },
  permBannerText: { flex: 1, fontSize: 13, color: '#92400e', lineHeight: 19 },
  permBannerLink: { fontWeight: '700', textDecorationLine: 'underline' },

  // Card with toggles
  card: {
    backgroundColor: '#fff',
    borderRadius: 14,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
  },
  rowBorder: { borderBottomWidth: 1, borderBottomColor: '#f3f4f6' },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  rowText: { flex: 1 },
  rowTitle: { fontSize: 14, fontWeight: '600', color: '#111827' },
  rowDesc: { fontSize: 12, color: '#6b7280', marginTop: 2, lineHeight: 17 },

  // Note
  note: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    paddingHorizontal: 4,
  },
  noteText: { flex: 1, fontSize: 12, color: '#9ca3af', lineHeight: 18 },
})
