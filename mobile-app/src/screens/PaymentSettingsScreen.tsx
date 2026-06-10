import React, { useState, useEffect, useCallback } from 'react'
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Switch,
  Platform,
  Alert,
  RefreshControl,
  ActivityIndicator,
} from 'react-native'
import { Ionicons, MaterialCommunityIcons, FontAwesome5, Feather } from '@expo/vector-icons'
import { useNavigation, useFocusEffect } from '@react-navigation/native'
import { StackNavigationProp } from '@react-navigation/stack'
import { RootStackParamList } from '../../App'
import { useAuth } from '../contexts/AuthContext'
import {
  PaymentMethod,
  WalletData,
  Transaction,
  PaymentPreferences,
  getPaymentMethods,
  getWalletData,
  getRecentTransactions,
  getPaymentPreferences,
  updatePaymentPreferences,
  setDefaultPaymentMethod,
  deletePaymentMethod,
  getPaymentMethodIcon,
  getPaymentMethodColor,
  formatCurrency,
  getTransactionStatusLabel,
} from '../services/paymentService'

import { logger } from '../utils/logger'
type PaymentSettingsNavigationProp = StackNavigationProp<RootStackParamList, 'PaymentSettings'>

const walletDataStatic = {
  balance: 2450.0,
  pendingEarnings: 890.5,
  totalEarnings: 15670.25,
  recentTransactions: [
    {
      id: 1,
      type: 'sale',
      description: 'Venta: Vestido floral',
      amount: 850.0,
      date: 'Hace 2 horas',
      status: 'completed',
    },
    {
      id: 2,
      type: 'withdrawal',
      description: 'Retiro a Banco Popular',
      amount: -1200.0,
      date: 'Ayer',
      status: 'processing',
    },
    {
      id: 3,
      type: 'purchase',
      description: 'Compra: Zapatos Nike',
      amount: -450.0,
      date: 'Hace 3 días',
      status: 'completed',
    },
  ],
}

const getTransactionIcon = (type: string) => {
  switch (type) {
    case 'sale':
      return <Feather name="trending-up" size={18} color="#059669" />
    case 'withdrawal':
      return <Feather name="download" size={18} color="#2563eb" />
    case 'purchase':
      return <Feather name="credit-card" size={18} color="#ea580c" />
    default:
      return <Feather name="dollar-sign" size={18} color="#6b7280" />
  }
}

const getStatusColor = (status: string) => {
  switch (status) {
    case 'completed':
      return styles.statusCompleted
    case 'processing':
      return styles.statusProcessing
    case 'failed':
      return styles.statusFailed
    default:
      return styles.statusDefault
  }
}

