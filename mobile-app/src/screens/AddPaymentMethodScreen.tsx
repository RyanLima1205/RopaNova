import React, { useState } from 'react'
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  SafeAreaView,
  Platform,
  Alert,
} from 'react-native'
import { Ionicons, MaterialCommunityIcons, FontAwesome5, Feather } from '@expo/vector-icons'
import { useNavigation } from '@react-navigation/native'
import { useAuth } from '../contexts/AuthContext'
import { addPaymentMethod } from '../services/paymentService'

import { logger } from '../utils/logger'
// Dominican banks
const dominican_banks = [
  { id: "popular", name: "Banco Popular Dominicano", code: "001" },
  { id: "reservas", name: "Banco de Reservas", code: "002" },
  { id: "bhd", name: "Banco BHD León", code: "003" },
  { id: "scotiabank", name: "Scotiabank", code: "004" },
  { id: "banreservas", name: "BanReservas", code: "005" },
  { id: "promerica", name: "Banco Promerica", code: "006" },
  { id: "santa_cruz", name: "Banco Santa Cruz", code: "007" },
  { id: "caribe", name: "Banco Caribe", code: "008" },
]

// Mobile payment providers
const mobile_providers = [
  { id: "tpago", name: "Tpago", description: "Pago móvil de Tricom" },
  { id: "azul", name: "Azul Mobile", description: "App móvil de Banco Azul" },
  { id: "bhd_app", name: "BHD App", description: "Aplicación BHD León" },
  { id: "popular_app", name: "Popular App", description: "Banco Popular móvil" },
]

/** G0-3 : pas de saisie PAN/CVV dans l’app — intégration PSP tokenisé (ex. Stripe) plus tard. */
type PaymentType = 'bank_transfer' | 'mobile_payment'

