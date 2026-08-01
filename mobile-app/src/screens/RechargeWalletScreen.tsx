import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  SafeAreaView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons, FontAwesome5, Feather } from '@expo/vector-icons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../../App';
import { auth } from '../firebaseConfig';
import {
  getPaymentMethods,
  getPaymentMethodDisplayName,
  getPaymentMethodIcon,
  PaymentMethod,
} from '../services/paymentService';

type RechargeWalletScreenNavigationProp = StackNavigationProp<RootStackParamList, 'RechargeWallet'>;

// Quick amount options
const quickAmounts = [500, 1000, 2000, 5000, 10000, 15000];

export const RechargeWalletScreen: React.FC = () => {
  const navigation = useNavigation<RechargeWalletScreenNavigationProp>();
  const [amount, setAmount] = useState("");
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [loadingMethods, setLoadingMethods] = useState(true);
  const [selectedMethod, setSelectedMethod] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);

  useFocusEffect(
    React.useCallback(() => {
      const uid = auth.currentUser?.uid;
      if (!uid) {
        setLoadingMethods(false);
        return;
      }
      setLoadingMethods(true);
      getPaymentMethods(uid).then((methods) => {
        setPaymentMethods(methods);
        setSelectedMethod((current) => {
          if (current && methods.some((m) => m.id === current)) return current;
          return methods.find((m) => m.isDefault)?.id ?? methods[0]?.id ?? null;
        });
        setLoadingMethods(false);
      });
    }, []),
  );

  const selectedPaymentMethod = paymentMethods.find((method) => method.id === selectedMethod);
  const numericAmount = Number.parseFloat(amount) || 0;
  const totalAmount = numericAmount;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("es-DO", {
      style: "currency",
      currency: "DOP",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const handleQuickAmount = (quickAmount: number) => {
    setAmount(quickAmount.toString());
  };

  const handleRecharge = async () => {
    if (!amount || numericAmount < 100) return;

    setIsProcessing(true);

    // Simulate processing
    setTimeout(() => {
      setIsProcessing(false);
      setShowConfirmation(true);
    }, 2000);
  };

  const isValidAmount = numericAmount >= 100 && numericAmount <= 50000;

  const renderConfirmationScreen = () => (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.navigate('Wallet')}
        >
          <Ionicons name="arrow-back" size={24} color="#374151" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Recarga Exitosa</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.confirmationContainer}>
        <View style={styles.confirmationCard}>
          <View style={styles.successIcon}>
            <Ionicons name="checkmark-circle" size={32} color="#059669" />
          </View>

          <Text style={styles.confirmationTitle}>¡Recarga Exitosa!</Text>
          <Text style={styles.confirmationSubtitle}>
            Tu wallet ha sido recargado con {formatCurrency(numericAmount)}
          </Text>

          <View style={styles.transactionSummary}>
            <View style={[styles.summaryRow, styles.summaryTotal]}>
              <Text style={styles.summaryTotalLabel}>Total pagado:</Text>
              <Text style={styles.summaryTotalValue}>{formatCurrency(totalAmount)}</Text>
            </View>
          </View>

          <View style={styles.confirmationActions}>
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
      </View>
    </View>
  );

  if (showConfirmation) {
    return renderConfirmationScreen();
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
        <Text style={styles.headerTitle}>Recargar Wallet</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Amount Input */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>¿Cuánto quieres recargar?</Text>
          <View style={styles.cardContent}>
            <View style={styles.amountInputContainer}>
              <Text style={styles.inputLabel}>Monto a recargar</Text>
              <View style={styles.amountInputWrapper}>
                <Text style={styles.currencySymbol}>RD$</Text>
                <TextInput
                  style={styles.amountInput}
                  placeholder="0"
                  value={amount}
                  onChangeText={setAmount}
                  keyboardType="numeric"
                  placeholderTextColor="#9ca3af"
                />
              </View>
              {amount && !isValidAmount && (
                <Text style={styles.errorText}>
                  El monto debe estar entre RD$100 y {formatCurrency(50000)}
                </Text>
              )}
            </View>

            {/* Quick Amount Buttons */}
            <View style={styles.quickAmountsContainer}>
              <Text style={styles.quickAmountsLabel}>Montos rápidos</Text>
              <View style={styles.quickAmountsGrid}>
                {quickAmounts.map((quickAmount) => (
                  <TouchableOpacity
                    key={quickAmount}
                    style={styles.quickAmountButton}
                    onPress={() => handleQuickAmount(quickAmount)}
                  >
                    <Text style={styles.quickAmountText}>{formatCurrency(quickAmount)}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>
        </View>

        {/* Payment Methods */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Método de pago</Text>
          <View style={styles.cardContent}>
            {loadingMethods ? (
              <ActivityIndicator size="small" color="#059669" />
            ) : paymentMethods.length === 0 ? (
              <View style={styles.emptyMethodsState}>
                <Ionicons name="card-outline" size={40} color="#d1d5db" />
                <Text style={styles.emptyMethodsTitle}>Aún no tienes métodos de pago</Text>
                <Text style={styles.emptyMethodsSubtitle}>
                  Agrega una tarjeta, cuenta bancaria o pago móvil para recargar tu wallet
                </Text>
              </View>
            ) : (
              paymentMethods.map((method) => (
                <TouchableOpacity
                  key={method.id}
                  style={[
                    styles.paymentMethodItem,
                    selectedMethod === method.id && styles.paymentMethodSelected
                  ]}
                  onPress={() => setSelectedMethod(method.id)}
                >
                  <View style={styles.paymentMethodIcon}>
                    <Ionicons name={getPaymentMethodIcon(method.type) as any} size={20} color="#6b7280" />
                  </View>

                  <View style={styles.paymentMethodContent}>
                    <View style={styles.paymentMethodHeader}>
                      <Text style={styles.paymentMethodName}>{getPaymentMethodDisplayName(method)}</Text>
                      {method.isDefault && (
                        <View style={styles.defaultBadge}>
                          <Text style={styles.defaultBadgeText}>Predeterminado</Text>
                        </View>
                      )}
                    </View>
                  </View>

                  <View style={[
                    styles.radioButton,
                    selectedMethod === method.id && styles.radioButtonSelected
                  ]}>
                    {selectedMethod === method.id && (
                      <View style={styles.radioButtonInner} />
                    )}
                  </View>
                </TouchableOpacity>
              ))
            )}

            <TouchableOpacity
              style={styles.addPaymentMethodButton}
              onPress={() => navigation.navigate('AddPaymentMethod')}
            >
              <Text style={styles.addPaymentMethodText}>+ Agregar nuevo método de pago</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Transaction Summary */}
        {amount && isValidAmount && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Resumen de la transacción</Text>
            <View style={styles.cardContent}>
              <View style={styles.summaryContainer}>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Monto a recargar:</Text>
                  <Text style={styles.summaryValue}>{formatCurrency(numericAmount)}</Text>
                </View>
                <View style={[styles.summaryRow, styles.summaryTotal]}>
                  <Text style={styles.summaryTotalLabel}>Total a pagar:</Text>
                  <Text style={styles.summaryTotalValue}>{formatCurrency(totalAmount)}</Text>
                </View>
              </View>

              <View style={styles.securityAlert}>
                <Ionicons name="shield-checkmark" size={16} color="#059669" />
                <Text style={styles.securityAlertText}>
                  Tu información está protegida con encriptación SSL de 256 bits. El dinero estará disponible en tu
                  wallet usando {selectedPaymentMethod ? getPaymentMethodDisplayName(selectedPaymentMethod) : 'tu método de pago'}.
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* Action Button */}
        <View style={styles.actionButtonContainer}>
          <TouchableOpacity
            style={[
              styles.actionButton,
              (!amount || !isValidAmount || !selectedMethod || isProcessing) && styles.actionButtonDisabled
            ]}
            onPress={handleRecharge}
            disabled={!amount || !isValidAmount || !selectedMethod || isProcessing}
          >
            {isProcessing ? (
              <View style={styles.processingContainer}>
                <ActivityIndicator size="small" color="#ffffff" />
                <Text style={styles.actionButtonText}>Procesando...</Text>
              </View>
            ) : (
              <Text style={styles.actionButtonText}>
                Recargar {amount ? formatCurrency(numericAmount) : "Wallet"}
              </Text>
            )}
          </TouchableOpacity>
        </View>

        <View style={styles.bottomSpacing} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
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
  headerTitle: {
    fontWeight: 'bold',
    fontSize: 18,
    color: '#111827',
  },
  scrollView: {
    padding: 16,
    paddingBottom: 32,
  },
  card: {
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
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 16,
  },
  cardContent: {
    gap: 16,
  },
  amountInputContainer: {
    gap: 8,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
  },
  amountInputWrapper: {
    position: 'relative',
  },
  currencySymbol: {
    position: 'absolute',
    left: 12,
    top: 12,
    fontSize: 16,
    color: '#6b7280',
    zIndex: 1,
  },
  amountInput: {
    backgroundColor: '#f9fafb',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    paddingHorizontal: 40,
    paddingVertical: 12,
    fontSize: 18,
    fontWeight: '500',
    color: '#111827',
  },
  errorText: {
    fontSize: 12,
    color: '#dc2626',
  },
  quickAmountsContainer: {
    gap: 8,
  },
  quickAmountsLabel: {
    fontSize: 12,
    color: '#6b7280',
  },
  quickAmountsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  quickAmountButton: {
    flex: 1,
    minWidth: '30%',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 6,
    backgroundColor: '#ffffff',
    alignItems: 'center',
  },
  quickAmountText: {
    fontSize: 12,
    color: '#374151',
    fontWeight: '500',
  },
  paymentMethodItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    backgroundColor: '#ffffff',
  },
  paymentMethodSelected: {
    borderColor: '#059669',
    backgroundColor: '#f0fdf4',
  },
  paymentMethodIcon: {
    width: 40,
    height: 40,
    backgroundColor: '#f3f4f6',
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  paymentMethodContent: {
    flex: 1,
  },
  paymentMethodHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  paymentMethodName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#111827',
  },
  defaultBadge: {
    backgroundColor: '#d1fae5',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  defaultBadgeText: {
    fontSize: 10,
    color: '#059669',
    fontWeight: '600',
  },
  paymentMethodDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  paymentMethodDetail: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  paymentMethodDetailText: {
    fontSize: 12,
    color: '#6b7280',
  },
  radioButton: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#d1d5db',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioButtonSelected: {
    borderColor: '#059669',
    backgroundColor: '#059669',
  },
  radioButtonInner: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#ffffff',
  },
  emptyMethodsState: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  emptyMethodsTitle: {
    color: '#6b7280',
    marginTop: 12,
    fontSize: 15,
    fontWeight: '500',
  },
  emptyMethodsSubtitle: {
    color: '#9ca3af',
    marginTop: 4,
    fontSize: 13,
    textAlign: 'center',
  },
  addPaymentMethodButton: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    marginTop: 8,
  },
  addPaymentMethodText: {
    fontSize: 14,
    color: '#6b7280',
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
    color: '#6b7280',
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#111827',
  },
  summaryTotal: {
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  summaryTotalLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#111827',
  },
  summaryTotalValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#059669',
  },
  securityAlert: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: '#f0fdf4',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#bbf7d0',
  },
  securityAlertText: {
    flex: 1,
    fontSize: 12,
    color: '#065f46',
    lineHeight: 16,
  },
  actionButtonContainer: {
    paddingBottom: 16,
  },
  actionButton: {
    backgroundColor: '#059669',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
  },
  actionButtonDisabled: {
    backgroundColor: '#d1d5db',
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
  processingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  bottomSpacing: {
    height: 80,
  },
  // Confirmation screen styles
  confirmationContainer: {
    flex: 1,
    padding: 16,
    justifyContent: 'center',
  },
  confirmationCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  successIcon: {
    width: 64,
    height: 64,
    backgroundColor: '#d1fae5',
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  confirmationTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 8,
  },
  confirmationSubtitle: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 24,
  },
  transactionSummary: {
    backgroundColor: '#f9fafb',
    borderRadius: 8,
    padding: 16,
    marginBottom: 24,
    width: '100%',
  },
  confirmationActions: {
    width: '100%',
    gap: 12,
  },
  primaryButton: {
    backgroundColor: '#059669',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
  secondaryButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    backgroundColor: '#ffffff',
    alignItems: 'center',
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#6b7280',
  },
}); 