export const PaymentSettingsScreen: React.FC = () => {
  const { user } = useAuth()
  const navigation = useNavigation<PaymentSettingsNavigationProp>()
  
  // États pour les données Firebase
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([])
  const [walletData, setWalletData] = useState<WalletData | null>(null)
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [preferences, setPreferences] = useState<PaymentPreferences | null>(null)
  
  // États UI
  const [showBalance, setShowBalance] = useState(true)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  // Charger toutes les données
  const loadAllData = useCallback(async () => {
    if (!user?.id) return
    
    try {
      setLoading(true)
      
      // Charger en parallèle
      const [methodsData, walletInfo, transactionsData, prefsData] = await Promise.all([
        getPaymentMethods(user.id),
        getWalletData(user.id),
        getRecentTransactions(user.id, 10),
        getPaymentPreferences(user.id),
      ])
      
      setPaymentMethods(methodsData)
      setWalletData(walletInfo)
      setTransactions(transactionsData)
      setPreferences(prefsData)
    } catch (error) {
      logger.error('Erreur lors du chargement des données:', error)
      Alert.alert('Error', 'No se pudieron cargar los datos de pago')
    } finally {
      setLoading(false)
    }
  }, [user?.id])

  // Charger au montage
  useEffect(() => {
    loadAllData()
  }, [loadAllData])

  // ✅ RECHARGER AUTOMATIQUEMENT quand on revient sur la page
  useFocusEffect(
    useCallback(() => {
      logger.log('📱 PaymentSettingsScreen - Page visible, rechargement des données...')
      loadAllData()
    }, [loadAllData])
  )

  // Pull to refresh
  const onRefresh = useCallback(async () => {
    setRefreshing(true)
    await loadAllData()
    setRefreshing(false)
  }, [loadAllData])

  // Gérer le changement d'auto-withdrawal
  const handleAutoWithdrawToggle = async (value: boolean) => {
    if (!user?.id) return
    
    try {
      await updatePaymentPreferences(user.id, {
        autoWithdraw: value,
      })
      setPreferences(prev => prev ? { ...prev, autoWithdraw: value } : null)
    } catch (error) {
      logger.error('Erreur lors de la mise à jour:', error)
      Alert.alert('Error', 'No se pudo actualizar la configuración')
    }
  }

  // Définir une méthode par défaut
  const handleSetDefault = async (methodId: string) => {
    if (!user?.id) return
    
    try {
      await setDefaultPaymentMethod(user.id, methodId)
      await loadAllData()
      Alert.alert('Éxito', 'Método establecido como predeterminado')
    } catch (error) {
      logger.error('Erreur:', error)
      Alert.alert('Error', 'No se pudo establecer como predeterminado')
    }
  }

  // Supprimer une méthode
  const handleDeleteMethod = (methodId: string, methodName: string) => {
    Alert.alert(
      'Confirmar eliminación',
      `¿Estás seguro de que quieres eliminar "${methodName}"?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            if (!user?.id) return
            try {
              await deletePaymentMethod(user.id, methodId)
              await loadAllData()
              Alert.alert('Éxito', 'Método eliminado correctamente')
            } catch (error) {
              logger.error('Erreur:', error)
              Alert.alert('Error', 'No se pudo eliminar el método')
            }
          },
        },
      ]
    )
  }

  // Formater la date relative
  const formatRelativeDate = (date: Date): string => {
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
    
    if (diffHours < 1) return 'Hace menos de 1 hora'
    if (diffHours < 24) return `Hace ${diffHours} hora${diffHours > 1 ? 's' : ''}`
    if (diffDays === 1) return 'Ayer'
    if (diffDays < 7) return `Hace ${diffDays} días`
    if (diffDays < 30) return `Hace ${Math.floor(diffDays / 7)} semana${Math.floor(diffDays / 7) > 1 ? 's' : ''}`
    return date.toLocaleDateString('es-DO')
  }

  // Si chargement initial
  if (loading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#f9fafb', justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#059669" />
        <Text style={{ marginTop: 16, color: '#6b7280' }}>Cargando métodos de pago...</Text>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#f9fafb' }}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Métodos de Pago</Text>
        <TouchableOpacity style={styles.addHeaderButton} onPress={() => navigation.navigate('AddPaymentMethod')}>
          <Ionicons name="add" size={24} color="#059669" />
        </TouchableOpacity>
      </View>

      <ScrollView 
        contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#059669"
            colors={['#059669']}
          />
        }
      >
        {/* Wallet */}
        {walletData && (
          <View style={styles.walletCard}>
            <View style={styles.walletHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Ionicons name="wallet-outline" size={24} color="#fff" />
                <Text style={styles.walletTitle}>RopaNova Wallet</Text>
              </View>
              <TouchableOpacity onPress={() => setShowBalance(!showBalance)}>
                <Ionicons name={showBalance ? 'eye-off-outline' : 'eye-outline'} size={22} color="#fff" />
              </TouchableOpacity>
            </View>
            <View style={{ marginTop: 12 }}>
              <Text style={styles.walletLabel}>Saldo disponible</Text>
              <Text style={styles.walletBalance}>{showBalance ? formatCurrency(walletData.balance) : '••••••'}</Text>
            </View>
            <View style={styles.walletStatsRow}>
              <View>
                <Text style={styles.walletStatLabel}>Ganancias pendientes</Text>
                <Text style={styles.walletStatValue}>{showBalance ? formatCurrency(walletData.pendingEarnings) : '••••'}</Text>
              </View>
              <View>
                <Text style={styles.walletStatLabel}>Total ganado</Text>
                <Text style={styles.walletStatValue}>{showBalance ? formatCurrency(walletData.totalEarnings) : '••••'}</Text>
              </View>
            </View>
          <View style={styles.walletActionsRow}>
            <TouchableOpacity 
              style={styles.walletActionBtn}
              onPress={() => navigation.navigate('RechargeWallet')}
            >
              <Ionicons name="add-circle-outline" size={18} color="#fff" style={{ marginRight: 4 }} />
              <Text style={styles.walletActionText}>Recargar</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.walletActionBtn}
              onPress={() => navigation.navigate('WithdrawWallet')}
            >
              <Feather name="download" size={18} color="#fff" style={{ marginRight: 4 }} />
              <Text style={styles.walletActionText}>Retirar</Text>
            </TouchableOpacity>
          </View>
          </View>
        )}

        {/* Info Recargar/Retirar */}
        <View style={[styles.card, { backgroundColor: '#f0fdf4', borderLeftWidth: 4, borderLeftColor: '#059669' }]}>
          <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 12 }}>
            <Ionicons name="information-circle" size={24} color="#059669" style={{ marginTop: 2 }} />
            <View style={{ flex: 1 }}>
              <Text style={[styles.cardTitle, { color: '#059669', marginBottom: 6 }]}>
                ¿Cómo recargar o retirar?
              </Text>
              <Text style={{ color: '#166534', fontSize: 13, lineHeight: 18 }}>
                • <Text style={{ fontWeight: 'bold' }}>Recargar:</Text> Apple Pay / Google Pay (simulado), Pago Móvil o transferencia. Tarjeta bancaria en la app: próximamente con proveedor seguro.{'\n'}
                • <Text style={{ fontWeight: 'bold' }}>Retirar:</Text> Transfiere tu saldo a tu cuenta bancaria registrada
              </Text>
            </View>
          </View>
        </View>

        {/* Auto-withdrawal Settings */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Configuración de Retiros</Text>
          <View style={styles.rowBetween}>
            <View>
              <Text style={styles.bold}>Retiro Automático</Text>
              <Text style={styles.textGray}>Retira automáticamente cuando alcances RD${preferences?.autoWithdrawThreshold || 1000}</Text>
            </View>
            <Switch 
              value={preferences?.autoWithdraw || false} 
              onValueChange={handleAutoWithdrawToggle}
              trackColor={{ false: '#e5e7eb', true: '#059669' }}
              thumbColor={preferences?.autoWithdraw ? '#ffffff' : '#ffffff'}
            />
          </View>
          {preferences?.autoWithdraw && (
            <View style={styles.autoWithdrawBox}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                <Ionicons name="shield-checkmark-outline" size={16} color="#2563eb" />
                <Text style={{ color: '#2563eb', fontWeight: 'bold' }}>Método de retiro predeterminado</Text>
              </View>
              <Text style={{ color: '#2563eb', fontSize: 13 }}>
                {preferences?.autoWithdrawMethodId 
                  ? paymentMethods.find(m => m.id === preferences.autoWithdrawMethodId)?.name || 'No configurado'
                  : 'No configurado'}
              </Text>
              <TouchableOpacity>
                <Text style={styles.linkBlue}>Cambiar método</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Recent Transactions */}
        {transactions.length > 0 && (
          <View style={styles.card}>
            <View style={styles.rowBetween}>
              <Text style={styles.cardTitle}>Transacciones Recientes</Text>
              <TouchableOpacity>
                <Text style={styles.linkGray}>Ver todas</Text>
              </TouchableOpacity>
            </View>
            {transactions.map((transaction) => (
            <View key={transaction.id} style={styles.transactionRow}>
              <View style={styles.transactionIcon}>{getTransactionIcon(transaction.type)}</View>
              <View style={{ flex: 1 }}>
                <Text style={styles.bold}>{transaction.description}</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <Text style={styles.textGraySmall}>{formatRelativeDate(transaction.createdAt)}</Text>
                  <Text style={[styles.textGraySmall, getStatusColor(transaction.status)]}>
                    {getTransactionStatusLabel(transaction.status)}
                  </Text>
                </View>
              </View>
              <Text style={[styles.bold, { color: transaction.amount > 0 ? '#059669' : '#111827' }] }>
                {transaction.amount > 0 ? '+' : ''}{formatCurrency(Math.abs(transaction.amount))}
              </Text>
            </View>
            ))}
          </View>
        )}

        {/* Payment Methods */}
        <View style={styles.card}>
          <View style={styles.rowBetween}>
            <View>
              <Text style={styles.cardTitle}>Métodos de pago</Text>
              <Text style={styles.textGraySmall}>Transferencia, pago móvil y otros (tarjeta: próximamente)</Text>
            </View>
            <TouchableOpacity 
              style={styles.addBtn}
              onPress={() => navigation.navigate('AddPaymentMethod')}
            >
              <Ionicons name="add-outline" size={18} color="#059669" style={{ marginRight: 4 }} />
              <Text style={{ color: '#059669', fontWeight: 'bold' }}>Agregar</Text>
            </TouchableOpacity>
          </View>
          {paymentMethods.length === 0 ? (
            <View style={{ paddingVertical: 32, alignItems: 'center' }}>
              <Ionicons name="card-outline" size={48} color="#d1d5db" />
              <Text style={{ color: '#6b7280', marginTop: 12, fontSize: 15 }}>Sin métodos guardados</Text>
              <Text style={{ color: '#9ca3af', marginTop: 4, fontSize: 13, textAlign: 'center' }}>
                Agrega transferencia o pago móvil para retiros y pagos
              </Text>
            </View>
          ) : (
            paymentMethods.map((method) => (
            <View key={method.id} style={styles.paymentMethodRow}>
              <View style={styles.paymentLogoBox}>
                <Ionicons 
                  name={getPaymentMethodIcon(method.type) as any} 
                  size={24} 
                  color={getPaymentMethodColor(method.type)} 
                />
              </View>
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Text style={styles.bold}>{method.name}</Text>
                  {method.isDefault && (
                    <View style={styles.badgeDefault}><Text style={styles.badgeText}>Predeterminado</Text></View>
                  )}
                  {method.isVerified && (
                    <Ionicons name="checkmark-circle" size={16} color="#059669" />
                  )}
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Text style={styles.textGraySmall}>
                    {method.type === 'card' && method.details.bankName}
                    {method.type === 'bank_transfer' && method.details.bankName}
                    {method.type === 'mobile_payment' && method.details.provider}
                    {method.type === 'cash' && method.details.preferredLocation}
                  </Text>
                  {method.type === 'card' && method.details.expiry && (
                    <Text style={styles.textGraySmall}>• Vence {method.details.expiry}</Text>
                  )}
                  {method.lastUsed && (
                    <Text style={styles.textGraySmall}>• {formatRelativeDate(method.lastUsed)}</Text>
                  )}
                </View>
              </View>
              <TouchableOpacity onPress={() => {
                Alert.alert(
                  method.name,
                  'Selecciona una acción',
                  [
                    {
                      text: method.isDefault ? 'Predeterminado ✓' : 'Establecer como predeterminado',
                      onPress: () => !method.isDefault && handleSetDefault(method.id),
                    },
                    {
                      text: 'Eliminar',
                      onPress: () => handleDeleteMethod(method.id, method.name),
                      style: 'destructive',
                    },
                    {
                      text: 'Cancelar',
                      style: 'cancel',
                    },
                  ]
                );
              }}>
                <Feather name="more-vertical" size={18} color="#6b7280" />
              </TouchableOpacity>
            </View>
            ))
          )}
        </View>


        {/* Security Information */}
        <View style={styles.card}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Ionicons name="shield-checkmark-outline" size={20} color="#059669" />
            <Text style={styles.cardTitle}>Seguridad de Pagos</Text>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 8, marginTop: 8 }}>
            <Ionicons name="checkmark-circle" size={18} color="#059669" style={{ marginTop: 2 }} />
            <View>
              <Text style={styles.boldSmall}>Encriptación SSL 256-bit</Text>
              <Text style={styles.textGraySmall}>Todos los datos de pago están protegidos</Text>
            </View>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 8, marginTop: 8 }}>
            <Ionicons name="checkmark-circle" size={18} color="#059669" style={{ marginTop: 2 }} />
            <View>
              <Text style={styles.boldSmall}>Cumplimiento PCI DSS</Text>
              <Text style={styles.textGraySmall}>Estándares internacionales de seguridad</Text>
            </View>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 8, marginTop: 8 }}>
            <Ionicons name="checkmark-circle" size={18} color="#059669" style={{ marginTop: 2 }} />
            <View>
              <Text style={styles.boldSmall}>Protección contra fraude</Text>
              <Text style={styles.textGraySmall}>Monitoreo 24/7 de transacciones</Text>
            </View>
          </View>
          <View style={styles.securityAdviceBox}>
            <Ionicons name="alert-circle-outline" size={16} color="#2563eb" style={{ marginRight: 4 }} />
            <View>
              <Text style={styles.boldSmallBlue}>Consejo de Seguridad</Text>
              <Text style={styles.textGraySmallBlue}>Nunca compartas tu información de pago fuera de la aplicación RopaNova.</Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'ios' ? 50 : 20, // Adjust for safe area
    paddingBottom: 10,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontWeight: 'bold',
    fontSize: 20,
    color: '#111827',
    flex: 1,
    textAlign: 'center',
  },
  addHeaderButton: {
    padding: 8,
  },
  walletCard: {
    backgroundColor: '#059669',
    borderRadius: 16,
    padding: 18,
    marginBottom: 18,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
  },
  walletHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  walletTitle: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 18,
    marginLeft: 4,
  },
  walletLabel: {
    color: '#d1fae5',
    fontSize: 13,
    marginTop: 8,
  },
  walletBalance: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 32,
    marginTop: 2,
  },
  walletStatsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
  },
  walletStatLabel: {
    color: '#d1fae5',
    fontSize: 12,
  },
  walletStatValue: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 18,
  },
  walletActionsRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
  },
  walletActionBtn: {
    flex: 1,
    backgroundColor: '#10b981',
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    marginHorizontal: 2,
  },
  walletActionText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 15,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 16,
    marginBottom: 18,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 1 },
  },
  cardTitle: {
    fontWeight: 'bold',
    fontSize: 17,
    marginBottom: 8,
    color: '#111827',
  },
  rowBetween: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  bold: {
    fontWeight: 'bold',
    fontSize: 15,
    color: '#111827',
  },
  boldSmall: {
    fontWeight: 'bold',
    fontSize: 14,
    color: '#111827',
  },
  boldSmallBlue: {
    fontWeight: 'bold',
    fontSize: 14,
    color: '#2563eb',
  },
  textGray: {
    color: '#6b7280',
    fontSize: 13,
    marginTop: 2,
  },
  textGraySmall: {
    color: '#6b7280',
    fontSize: 12,
  },
  textGraySmallBlue: {
    color: '#2563eb',
    fontSize: 12,
  },
  linkBlue: {
    color: '#2563eb',
    fontWeight: 'bold',
    fontSize: 13,
    marginTop: 4,
  },
  linkGray: {
    color: '#6b7280',
    fontWeight: 'bold',
    fontSize: 13,
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#d1fae5',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  addBtnOption: {
    backgroundColor: '#d1fae5',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
    alignSelf: 'center',
  },
  paymentMethodRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  paymentLogoBox: {
    width: 36,
    height: 24,
    backgroundColor: '#f3f4f6',
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  badgeDefault: {
    backgroundColor: '#d1fae5',
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginLeft: 2,
  },
  badgePopular: {
    backgroundColor: '#dbeafe',
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginLeft: 2,
  },
  badgeText: {
    color: '#059669',
    fontWeight: 'bold',
    fontSize: 11,
  },
  badgeTextBlue: {
    color: '#2563eb',
    fontWeight: 'bold',
    fontSize: 11,
  },
  paymentOptionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  paymentOptionIcon: {
    width: 32,
    height: 32,
    backgroundColor: '#f3f4f6',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  transactionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  transactionIcon: {
    width: 36,
    height: 36,
    backgroundColor: '#f3f4f6',
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  autoWithdrawBox: {
    backgroundColor: '#dbeafe',
    borderRadius: 8,
    padding: 10,
    marginTop: 10,
  },
  securityAdviceBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#dbeafe',
    borderRadius: 8,
    padding: 10,
    marginTop: 14,
    gap: 6,
  },
  statusCompleted: {
    color: '#059669',
  },
  statusProcessing: {
    color: '#eab308',
  },
  statusFailed: {
    color: '#ef4444',
  },
  statusDefault: {
    color: '#6b7280',
  },
}) 