export const AddPaymentMethodScreen: React.FC = () => {
  const navigation = useNavigation()
  const { user } = useAuth()
  const [paymentType, setPaymentType] = useState<PaymentType>('bank_transfer')
  const [isLoading, setIsLoading] = useState(false)
  const [showBankSelector, setShowBankSelector] = useState(false)
  const [showProviderSelector, setShowProviderSelector] = useState(false)
  
  const [formData, setFormData] = useState({
    // Bank transfer data
    bankId: '',
    accountNumber: '',
    accountType: 'checking',
    accountHolderName: '',

    // Mobile payment data
    mobileProvider: '',
    phoneNumber: '',

    // General
    makeDefault: false,
    saveForFuture: true,
  })

  const [errors, setErrors] = useState<Record<string, string>>({})

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (paymentType === 'bank_transfer') {
      if (!formData.bankId) newErrors.bankId = 'Banco requerido'
      if (!formData.accountNumber) newErrors.accountNumber = 'Número de cuenta requerido'
      if (!formData.accountHolderName) newErrors.accountHolderName = 'Nombre del titular requerido'
    } else if (paymentType === 'mobile_payment') {
      if (!formData.mobileProvider) newErrors.mobileProvider = 'Proveedor requerido'
      if (!formData.phoneNumber) newErrors.phoneNumber = 'Número de teléfono requerido'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async () => {
    if (!validateForm()) return
    
    if (!user?.id) {
      Alert.alert('Error', 'Debes iniciar sesión para agregar un método de pago')
      return
    }

    setIsLoading(true)
    
    try {
      let paymentMethodData: any = {
        isDefault: formData.makeDefault,
        isActive: true,
        isVerified: false,
      }
      
      // Préparer les données selon le type
      if (paymentType === 'bank_transfer') {
        const selectedBank = dominican_banks.find(b => b.id === formData.bankId)
        
        paymentMethodData = {
          ...paymentMethodData,
          type: 'bank_transfer',
          name: `${selectedBank?.name} - ${formData.accountNumber.slice(-4)}`,
          details: {
            bankName: selectedBank?.name || '',
            accountNumber: formData.accountNumber,
            accountHolder: formData.accountHolderName,
            accountType: formData.accountType,
          }
        }
      } else if (paymentType === 'mobile_payment') {
        const selectedProvider = mobile_providers.find(p => p.id === formData.mobileProvider)
        
        paymentMethodData = {
          ...paymentMethodData,
          type: 'mobile_payment',
          name: `${selectedProvider?.name} - ${formData.phoneNumber}`,
          details: {
            provider: selectedProvider?.name || '',
            phoneNumber: formData.phoneNumber,
          }
        }
      }
      
      // ✅ SAUVEGARDE DANS FIREBASE
      await addPaymentMethod(user.id, paymentMethodData)
      
      setIsLoading(false)
      Alert.alert(
        '¡Éxito!', 
        'Método de pago agregado correctamente', 
        [
          { 
            text: 'OK', 
            onPress: () => navigation.goBack() 
          }
        ]
      )
    } catch (error: any) {
      logger.error('Error al agregar método de pago:', error)
      setIsLoading(false)
      Alert.alert(
        'Error', 
        error.message || 'No se pudo agregar el método de pago. Inténtalo de nuevo.'
      )
    }
  }

  const formatPhoneNumber = (value: string) => {
    const cleaned = value.replace(/\D/g, '')
    const match = cleaned.match(/^(\d{3})(\d{3})(\d{4})$/)
    if (match) {
      return `(${match[1]}) ${match[2]}-${match[3]}`
    }
    return value
  }

  const renderPaymentTypeSelector = () => (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>Selecciona el tipo de pago</Text>
      <Text style={styles.cardSubtitle}>Elige cómo quieres recibir tus pagos</Text>
      
      <View style={[styles.paymentTypeOption, styles.paymentTypeOptionDisabled]}>
        <View style={styles.paymentTypeContent}>
          <View style={styles.paymentTypeIcon}>
            <Ionicons name="card" size={20} color="#9ca3af" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.paymentTypeTitle, styles.textMuted]}>Tarjeta de Crédito/Débito</Text>
            <Text style={styles.paymentTypeSubtitle}>
              Próximamente: enlace seguro con proveedor de pagos (sin ingresar PAN/CVV en la app)
            </Text>
          </View>
          <View style={styles.badgeSoon}>
            <Text style={styles.badgeTextSoon}>Próximamente</Text>
          </View>
        </View>
      </View>

      <TouchableOpacity 
        style={[styles.paymentTypeOption, paymentType === 'bank_transfer' && styles.selectedOption]}
        onPress={() => setPaymentType('bank_transfer')}
      >
        <View style={styles.paymentTypeContent}>
          <View style={styles.paymentTypeIcon}>
            <FontAwesome5 name="university" size={18} color="#7c3aed" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.paymentTypeTitle}>Transferencia Bancaria</Text>
            <Text style={styles.paymentTypeSubtitle}>Bancos dominicanos principales</Text>
          </View>
        </View>
      </TouchableOpacity>

      <TouchableOpacity 
        style={[styles.paymentTypeOption, paymentType === 'mobile_payment' && styles.selectedOption]}
        onPress={() => setPaymentType('mobile_payment')}
      >
        <View style={styles.paymentTypeContent}>
          <View style={styles.paymentTypeIcon}>
            <MaterialCommunityIcons name="cellphone" size={20} color="#ea580c" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.paymentTypeTitle}>Pago Móvil</Text>
            <Text style={styles.paymentTypeSubtitle}>Tpago, Azul Mobile, BHD App</Text>
          </View>
          <View style={styles.badgeRecommended}>
            <Text style={styles.badgeText}>Popular</Text>
          </View>
        </View>
      </TouchableOpacity>
    </View>
  )

  const renderBankForm = () => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <FontAwesome5 name="university" size={18} color="#111827" />
        <Text style={styles.cardTitle}>Información Bancaria</Text>
      </View>
      
      <View style={styles.inputGroup}>
        <Text style={styles.label}>Banco</Text>
        <TouchableOpacity 
          style={[styles.input, styles.selectorInput, errors.bankId && styles.inputError]}
          onPress={() => setShowBankSelector(true)}
        >
          <Text style={formData.bankId ? styles.selectorText : styles.placeholderText}>
            {formData.bankId ? dominican_banks.find(b => b.id === formData.bankId)?.name : 'Selecciona tu banco'}
          </Text>
          <Ionicons name="chevron-down" size={20} color="#6b7280" />
        </TouchableOpacity>
        {errors.bankId && <Text style={styles.errorText}>{errors.bankId}</Text>}
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Tipo de Cuenta</Text>
        <View style={styles.radioGroup}>
          <TouchableOpacity 
            style={[styles.radioOption, formData.accountType === 'checking' && styles.radioSelected]}
            onPress={() => handleInputChange('accountType', 'checking')}
          >
            <View style={[styles.radioButton, formData.accountType === 'checking' && styles.radioButtonSelected]} />
            <Text style={styles.radioText}>Corriente</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.radioOption, formData.accountType === 'savings' && styles.radioSelected]}
            onPress={() => handleInputChange('accountType', 'savings')}
          >
            <View style={[styles.radioButton, formData.accountType === 'savings' && styles.radioButtonSelected]} />
            <Text style={styles.radioText}>Ahorros</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Número de Cuenta</Text>
        <TextInput
          style={[styles.input, errors.accountNumber && styles.inputError]}
          placeholder="Número de cuenta bancaria"
          value={formData.accountNumber}
          onChangeText={(value) => handleInputChange('accountNumber', value.replace(/\D/g, ''))}
          keyboardType="numeric"
        />
        {errors.accountNumber && <Text style={styles.errorText}>{errors.accountNumber}</Text>}
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Nombre del Titular</Text>
        <TextInput
          style={[styles.input, errors.accountHolderName && styles.inputError]}
          placeholder="Como aparece en la cuenta"
          value={formData.accountHolderName}
          onChangeText={(value) => handleInputChange('accountHolderName', value)}
        />
        {errors.accountHolderName && <Text style={styles.errorText}>{errors.accountHolderName}</Text>}
      </View>
    </View>
  )

  const renderMobileForm = () => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <MaterialCommunityIcons name="cellphone" size={20} color="#111827" />
        <Text style={styles.cardTitle}>Pago Móvil</Text>
      </View>
      
      <View style={styles.inputGroup}>
        <Text style={styles.label}>Proveedor</Text>
        <TouchableOpacity 
          style={[styles.input, styles.selectorInput, errors.mobileProvider && styles.inputError]}
          onPress={() => setShowProviderSelector(true)}
        >
          <Text style={formData.mobileProvider ? styles.selectorText : styles.placeholderText}>
            {formData.mobileProvider ? mobile_providers.find(p => p.id === formData.mobileProvider)?.name : 'Selecciona el proveedor'}
          </Text>
          <Ionicons name="chevron-down" size={20} color="#6b7280" />
        </TouchableOpacity>
        {errors.mobileProvider && <Text style={styles.errorText}>{errors.mobileProvider}</Text>}
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Número de Teléfono</Text>
        <TextInput
          style={[styles.input, errors.phoneNumber && styles.inputError]}
          placeholder="(809) 123-4567"
          value={formData.phoneNumber}
          onChangeText={(value) => handleInputChange('phoneNumber', formatPhoneNumber(value))}
          keyboardType="phone-pad"
        />
        {errors.phoneNumber && <Text style={styles.errorText}>{errors.phoneNumber}</Text>}
      </View>
    </View>
  )

  const renderOptions = () => (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>Opciones</Text>
      
      <TouchableOpacity 
        style={styles.checkboxOption}
        onPress={() => handleInputChange('makeDefault', !formData.makeDefault)}
      >
        <View style={[styles.checkbox, formData.makeDefault && styles.checkboxChecked]}>
          {formData.makeDefault && <Ionicons name="checkmark" size={16} color="#fff" />}
        </View>
        <Text style={styles.checkboxText}>Hacer este método predeterminado</Text>
      </TouchableOpacity>

      <TouchableOpacity 
        style={styles.checkboxOption}
        onPress={() => handleInputChange('saveForFuture', !formData.saveForFuture)}
      >
        <View style={[styles.checkbox, formData.saveForFuture && styles.checkboxChecked]}>
          {formData.saveForFuture && <Ionicons name="checkmark" size={16} color="#fff" />}
        </View>
        <Text style={styles.checkboxText}>Guardar para futuros pagos</Text>
      </TouchableOpacity>
    </View>
  )

  const renderSecurityNotice = () => (
    <View style={styles.card}>
      <View style={styles.securityContent}>
        <Ionicons name="shield-checkmark" size={20} color="#059669" />
        <View style={{ flex: 1, marginLeft: 12 }}>
          <Text style={styles.securityTitle}>Tu información está segura</Text>
          <Text style={styles.securityText}>
            Los datos de tarjeta no se capturan en la app: cuando esté disponible, usarás un flujo seguro con el proveedor de pagos. Para transferencia y pago móvil, solo guardamos lo que indicas para retiros y métodos de pago en RopaNova.
          </Text>
        </View>
      </View>
    </View>
  )

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#f9fafb' }}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Agregar Método de Pago</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 32 }}>
        {renderPaymentTypeSelector()}
        
        {paymentType === 'bank_transfer' && renderBankForm()}
        {paymentType === 'mobile_payment' && renderMobileForm()}
        
        {renderOptions()}
        {renderSecurityNotice()}

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <TouchableOpacity 
            style={styles.cancelButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.cancelButtonText}>Cancelar</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.submitButton, isLoading && styles.submitButtonDisabled]}
            onPress={handleSubmit}
            disabled={isLoading}
          >
            <Text style={styles.submitButtonText}>
              {isLoading ? 'Agregando...' : 'Agregar Método'}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Bank Selector Modal */}
      {showBankSelector && (
        <View style={styles.modalOverlay}>
          <View style={styles.modal}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Seleccionar Banco</Text>
              <TouchableOpacity onPress={() => setShowBankSelector(false)}>
                <Ionicons name="close" size={24} color="#6b7280" />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalContent}>
              {dominican_banks.map((bank) => (
                <TouchableOpacity
                  key={bank.id}
                  style={styles.modalOption}
                  onPress={() => {
                    handleInputChange('bankId', bank.id)
                    setShowBankSelector(false)
                  }}
                >
                  <Text style={styles.modalOptionText}>{bank.name}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      )}

      {/* Provider Selector Modal */}
      {showProviderSelector && (
        <View style={styles.modalOverlay}>
          <View style={styles.modal}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Seleccionar Proveedor</Text>
              <TouchableOpacity onPress={() => setShowProviderSelector(false)}>
                <Ionicons name="close" size={24} color="#6b7280" />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalContent}>
              {mobile_providers.map((provider) => (
                <TouchableOpacity
                  key={provider.id}
                  style={styles.modalOption}
                  onPress={() => {
                    handleInputChange('mobileProvider', provider.id)
                    setShowProviderSelector(false)
                  }}
                >
                  <Text style={styles.modalOptionText}>{provider.name}</Text>
                  <Text style={styles.modalOptionSubtext}>{provider.description}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      )}
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
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
    flex: 1,
    textAlign: 'center',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 1 },
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  cardTitle: {
    fontWeight: 'bold',
    fontSize: 17,
    color: '#111827',
  },
  cardSubtitle: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 16,
  },
  paymentTypeOption: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  selectedOption: {
    borderColor: '#059669',
    backgroundColor: '#f0fdf4',
  },
  paymentTypeOptionDisabled: {
    backgroundColor: '#f9fafb',
    borderColor: '#e5e7eb',
  },
  textMuted: {
    color: '#6b7280',
  },
  badgeSoon: {
    backgroundColor: '#e5e7eb',
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  badgeTextSoon: {
    color: '#4b5563',
    fontWeight: '600',
    fontSize: 10,
  },
  paymentTypeContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  paymentTypeIcon: {
    width: 40,
    height: 40,
    backgroundColor: '#f3f4f6',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  paymentTypeTitle: {
    fontWeight: 'bold',
    fontSize: 15,
    color: '#111827',
  },
  paymentTypeSubtitle: {
    fontSize: 13,
    color: '#6b7280',
    marginTop: 2,
  },
  badgeRecommended: {
    backgroundColor: '#dcfce7',
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  badgeText: {
    color: '#059669',
    fontWeight: 'bold',
    fontSize: 11,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontWeight: 'bold',
    fontSize: 14,
    color: '#111827',
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#fff',
  },
  inputError: {
    borderColor: '#ef4444',
  },
  selectorInput: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  selectorText: {
    fontSize: 16,
    color: '#111827',
  },
  placeholderText: {
    fontSize: 16,
    color: '#9ca3af',
  },
  errorText: {
    color: '#ef4444',
    fontSize: 12,
    marginTop: 4,
  },
  row: {
    flexDirection: 'row',
  },
  radioGroup: {
    flexDirection: 'row',
    gap: 24,
  },
  radioOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  radioSelected: {
    // Additional styling if needed
  },
  radioButton: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#d1d5db',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioButtonSelected: {
    borderColor: '#059669',
    backgroundColor: '#059669',
  },
  radioText: {
    fontSize: 14,
    color: '#111827',
  },
  checkboxOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: '#d1d5db',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    borderColor: '#059669',
    backgroundColor: '#059669',
  },
  checkboxText: {
    fontSize: 14,
    color: '#111827',
  },
  securityContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  securityTitle: {
    fontWeight: 'bold',
    fontSize: 14,
    color: '#111827',
    marginBottom: 4,
  },
  securityText: {
    fontSize: 12,
    color: '#6b7280',
    lineHeight: 16,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  cancelButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    padding: 14,
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  cancelButtonText: {
    fontWeight: 'bold',
    fontSize: 16,
    color: '#6b7280',
  },
  submitButton: {
    flex: 1,
    backgroundColor: '#059669',
    borderRadius: 8,
    padding: 14,
    alignItems: 'center',
  },
  submitButtonDisabled: {
    backgroundColor: '#9ca3af',
  },
  submitButtonText: {
    fontWeight: 'bold',
    fontSize: 16,
    color: '#fff',
  },
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modal: {
    backgroundColor: '#fff',
    borderRadius: 12,
    width: '90%',
    maxHeight: '70%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  modalTitle: {
    fontWeight: 'bold',
    fontSize: 18,
    color: '#111827',
  },
  modalContent: {
    maxHeight: 300,
  },
  modalOption: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  modalOptionText: {
    fontSize: 16,
    color: '#111827',
    fontWeight: '500',
  },
  modalOptionSubtext: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 2,
  },
}) 