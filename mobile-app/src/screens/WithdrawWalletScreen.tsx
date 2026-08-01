import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  SafeAreaView,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { StackNavigationProp } from '@react-navigation/stack';
import { useFocusEffect } from '@react-navigation/native';
import { RootStackParamList } from '../../App';
import { auth } from '../firebaseConfig';
import { getWalletData, getPaymentMethods, getPaymentMethodDisplayName, addTransaction, updateWalletBalance, PaymentMethod } from '../services/paymentService';

type WithdrawWalletScreenNavigationProp = StackNavigationProp<RootStackParamList, 'WithdrawWallet'>;

interface WithdrawWalletScreenProps {
  navigation: WithdrawWalletScreenNavigationProp;
}

const MIN_WITHDRAW_AMOUNT = 500;

export const WithdrawWalletScreen: React.FC<WithdrawWalletScreenProps> = ({ navigation }) => {
  const [amount, setAmount] = useState('');
  const [bankAccounts, setBankAccounts] = useState<PaymentMethod[]>([]);
  const [loadingAccounts, setLoadingAccounts] = useState(true);
  const [selectedAccount, setSelectedAccount] = useState<string | null>(null);
  const [showBalance, setShowBalance] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [walletBalance, setWalletBalance] = useState(0);

  useFocusEffect(
    React.useCallback(() => {
      const uid = auth.currentUser?.uid;
      if (!uid) return;
      getWalletData(uid).then((wallet) => {
        if (wallet) setWalletBalance(wallet.balance);
      });
      setLoadingAccounts(true);
      getPaymentMethods(uid).then((methods) => {
        const banks = methods.filter((m) => m.type === 'bank_transfer');
        setBankAccounts(banks);
        setSelectedAccount((current) => {
          if (current && banks.some((b) => b.id === current)) return current;
          return banks.find((b) => b.isDefault)?.id ?? banks[0]?.id ?? null;
        });
        setLoadingAccounts(false);
      });
    }, []),
  );

  const selectedBankAccount = bankAccounts.find((account) => account.id === selectedAccount);
  const numericAmount = Number.parseFloat(amount) || 0;
  const totalDeduction = numericAmount;
  const remainingBalance = walletBalance - totalDeduction;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("es-DO", {
      style: "currency",
      currency: "DOP",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const handleMaxAmount = () => {
    setAmount(Math.max(0, walletBalance).toString());
  };

  const handleWithdraw = async () => {
    if (!amount || !isValidAmount || !selectedAccount) return;
    const uid = auth.currentUser?.uid;
    if (!uid) return;

    setIsProcessing(true);
    try {
      const accountLabel = selectedBankAccount
        ? getPaymentMethodDisplayName(selectedBankAccount)
        : 'cuenta bancaria';
      await addTransaction(uid, {
        userId: uid,
        type: 'withdrawal',
        description: `Retiro a ${accountLabel}`,
        amount: -numericAmount,
        status: 'processing',
        paymentMethodId: selectedAccount,
      });
      await updateWalletBalance(uid, numericAmount, 'subtract');
      setShowConfirmation(true);
    } catch {
      Alert.alert('Error', 'No se pudo procesar el retiro. Intenta de nuevo.');
    } finally {
      setIsProcessing(false);
    }
  };

  const isValidAmount =
    numericAmount >= MIN_WITHDRAW_AMOUNT &&
    totalDeduction <= walletBalance &&
    !!selectedAccount;

  if (showConfirmation) {
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
          <Text style={styles.headerTitle}>Retiro Solicitado</Text>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.confirmationCard}>
            <View style={styles.confirmationIcon}>
              <Ionicons name="time" size={32} color="#2563EB" />
            </View>

            <Text style={styles.confirmationTitle}>¡Retiro Solicitado!</Text>
            <Text style={styles.confirmationSubtitle}>
              Tu solicitud de retiro por {formatCurrency(numericAmount)} está siendo procesada
            </Text>

            <View style={styles.transactionDetails}>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Monto a retirar:</Text>
                <Text style={styles.detailValue}>{formatCurrency(numericAmount)}</Text>
              </View>
              <View style={[styles.detailRow, styles.borderTop]}>
                <Text style={styles.detailLabel}>Cuenta destino:</Text>
                <Text style={styles.detailValue}>
                  {selectedBankAccount ? getPaymentMethodDisplayName(selectedBankAccount) : ''}
                </Text>
              </View>
            </View>

            <View style={styles.infoAlert}>
              <Ionicons name="information-circle" size={20} color="#2563EB" />
              <Text style={styles.infoText}>
                El monto aparecerá en tu cuenta bancaria en los próximos 2 días hábiles (lunes a viernes, de 9:00 AM a 5:00 PM).
              </Text>
            </View>

            <View style={styles.buttonContainer}>
              <TouchableOpacity
                style={styles.primaryButton}
                onPress={() => navigation.navigate('Wallet')}
              >
                <Text style={styles.primaryButtonText}>Ver mi Wallet</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.secondaryButton}
                onPress={() => navigation.navigate('MainTabs')}
              >
                <Text style={styles.secondaryButtonText}>Ir al Inicio</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

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
        <Text style={styles.headerTitle}>Retirar Dinero</Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Available Balance */}
        <View style={styles.balanceCard}>
          <View style={styles.balanceHeader}>
            <Text style={styles.balanceLabel}>Saldo disponible</Text>
            <TouchableOpacity
              style={styles.eyeButton}
              onPress={() => setShowBalance(!showBalance)}
            >
              <Ionicons
                name={showBalance ? "eye-off" : "eye"}
                size={20}
                color="rgba(255, 255, 255, 0.8)"
              />
            </TouchableOpacity>
          </View>
          <Text style={styles.balanceAmount}>
            {showBalance ? formatCurrency(walletBalance) : "••••••"}
          </Text>

          {amount && isValidAmount && (
            <View style={styles.remainingBalance}>
              <Text style={styles.remainingLabel}>Saldo después del retiro:</Text>
              <Text style={styles.remainingValue}>
                {showBalance ? formatCurrency(remainingBalance) : "••••"}
              </Text>
            </View>
          )}
        </View>

        {/* Amount Input */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>¿Cuánto quieres retirar?</Text>
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Monto a retirar</Text>
            <View style={styles.amountInputContainer}>
              <Text style={styles.currencySymbol}>RD$</Text>
              <TextInput
                style={styles.amountInput}
                placeholder="0"
                value={amount}
                onChangeText={setAmount}
                keyboardType="numeric"
                placeholderTextColor="#9CA3AF"
              />
            </View>
            {amount && !isValidAmount && (
              <Text style={styles.errorText}>
                {totalDeduction > walletBalance
                  ? "Saldo insuficiente"
                  : !selectedAccount
                    ? "Selecciona una cuenta bancaria destino"
                    : `El monto mínimo a retirar es ${formatCurrency(MIN_WITHDRAW_AMOUNT)}`}
              </Text>
            )}
          </View>

          <TouchableOpacity style={styles.maxButton} onPress={handleMaxAmount}>
            <Text style={styles.maxButtonText}>Retirar máximo disponible</Text>
          </TouchableOpacity>
        </View>

        {/* Bank Account Selection */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Cuenta bancaria destino</Text>
          <View style={styles.accountsContainer}>
            {loadingAccounts ? (
              <ActivityIndicator size="small" color="#3B82F6" />
            ) : bankAccounts.length === 0 ? (
              <View style={styles.emptyAccountsState}>
                <Ionicons name="business-outline" size={40} color="#d1d5db" />
                <Text style={styles.emptyAccountsTitle}>Aún no tienes cuentas bancarias</Text>
                <Text style={styles.emptyAccountsSubtitle}>
                  Agrega una cuenta bancaria para poder retirar tu saldo
                </Text>
              </View>
            ) : (
              bankAccounts.map((account) => (
                <TouchableOpacity
                  key={account.id}
                  style={[
                    styles.accountItem,
                    selectedAccount === account.id && styles.selectedAccount,
                  ]}
                  onPress={() => setSelectedAccount(account.id)}
                >
                  <View style={styles.accountIcon}>
                    <Ionicons name="business" size={20} color="#6B7280" />
                  </View>

                  <View style={styles.accountInfo}>
                    <View style={styles.accountHeader}>
                      <Text style={styles.accountName}>{getPaymentMethodDisplayName(account)}</Text>
                      {account.isDefault && (
                        <View style={styles.defaultBadge}>
                          <Text style={styles.defaultBadgeText}>Predeterminada</Text>
                        </View>
                      )}
                    </View>
                  </View>

                  <View style={[
                    styles.radioButton,
                    selectedAccount === account.id && styles.radioButtonSelected,
                  ]}>
                    {selectedAccount === account.id && (
                      <View style={styles.radioButtonInner} />
                    )}
                  </View>
                </TouchableOpacity>
              ))
            )}

            <TouchableOpacity
              style={styles.addAccountButton}
              onPress={() => navigation.navigate('AddPaymentMethod')}
            >
              <Text style={styles.addAccountText}>+ Agregar nueva cuenta bancaria</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Transaction Summary */}
        {amount && isValidAmount && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Resumen del retiro</Text>
            <View style={styles.summaryContainer}>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Monto a retirar:</Text>
                <Text style={styles.summaryValue}>{formatCurrency(numericAmount)}</Text>
              </View>
              <View style={[styles.summaryRow, styles.borderTop]}>
                <Text style={styles.summaryLabelFinal}>Recibirás en tu cuenta:</Text>
                <Text style={styles.summaryValueFinal}>{formatCurrency(numericAmount)}</Text>
              </View>
            </View>

            <View style={styles.securityAlert}>
              <Ionicons name="shield-checkmark" size={20} color="#2563EB" />
              <Text style={styles.securityText}>
                Los retiros se procesan en días hábiles de 9:00 AM a 5:00 PM.
              </Text>
            </View>
          </View>
        )}

        {/* Important Information */}
        <View style={styles.card}>
          <View style={styles.infoHeader}>
            <Ionicons name="information-circle" size={20} color="#2563EB" />
            <Text style={styles.infoTitle}>Información importante</Text>
          </View>
          <View style={styles.infoList}>
            <View style={styles.infoItem}>
              <View style={styles.infoDot} />
              <Text style={styles.infoItemText}>
                Los retiros se procesan únicamente en días hábiles (lunes a viernes)
              </Text>
            </View>
            <View style={styles.infoItem}>
              <View style={styles.infoDot} />
              <Text style={styles.infoItemText}>
                El horario de procesamiento es de 9:00 AM a 5:00 PM
              </Text>
            </View>
            <View style={styles.infoItem}>
              <View style={styles.infoDot} />
              <Text style={styles.infoItemText}>
                El monto aparecerá en tu cuenta bancaria en los próximos 2 días hábiles
              </Text>
            </View>
          </View>
        </View>

        {/* Action Button */}
        <View style={styles.bottomSpacing}>
          <TouchableOpacity
            style={[
              styles.withdrawButton,
              (!amount || !isValidAmount || isProcessing) && styles.withdrawButtonDisabled,
            ]}
            onPress={handleWithdraw}
            disabled={!amount || !isValidAmount || isProcessing}
          >
            {isProcessing ? (
              <View style={styles.loadingContainer}>
                <View style={styles.spinner} />
                <Text style={styles.withdrawButtonText}>Procesando...</Text>
              </View>
            ) : (
              <Text style={styles.withdrawButtonText}>
                Retirar {amount ? formatCurrency(numericAmount) : "Dinero"}
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginLeft: 12,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  balanceCard: {
    backgroundColor: '#3B82F6',
    borderRadius: 12,
    padding: 24,
    marginBottom: 16,
  },
  balanceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  balanceLabel: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  eyeButton: {
    padding: 4,
  },
  balanceAmount: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 16,
  },
  remainingBalance: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 8,
    padding: 12,
  },
  remainingLabel: {
    fontSize: 12,
    color: '#FFFFFF',
    marginBottom: 4,
  },
  remainingValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#FFFFFF',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 16,
  },
  inputContainer: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 8,
  },
  amountInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 12,
  },
  currencySymbol: {
    fontSize: 18,
    fontWeight: '500',
    color: '#6B7280',
    marginRight: 8,
  },
  amountInput: {
    flex: 1,
    fontSize: 18,
    fontWeight: '500',
    color: '#111827',
    paddingVertical: 12,
  },
  errorText: {
    fontSize: 12,
    color: '#DC2626',
    marginTop: 4,
  },
  maxButton: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
    alignSelf: 'flex-start',
  },
  maxButtonText: {
    fontSize: 14,
    color: '#374151',
  },
  accountsContainer: {
    gap: 12,
  },
  accountItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
  },
  selectedAccount: {
    borderColor: '#3B82F6',
    backgroundColor: '#EFF6FF',
  },
  emptyAccountsState: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  emptyAccountsTitle: {
    color: '#6b7280',
    marginTop: 12,
    fontSize: 15,
    fontWeight: '500',
  },
  emptyAccountsSubtitle: {
    color: '#9ca3af',
    marginTop: 4,
    fontSize: 13,
    textAlign: 'center',
  },
  accountIcon: {
    width: 40,
    height: 40,
    backgroundColor: '#F3F4F6',
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  accountInfo: {
    flex: 1,
  },
  accountHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  accountName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#111827',
    marginRight: 8,
  },
  defaultBadge: {
    backgroundColor: '#DBEAFE',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  defaultBadgeText: {
    fontSize: 10,
    color: '#1D4ED8',
    fontWeight: '500',
  },
  accountDetails: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 4,
  },
  accountMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: 12,
    color: '#6B7280',
  },
  radioButton: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioButtonSelected: {
    borderColor: '#3B82F6',
    backgroundColor: '#3B82F6',
  },
  radioButtonInner: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#FFFFFF',
  },
  addAccountButton: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  addAccountText: {
    fontSize: 14,
    color: '#374151',
  },
  summaryContainer: {
    gap: 12,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: 14,
    color: '#6B7280',
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#111827',
  },
  summaryValueDeduction: {
    fontSize: 14,
    fontWeight: '500',
    color: '#DC2626',
  },
  summaryLabelFinal: {
    fontSize: 14,
    fontWeight: '500',
    color: '#111827',
  },
  summaryValueFinal: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#3B82F6',
  },
  borderTop: {
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    paddingTop: 12,
  },
  securityAlert: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#EFF6FF',
    padding: 12,
    borderRadius: 8,
    marginTop: 16,
    gap: 8,
  },
  securityText: {
    flex: 1,
    fontSize: 12,
    color: '#1E40AF',
    lineHeight: 16,
  },
  infoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 8,
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  infoList: {
    gap: 12,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  infoDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#3B82F6',
    marginTop: 6,
  },
  infoItemText: {
    flex: 1,
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
  },
  withdrawButton: {
    backgroundColor: '#3B82F6',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 16,
  },
  withdrawButtonDisabled: {
    backgroundColor: '#D1D5DB',
  },
  withdrawButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  spinner: {
    width: 16,
    height: 16,
    borderWidth: 2,
    borderColor: '#FFFFFF',
    borderTopColor: 'transparent',
    borderRadius: 8,
  },
  bottomSpacing: {
    paddingBottom: 24,
  },
  // Confirmation screen styles
  confirmationCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 32,
    alignItems: 'center',
    marginTop: 20,
  },
  confirmationIcon: {
    width: 64,
    height: 64,
    backgroundColor: '#DBEAFE',
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  confirmationTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 8,
    textAlign: 'center',
  },
  confirmationSubtitle: {
    fontSize: 16,
    color: '#6B7280',
    marginBottom: 24,
    textAlign: 'center',
    lineHeight: 22,
  },
  transactionDetails: {
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    padding: 16,
    marginBottom: 24,
    width: '100%',
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  detailLabel: {
    fontSize: 14,
    color: '#6B7280',
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#111827',
  },
  estimatedTime: {
    fontSize: 14,
    fontWeight: '500',
    color: '#3B82F6',
  },
  infoAlert: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#EFF6FF',
    padding: 12,
    borderRadius: 8,
    marginBottom: 24,
    gap: 8,
  },
  infoText: {
    flex: 1,
    fontSize: 12,
    color: '#1E40AF',
    lineHeight: 16,
  },
  buttonContainer: {
    width: '100%',
    gap: 12,
  },
  primaryButton: {
    backgroundColor: '#3B82F6',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  secondaryButton: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#374151',
  },
}); 