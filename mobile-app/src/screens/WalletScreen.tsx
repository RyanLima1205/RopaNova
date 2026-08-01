import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  SafeAreaView,
  ActivityIndicator,
  Platform,
  Dimensions,
  Modal,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons, FontAwesome5, Feather } from '@expo/vector-icons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../../App';
import { auth } from '../firebaseConfig';
import { getWalletData, getTransactionsPaginated, WalletData, Transaction, TransactionCursor } from '../services/paymentService';
import { logger } from '../utils/logger';

type WalletScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Wallet'>;

const { width } = Dimensions.get('window');

const emptyWallet: WalletData = {
  userId: '',
  balance: 0,
  pendingEarnings: 0,
  totalEarnings: 0,
  currency: 'DOP',
  lastUpdated: new Date(),
};

export const WalletScreen: React.FC = () => {
  const navigation = useNavigation<WalletScreenNavigationProp>();
  const [showBalance, setShowBalance] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [dateRange, setDateRange] = useState("all");
  const [walletData, setWalletData] = useState<WalletData>(emptyWallet);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [cursor, setCursor] = useState<TransactionCursor | null>(null);
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);

  const loadWallet = React.useCallback(async () => {
    const uid = auth.currentUser?.uid;
    if (!uid) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const [wallet, page] = await Promise.all([
        getWalletData(uid),
        getTransactionsPaginated(uid, 20),
      ]);
      if (wallet) setWalletData(wallet);
      setTransactions(page.transactions);
      setCursor(page.cursor);
      setHasMore(page.hasMore);
    } catch (error) {
      logger.error('Error al cargar el wallet:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadMore = React.useCallback(async () => {
    const uid = auth.currentUser?.uid;
    if (!uid || loadingMore || !hasMore || !cursor) return;
    setLoadingMore(true);
    try {
      const page = await getTransactionsPaginated(uid, 20, cursor);
      setTransactions(prev => [...prev, ...page.transactions]);
      setCursor(page.cursor);
      setHasMore(page.hasMore);
    } catch (error) {
      logger.error('Error al cargar más transacciones:', error);
    } finally {
      setLoadingMore(false);
    }
  }, [loadingMore, hasMore, cursor]);

  useFocusEffect(
    React.useCallback(() => {
      loadWallet();
    }, [loadWallet]),
  );

  const monthlyStats = React.useMemo(() => {
    const now = new Date();
    const monthTransactions = transactions.filter(
      (t) => t.createdAt.getMonth() === now.getMonth() && t.createdAt.getFullYear() === now.getFullYear(),
    );
    const earned = monthTransactions.filter((t) => t.amount > 0).reduce((sum, t) => sum + t.amount, 0);
    const spent = monthTransactions.filter((t) => t.amount < 0).reduce((sum, t) => sum + Math.abs(t.amount), 0);
    return { earned, spent, transactions: monthTransactions.length };
  }, [transactions]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("es-DO", {
      style: "currency",
      currency: "DOP",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat("es-DO", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
  };

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case "sale":
        return <Feather name="trending-up" size={18} color="#059669" />;
      case "purchase":
        return <Feather name="shopping-bag" size={18} color="#2563eb" />;
      case "withdrawal":
        return <FontAwesome5 name="piggy-bank" size={16} color="#7c3aed" />;
      case "deposit":
        return <Ionicons name="add" size={18} color="#059669" />;
      case "refund":
        return <Feather name="refresh-cw" size={18} color="#ea580c" />;
      default:
        return <Feather name="dollar-sign" size={18} color="#6b7280" />;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <Ionicons name="checkmark-circle" size={16} color="#059669" />;
      case "processing":
        return <Ionicons name="time" size={16} color="#d97706" />;
      case "failed":
        return <Ionicons name="close-circle" size={16} color="#dc2626" />;
      default:
        return <Ionicons name="alert-circle" size={16} color="#6b7280" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return styles.statusCompleted;
      case "processing":
        return styles.statusProcessing;
      case "failed":
        return styles.statusFailed;
      default:
        return styles.statusDefault;
    }
  };

  const getTransactionTypeLabel = (type: string) => {
    switch (type) {
      case "sale":
        return "Venta";
      case "purchase":
        return "Compra";
      case "withdrawal":
        return "Retiro";
      case "deposit":
        return "Recarga";
      case "refund":
        return "Reembolso";
      default:
        return "Transacción";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "completed":
        return "Completado";
      case "processing":
        return "Procesando";
      case "cancelled":
        return "Cancelado";
      default:
        return "Fallido";
    }
  };

  const filteredTransactions = transactions.filter((transaction) => {
    const matchesSearch = transaction.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === "all" || transaction.type === filterType;
    const matchesStatus = filterStatus === "all" || transaction.status === filterStatus;

    let matchesDate = true;
    if (dateRange !== "all") {
      const transactionDate = transaction.createdAt;
      const now = new Date();

      switch (dateRange) {
        case "today":
          matchesDate = transactionDate.toDateString() === now.toDateString();
          break;
        case "week":
          const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          matchesDate = transactionDate >= weekAgo;
          break;
        case "month":
          const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          matchesDate = transactionDate >= monthAgo;
          break;
      }
    }

    return matchesSearch && matchesType && matchesStatus && matchesDate;
  });

  const renderFilterButton = (label: string, value: string, currentValue: string, onPress: (value: string) => void) => (
    <TouchableOpacity
      style={[
        styles.filterButton,
        currentValue === value && styles.filterButtonActive
      ]}
      onPress={() => onPress(value)}
    >
      <Text style={[
        styles.filterButtonText,
        currentValue === value && styles.filterButtonTextActive
      ]}>
        {label}
      </Text>
    </TouchableOpacity>
  );

  const renderTransactionCard = (transaction: Transaction) => (
    <TouchableOpacity
      key={transaction.id}
      style={styles.transactionCard}
      onPress={() => setSelectedTransaction(transaction)}
    >
      <View style={styles.transactionIcon}>
        {getTransactionIcon(transaction.type)}
      </View>

      <View style={styles.transactionContent}>
        <View style={styles.transactionHeader}>
          <Text style={styles.transactionDescription} numberOfLines={1}>
            {transaction.description}
          </Text>
          <View style={[styles.statusBadge, getStatusColor(transaction.status)]}>
            <Text style={styles.statusText}>{getStatusLabel(transaction.status)}</Text>
          </View>
        </View>

        <View style={styles.transactionDetails}>
          <Text style={styles.transactionDate}>{formatDate(transaction.createdAt)}</Text>
        </View>
      </View>

      <View style={styles.transactionAmount}>
        <Text style={[
          styles.amountText,
          transaction.amount > 0 ? styles.amountPositive : styles.amountNegative
        ]}>
          {transaction.amount > 0 ? "+" : ""}
          {formatCurrency(Math.abs(transaction.amount))}
        </Text>
        <View style={styles.statusIcon}>
          {getStatusIcon(transaction.status)}
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#374151" />
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <Ionicons name="wallet-outline" size={20} color="#059669" />
          <Text style={styles.headerTitle}>RopaNova Wallet</Text>
        </View>
        <TouchableOpacity
          style={styles.eyeButton}
          onPress={() => setShowBalance(!showBalance)}
        >
          <Ionicons 
            name={showBalance ? "eye-off-outline" : "eye-outline"} 
            size={20} 
            color="#374151" 
          />
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#059669" />
        </View>
      ) : (
      <ScrollView contentContainerStyle={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Wallet Balance Card */}
        <View style={styles.balanceCard}>
          <View style={styles.balanceContent}>
            <Text style={styles.balanceLabel}>Saldo disponible</Text>
            <Text style={styles.balanceAmount}>
              {showBalance ? formatCurrency(walletData.balance) : "••••••"}
            </Text>

            <View style={styles.balanceStats}>
              <View style={styles.balanceStat}>
                <Text style={styles.balanceStatLabel}>Ganancias pendientes</Text>
                <Text style={styles.balanceStatValue}>
                  {showBalance ? formatCurrency(walletData.pendingEarnings) : "••••"}
                </Text>
              </View>
              <View style={styles.balanceStat}>
                <Text style={styles.balanceStatLabel}>Total ganado</Text>
                <Text style={styles.balanceStatValue}>
                  {showBalance ? formatCurrency(walletData.totalEarnings) : "••••"}
                </Text>
              </View>
            </View>

            <View style={styles.balanceActions}>
              <TouchableOpacity 
                style={styles.balanceActionButton}
                onPress={() => navigation.navigate('RechargeWallet')}
              >
                <Ionicons name="add" size={18} color="#fff" />
                <Text style={styles.balanceActionText}>Recargar</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.balanceActionButton}
                onPress={() => navigation.navigate('WithdrawWallet')}
              >
                <FontAwesome5 name="piggy-bank" size={16} color="#fff" />
                <Text style={styles.balanceActionText}>Retirar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Monthly Stats */}
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <View style={styles.statIcon}>
              <Feather name="trending-up" size={20} color="#059669" />
            </View>
            <Text style={styles.statLabel}>Este mes ganaste</Text>
            <Text style={styles.statValue}>
              {showBalance ? formatCurrency(monthlyStats.earned) : "••••"}
            </Text>
          </View>

          <View style={styles.statCard}>
            <View style={styles.statIcon}>
              <Feather name="trending-down" size={20} color="#2563eb" />
            </View>
            <Text style={styles.statLabel}>Este mes gastaste</Text>
            <Text style={styles.statValue}>
              {showBalance ? formatCurrency(monthlyStats.spent) : "••••"}
            </Text>
          </View>

          <View style={styles.statCard}>
            <View style={styles.statIcon}>
              <Feather name="refresh-cw" size={20} color="#7c3aed" />
            </View>
            <Text style={styles.statLabel}>Transacciones</Text>
            <Text style={styles.statValue}>{monthlyStats.transactions}</Text>
          </View>
        </View>

        {/* Transactions Section */}
        <View style={styles.transactionsCard}>
          <View style={styles.transactionsHeader}>
            <Text style={styles.transactionsTitle}>Historial de Transacciones</Text>
          </View>

          {/* Search */}
          <View style={styles.searchContainer}>
            <Ionicons name="search" size={16} color="#9ca3af" style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Buscar transacciones..."
              value={searchTerm}
              onChangeText={setSearchTerm}
              placeholderTextColor="#9ca3af"
            />
          </View>

          {/* Filters */}
          <View style={styles.filtersContainer}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={styles.filtersRow}>
                {renderFilterButton("Todos", "all", filterType, setFilterType)}
                {renderFilterButton("Ventas", "sale", filterType, setFilterType)}
                {renderFilterButton("Compras", "purchase", filterType, setFilterType)}
                {renderFilterButton("Retiros", "withdrawal", filterType, setFilterType)}
                {renderFilterButton("Recargas", "deposit", filterType, setFilterType)}
              </View>
            </ScrollView>
          </View>

          {/* Transactions List */}
          <View style={styles.transactionsList}>
            {filteredTransactions.length === 0 ? (
              <View style={styles.emptyState}>
                <Ionicons name="wallet-outline" size={48} color="#d1d5db" />
                <Text style={styles.emptyStateTitle}>
                  {transactions.length === 0 ? 'Aún no tienes transacciones' : 'No se encontraron transacciones'}
                </Text>
                <Text style={styles.emptyStateSubtitle}>
                  {transactions.length === 0
                    ? 'Tus ventas, compras, recargas y retiros aparecerán aquí'
                    : 'Intenta ajustar los filtros de búsqueda'}
                </Text>
              </View>
            ) : (
              filteredTransactions.map(renderTransactionCard)
            )}
          </View>

          {hasMore && (
            <TouchableOpacity style={styles.loadMoreButton} onPress={loadMore} disabled={loadingMore}>
              {loadingMore
                ? <ActivityIndicator size="small" color="#059669" />
                : <Text style={styles.loadMoreText}>Cargar más transacciones</Text>
              }
            </TouchableOpacity>
          )}
        </View>

        {/* Quick Actions */}
        <View style={styles.quickActionsCard}>
          <Text style={styles.quickActionsTitle}>Acciones Rápidas</Text>
          <View style={styles.quickActionsGrid}>
            <TouchableOpacity 
              style={styles.quickActionButton}
              onPress={() => navigation.navigate('RechargeWallet')}
            >
              <Ionicons name="add" size={24} color="#059669" />
              <Text style={styles.quickActionText}>Recargar Wallet</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.quickActionButton}
              onPress={() => navigation.navigate('WithdrawWallet')}
            >
              <FontAwesome5 name="piggy-bank" size={20} color="#059669" />
              <Text style={styles.quickActionText}>Retirar Dinero</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.quickActionButton}
              onPress={() => navigation.navigate('PaymentSettings')}
            >
              <Ionicons name="card-outline" size={24} color="#059669" />
              <Text style={styles.quickActionText}>Métodos de Pago</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.bottomSpacing} />
      </ScrollView>
      )}

      {/* Modal détail transaction */}
      <Modal
        visible={!!selectedTransaction}
        transparent
        animationType="slide"
        onRequestClose={() => setSelectedTransaction(null)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setSelectedTransaction(null)}
        >
          <TouchableOpacity activeOpacity={1} style={styles.modalCard}>
            {selectedTransaction && (
              <>
                <View style={styles.modalHeader}>
                  <View style={styles.modalIcon}>
                    {getTransactionIcon(selectedTransaction.type)}
                  </View>
                  <Text style={styles.modalType}>
                    {getTransactionTypeLabel(selectedTransaction.type)}
                  </Text>
                  <TouchableOpacity onPress={() => setSelectedTransaction(null)} style={styles.modalClose}>
                    <Ionicons name="close" size={22} color="#6b7280" />
                  </TouchableOpacity>
                </View>

                <Text style={[
                  styles.modalAmount,
                  selectedTransaction.amount > 0 ? styles.amountPositive : styles.amountNegative,
                ]}>
                  {selectedTransaction.amount > 0 ? '+' : ''}
                  {formatCurrency(Math.abs(selectedTransaction.amount))}
                </Text>

                <View style={[styles.statusBadge, getStatusColor(selectedTransaction.status), styles.modalStatusBadge]}>
                  <Text style={styles.statusText}>{getStatusLabel(selectedTransaction.status)}</Text>
                </View>

                <View style={styles.modalDivider} />

                <View style={styles.modalRow}>
                  <Text style={styles.modalLabel}>Descripción</Text>
                  <Text style={styles.modalValue}>{selectedTransaction.description}</Text>
                </View>
                <View style={styles.modalRow}>
                  <Text style={styles.modalLabel}>Fecha</Text>
                  <Text style={styles.modalValue}>{formatDate(selectedTransaction.createdAt)}</Text>
                </View>
                {selectedTransaction.relatedOrderId && (
                  <View style={styles.modalRow}>
                    <Text style={styles.modalLabel}>Pedido</Text>
                    <Text style={styles.modalValue}>#{selectedTransaction.relatedOrderId.slice(0, 8)}</Text>
                  </View>
                )}

                <TouchableOpacity
                  style={styles.modalCloseButton}
                  onPress={() => setSelectedTransaction(null)}
                >
                  <Text style={styles.modalCloseButtonText}>Cerrar</Text>
                </TouchableOpacity>
              </>
            )}
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'ios' ? 50 : 20,
    paddingBottom: 10,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  backButton: {
    padding: 8,
  },
  headerTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTitle: {
    fontWeight: 'bold',
    fontSize: 18,
    color: '#111827',
  },
  eyeButton: {
    padding: 8,
  },
  scrollView: {
    padding: 16,
    paddingBottom: 32,
  },
  balanceCard: {
    backgroundColor: '#059669',
    borderRadius: 16,
    padding: 24,
    marginBottom: 16,
  },
  balanceContent: {
    gap: 16,
  },
  balanceLabel: {
    color: '#d1fae5',
    fontSize: 14,
  },
  balanceAmount: {
    color: '#ffffff',
    fontSize: 36,
    fontWeight: 'bold',
  },
  balanceStats: {
    flexDirection: 'row',
    gap: 16,
  },
  balanceStat: {
    flex: 1,
  },
  balanceStatLabel: {
    color: '#d1fae5',
    fontSize: 12,
  },
  balanceStatValue: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '600',
  },
  balanceActions: {
    flexDirection: 'row',
    gap: 12,
    paddingTop: 8,
  },
  balanceActionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  balanceActionText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '500',
  },
  statsContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  statIcon: {
    width: 40,
    height: 40,
    backgroundColor: '#f3f4f6',
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  statLabel: {
    fontSize: 12,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 4,
  },
  statValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#111827',
  },
  transactionsCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  transactionsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  transactionsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
  },
  exportButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 6,
  },
  exportButtonText: {
    fontSize: 12,
    color: '#059669',
    fontWeight: '500',
  },
  searchContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  searchIcon: {
    position: 'absolute',
    left: 12,
    top: 12,
    zIndex: 1,
  },
  searchInput: {
    backgroundColor: '#f9fafb',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    paddingHorizontal: 40,
    paddingVertical: 12,
    fontSize: 14,
    color: '#111827',
  },
  filtersContainer: {
    marginBottom: 16,
  },
  filtersRow: {
    flexDirection: 'row',
    gap: 8,
  },
  filterButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 16,
    backgroundColor: '#ffffff',
  },
  filterButtonActive: {
    backgroundColor: '#059669',
    borderColor: '#059669',
  },
  filterButtonText: {
    fontSize: 12,
    color: '#6b7280',
    fontWeight: '500',
  },
  filterButtonTextActive: {
    color: '#ffffff',
  },
  transactionsList: {
    gap: 12,
  },
  transactionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 16,
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  transactionIcon: {
    width: 40,
    height: 40,
    backgroundColor: '#ffffff',
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  transactionContent: {
    flex: 1,
  },
  transactionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  transactionDescription: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
    color: '#111827',
  },
  statusBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  statusCompleted: {
    backgroundColor: '#d1fae5',
  },
  statusProcessing: {
    backgroundColor: '#fef3c7',
  },
  statusFailed: {
    backgroundColor: '#fee2e2',
  },
  statusDefault: {
    backgroundColor: '#f3f4f6',
  },
  statusText: {
    fontSize: 10,
    fontWeight: '600',
  },
  transactionDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  transactionDate: {
    fontSize: 12,
    color: '#6b7280',
  },
  transactionSeparator: {
    fontSize: 12,
    color: '#d1d5db',
    marginHorizontal: 4,
  },
  transactionReference: {
    fontSize: 12,
    color: '#6b7280',
  },
  transactionUser: {
    fontSize: 12,
    color: '#6b7280',
  },
  transactionAmount: {
    alignItems: 'flex-end',
  },
  amountText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  amountPositive: {
    color: '#059669',
  },
  amountNegative: {
    color: '#111827',
  },
  statusIcon: {
    marginTop: 4,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  emptyStateTitle: {
    fontSize: 16,
    color: '#6b7280',
    marginTop: 16,
    marginBottom: 4,
  },
  emptyStateSubtitle: {
    fontSize: 14,
    color: '#9ca3af',
  },
  loadMoreButton: {
    alignItems: 'center',
    paddingVertical: 16,
    marginTop: 16,
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
  },
  loadMoreText: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '500',
  },
  quickActionsCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  quickActionsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 16,
  },
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  quickActionButton: {
    width: (width - 64) / 2 - 6,
    height: 80,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  quickActionText: {
    fontSize: 12,
    color: '#6b7280',
    textAlign: 'center',
  },
  bottomSpacing: {
    height: 80,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 24,
    paddingBottom: 36,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalIcon: {
    width: 40,
    height: 40,
    backgroundColor: '#f3f4f6',
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  modalType: {
    flex: 1,
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  modalClose: {
    padding: 4,
  },
  modalAmount: {
    fontSize: 36,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 12,
  },
  modalStatusBadge: {
    alignSelf: 'center',
    paddingHorizontal: 12,
    paddingVertical: 4,
    marginBottom: 20,
  },
  modalDivider: {
    height: 1,
    backgroundColor: '#e5e7eb',
    marginBottom: 16,
  },
  modalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  modalLabel: {
    fontSize: 14,
    color: '#6b7280',
  },
  modalValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#111827',
    flex: 1,
    textAlign: 'right',
    marginLeft: 16,
  },
  modalCloseButton: {
    marginTop: 20,
    backgroundColor: '#059669',
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
  },
  modalCloseButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
}); 