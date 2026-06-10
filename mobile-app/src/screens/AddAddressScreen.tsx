import React, { useEffect, useState } from 'react'
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  Alert,
  ActivityIndicator,
} from 'react-native'
import { Ionicons, FontAwesome5, Feather } from '@expo/vector-icons'
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native'
import { StackNavigationProp } from '@react-navigation/stack'
import { RootStackParamList } from '../../App'
import { useAuth } from '../contexts/AuthContext'
import {
  addAddress,
  getAddress,
  updateAddress,
  type AddressType,
} from '../services/addressService'

type AddAddressNavigationProp = StackNavigationProp<RootStackParamList, 'AddAddress'>
type AddAddressRouteProp = RouteProp<RootStackParamList, 'AddAddress'>

// Dominican provinces
const provinces = [
  "Distrito Nacional",
  "Azua",
  "Baoruco",
  "Barahona",
  "Dajabón",
  "Duarte",
  "Elías Piña",
  "El Seibo",
  "Espaillat",
  "Hato Mayor",
  "Hermanas Mirabal",
  "Independencia",
  "La Altagracia",
  "La Romana",
  "La Vega",
  "María Trinidad Sánchez",
  "Monseñor Nouel",
  "Monte Cristi",
  "Monte Plata",
  "Pedernales",
  "Peravia",
  "Puerto Plata",
  "Samaná",
  "San Cristóbal",
  "San José de Ocoa",
  "San Juan",
  "San Pedro de Macorís",
  "Sánchez Ramírez",
  "Santiago",
  "Santiago Rodríguez",
  "Santo Domingo",
  "Valverde",
]

// Major cities by province
const citiesByProvince: { [key: string]: string[] } = {
  "Distrito Nacional": ["Santo Domingo"],
  "Santo Domingo": ["Los Alcarrizos", "Pedro Brand", "Boca Chica", "San Antonio de Guerra"],
  "Santiago": ["Santiago de los Caballeros", "Tamboril", "Villa González", "Licey al Medio"],
  "La Altagracia": ["Punta Cana", "Higüey", "Bávaro", "Cap Cana"],
  "Puerto Plata": ["Puerto Plata", "Playa Dorada", "Costa Dorada", "Cofresí"],
  "La Romana": ["La Romana", "Casa de Campo", "Bayahíbe"],
  "San Cristóbal": ["San Cristóbal", "Nigua", "Villa Altagracia", "Bajos de Haina"],
  "La Vega": ["La Vega", "Constanza", "Jarabacoa", "Bonao"],
}

const addressTypes = [
  {
    id: "home",
    label: "Casa",
    description: "Tu dirección residencial",
    icon: <Ionicons name="home" size={20} color="#059669" />,
  },
  {
    id: "work",
    label: "Trabajo",
    description: "Tu dirección laboral",
    icon: <FontAwesome5 name="building" size={18} color="#7c3aed" />,
  },
  {
    id: "other",
    label: "Otra",
    description: "Otra dirección importante",
    icon: <Feather name="map-pin" size={20} color="#6b7280" />,
  },
]

export const AddAddressScreen: React.FC = () => {
  const navigation = useNavigation<AddAddressNavigationProp>()
  const route = useRoute<AddAddressRouteProp>()
  const { user } = useAuth()
  const addressId = route.params?.addressId
  const isEditing = Boolean(addressId)

  const [selectedType, setSelectedType] = useState<AddressType>('home')
  const [showProvinceSelector, setShowProvinceSelector] = useState(false)
  const [showCitySelector, setShowCitySelector] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [loadingExisting, setLoadingExisting] = useState(isEditing)
  
  const [formData, setFormData] = useState({
    name: "",
    recipientName: "",
    phone: "",
    street: "",
    sector: "",
    city: "",
    province: "",
    postalCode: "",
    references: "",
    makeDefault: false,
  })

  const [errors, setErrors] = useState<{ [key: string]: string }>({})

  useEffect(() => {
    if (!isEditing || !user?.id || !addressId) {
      setLoadingExisting(false)
      return
    }
    let cancelled = false
    ;(async () => {
      try {
        const existing = await getAddress(user.id, addressId)
        if (cancelled || !existing) {
          if (!cancelled && !existing) {
            Alert.alert('Error', 'Dirección no encontrada.', [
              { text: 'OK', onPress: () => navigation.goBack() },
            ])
          }
          return
        }
        setSelectedType(existing.type)
        setFormData({
          name: existing.name,
          recipientName: existing.recipient,
          phone: existing.phone,
          street: existing.street,
          sector: existing.sector,
          city: existing.city,
          province: existing.province,
          postalCode: existing.postalCode,
          references: existing.references,
          makeDefault: existing.isDefault,
        })
      } catch {
        if (!cancelled) {
          Alert.alert('Error', 'No se pudo cargar la dirección.', [
            { text: 'OK', onPress: () => navigation.goBack() },
          ])
        }
      } finally {
        if (!cancelled) setLoadingExisting(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [addressId, isEditing, navigation, user?.id])

  const formatPhoneNumber = (value: string) => {
    const digits = value.replace(/\D/g, "")
    
    if (digits.length === 0) return ""
    if (digits.length <= 3) return `(${digits}`
    if (digits.length <= 6) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`
    if (digits.length <= 10) return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`
    
    if (digits.startsWith("1") && digits.length === 11) {
      return `+1 (${digits.slice(1, 4)}) ${digits.slice(4, 7)}-${digits.slice(7)}`
    }
    
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6, 10)}`
  }

  const validatePhone = (phone: string) => {
    const digits = phone.replace(/\D/g, "")
    const validPrefixes = ["809", "829", "849"]

    if (digits.length === 10) {
      return validPrefixes.includes(digits.slice(0, 3))
    }
    if (digits.length === 11 && digits.startsWith("1")) {
      return validPrefixes.includes(digits.slice(1, 4))
    }
    return false
  }

  const handleInputChange = (field: string, value: string | boolean) => {
    if (field === "phone") {
      value = formatPhoneNumber(value as string)
    }

    setFormData(prev => ({ ...prev, [field]: value }))

    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: "" }))
    }
  }

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {}

    if (!formData.name.trim()) {
      newErrors.name = "El nombre de la dirección es requerido"
    }
    if (!formData.recipientName.trim()) {
      newErrors.recipientName = "El nombre del destinatario es requerido"
    }
    if (!formData.phone.trim()) {
      newErrors.phone = "El teléfono es requerido"
    } else if (!validatePhone(formData.phone)) {
      newErrors.phone = "Formato de teléfono inválido (809, 829, 849)"
    }
    if (!formData.street.trim()) {
      newErrors.street = "La dirección es requerida"
    }
    if (!formData.sector.trim()) {
      newErrors.sector = "El sector es requerido"
    }
    if (!formData.city.trim()) {
      newErrors.city = "La ciudad es requerida"
    }
    if (!formData.province) {
      newErrors.province = "La provincia es requerida"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async () => {
    if (!validateForm()) return
    if (!user?.id) {
      Alert.alert('Sesión', 'Inicia sesión para guardar una dirección.')
      return
    }

    const payload = {
      type: selectedType,
      name: formData.name,
      recipient: formData.recipientName,
      phone: formData.phone,
      street: formData.street,
      sector: formData.sector,
      city: formData.city,
      province: formData.province,
      postalCode: formData.postalCode,
      references: formData.references,
      isDefault: formData.makeDefault,
    }

    setIsSubmitting(true)
    try {
      if (isEditing && addressId) {
        await updateAddress(user.id, addressId, payload)
        Alert.alert('Éxito', 'Dirección actualizada correctamente', [
          { text: 'OK', onPress: () => navigation.goBack() },
        ])
      } else {
        await addAddress(user.id, payload)
        Alert.alert('Éxito', 'Dirección guardada correctamente', [
          { text: 'OK', onPress: () => navigation.goBack() },
        ])
      }
    } catch {
      Alert.alert('Error', 'No se pudo guardar la dirección. Inténtalo de nuevo.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const availableCities = formData.province ? citiesByProvince[formData.province] || [] : []

  const renderAddressTypeSelector = () => (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>Tipo de Dirección</Text>
      <View style={styles.typeOptions}>
        {addressTypes.map((type) => (
          <TouchableOpacity
            key={type.id}
            style={[
              styles.typeOption,
              selectedType === type.id && styles.selectedTypeOption
            ]}
            onPress={() => setSelectedType(type.id as AddressType)}
          >
            <View style={styles.typeContent}>
              {type.icon}
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={[
                  styles.typeLabel,
                  selectedType === type.id && styles.selectedTypeLabel
                ]}>
                  {type.label}
                </Text>
                <Text style={styles.typeDescription}>{type.description}</Text>
              </View>
              {selectedType === type.id && (
                <Ionicons name="checkmark" size={20} color="#059669" />
              )}
            </View>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  )

  const renderForm = () => (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>Información de la Dirección</Text>
      
      {/* Address Name */}
      <View style={styles.inputGroup}>
        <Text style={styles.label}>Nombre de la Dirección *</Text>
        <TextInput
          style={[styles.input, errors.name && styles.inputError]}
          placeholder="Ej: Casa Principal, Oficina, etc."
          value={formData.name}
          onChangeText={(value) => handleInputChange("name", value)}
        />
        {errors.name && <Text style={styles.errorText}>{errors.name}</Text>}
      </View>

      {/* Recipient Name */}
      <View style={styles.inputGroup}>
        <Text style={styles.label}>Nombre del Destinatario *</Text>
        <TextInput
          style={[styles.input, errors.recipientName && styles.inputError]}
          placeholder="Nombre completo de quien recibe"
          value={formData.recipientName}
          onChangeText={(value) => handleInputChange("recipientName", value)}
        />
        {errors.recipientName && <Text style={styles.errorText}>{errors.recipientName}</Text>}
      </View>

      {/* Phone */}
      <View style={styles.inputGroup}>
        <Text style={styles.label}>Teléfono *</Text>
        <TextInput
          style={[styles.input, errors.phone && styles.inputError]}
          placeholder="(809) 123-4567"
          value={formData.phone}
          onChangeText={(value) => handleInputChange("phone", value)}
          keyboardType="phone-pad"
        />
        {errors.phone && <Text style={styles.errorText}>{errors.phone}</Text>}
      </View>

      {/* Street Address */}
      <View style={styles.inputGroup}>
        <Text style={styles.label}>Dirección *</Text>
        <TextInput
          style={[styles.input, errors.street && styles.inputError]}
          placeholder="Calle, número, apartamento"
          value={formData.street}
          onChangeText={(value) => handleInputChange("street", value)}
        />
        {errors.street && <Text style={styles.errorText}>{errors.street}</Text>}
      </View>

      {/* Sector */}
      <View style={styles.inputGroup}>
        <Text style={styles.label}>Sector/Barrio *</Text>
        <TextInput
          style={[styles.input, errors.sector && styles.inputError]}
          placeholder="Ej: Piantini, Naco, Los Cacicazgos"
          value={formData.sector}
          onChangeText={(value) => handleInputChange("sector", value)}
        />
        {errors.sector && <Text style={styles.errorText}>{errors.sector}</Text>}
      </View>

      {/* Province and City */}
      <View style={styles.row}>
        <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
          <Text style={styles.label}>Provincia *</Text>
          <TouchableOpacity
            style={[styles.input, styles.selectorInput, errors.province && styles.inputError]}
            onPress={() => setShowProvinceSelector(true)}
          >
            <Text style={formData.province ? styles.selectorText : styles.placeholderText}>
              {formData.province || 'Selecciona provincia'}
            </Text>
            <Ionicons name="chevron-down" size={20} color="#6b7280" />
          </TouchableOpacity>
          {errors.province && <Text style={styles.errorText}>{errors.province}</Text>}
        </View>

        <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
          <Text style={styles.label}>Ciudad *</Text>
          {availableCities.length > 0 ? (
            <TouchableOpacity
              style={[styles.input, styles.selectorInput, errors.city && styles.inputError]}
              onPress={() => setShowCitySelector(true)}
            >
              <Text style={formData.city ? styles.selectorText : styles.placeholderText}>
                {formData.city || 'Selecciona ciudad'}
              </Text>
              <Ionicons name="chevron-down" size={20} color="#6b7280" />
            </TouchableOpacity>
          ) : (
            <TextInput
              style={[styles.input, errors.city && styles.inputError]}
              placeholder="Nombre de la ciudad"
              value={formData.city}
              onChangeText={(value) => handleInputChange("city", value)}
            />
          )}
          {errors.city && <Text style={styles.errorText}>{errors.city}</Text>}
        </View>
      </View>

      {/* Postal Code */}
      <View style={styles.inputGroup}>
        <Text style={styles.label}>Código Postal</Text>
        <TextInput
          style={styles.input}
          placeholder="Ej: 10101"
          value={formData.postalCode}
          onChangeText={(value) => handleInputChange("postalCode", value)}
          keyboardType="numeric"
        />
      </View>

      {/* References */}
      <View style={styles.inputGroup}>
        <Text style={styles.label}>Referencias</Text>
        <TextInput
          style={[styles.input, styles.textarea]}
          placeholder="Puntos de referencia para facilitar la entrega"
          value={formData.references}
          onChangeText={(value) => handleInputChange("references", value)}
          multiline
          numberOfLines={3}
          textAlignVertical="top"
        />
      </View>

      {/* Make Default */}
      <TouchableOpacity 
        style={styles.checkboxOption}
        onPress={() => handleInputChange("makeDefault", !formData.makeDefault)}
      >
        <View style={[styles.checkbox, formData.makeDefault && styles.checkboxChecked]}>
          {formData.makeDefault && <Ionicons name="checkmark" size={16} color="#fff" />}
        </View>
        <Text style={styles.checkboxText}>Establecer como dirección predeterminada</Text>
      </TouchableOpacity>

      {/* Submit Button */}
      <TouchableOpacity 
        style={[styles.submitButton, isSubmitting && styles.submitButtonDisabled]}
        onPress={handleSubmit}
        disabled={isSubmitting}
      >
        <Text style={styles.submitButtonText}>
          {isSubmitting ? "Guardando..." : "Guardar Dirección"}
        </Text>
      </TouchableOpacity>
    </View>
  )

  const renderDeliveryInfo = () => (
    <View style={styles.infoCard}>
      <View style={styles.infoContent}>
        <Ionicons name="alert-circle" size={20} color="#059669" />
        <View style={{ flex: 1, marginLeft: 12 }}>
          <Text style={styles.infoTitle}>Información de entrega</Text>
          <Text style={styles.infoText}>
            Las entregas se realizan de lunes a viernes de 8:00 AM a 6:00 PM, y
            sábados de 8:00 AM a 2:00 PM. Asegúrate de que alguien esté disponible para recibir el paquete.
          </Text>
        </View>
      </View>
    </View>
  )

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerBtn}>
          <Ionicons name="arrow-back" size={24} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{isEditing ? 'Editar Dirección' : 'Agregar Dirección'}</Text>
      </View>

      {loadingExisting ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="large" color="#059669" />
        </View>
      ) : (
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 32 }}>
        {renderAddressTypeSelector()}
        {renderForm()}
        {renderDeliveryInfo()}
      </ScrollView>
      )}

      {/* Province Selector Modal */}
      {showProvinceSelector && (
        <View style={styles.modalOverlay}>
          <View style={styles.modal}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Seleccionar Provincia</Text>
              <TouchableOpacity onPress={() => setShowProvinceSelector(false)}>
                <Ionicons name="close" size={24} color="#6b7280" />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalContent}>
              {provinces.map((province) => (
                <TouchableOpacity
                  key={province}
                  style={styles.modalOption}
                  onPress={() => {
                    handleInputChange("province", province)
                    handleInputChange("city", "") // Reset city when province changes
                    setShowProvinceSelector(false)
                  }}
                >
                  <Text style={styles.modalOptionText}>{province}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      )}

      {/* City Selector Modal */}
      {showCitySelector && (
        <View style={styles.modalOverlay}>
          <View style={styles.modal}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Seleccionar Ciudad</Text>
              <TouchableOpacity onPress={() => setShowCitySelector(false)}>
                <Ionicons name="close" size={24} color="#6b7280" />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalContent}>
              {availableCities.map((city) => (
                <TouchableOpacity
                  key={city}
                  style={styles.modalOption}
                  onPress={() => {
                    handleInputChange("city", city)
                    setShowCitySelector(false)
                  }}
                >
                  <Text style={styles.modalOptionText}>{city}</Text>
                </TouchableOpacity>
              ))}
              <TouchableOpacity
                style={styles.modalOption}
                onPress={() => {
                  handleInputChange("city", "Otra ciudad")
                  setShowCitySelector(false)
                }}
              >
                <Text style={styles.modalOptionText}>Otra ciudad</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      )}
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  headerBtn: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: '#f3f4f6',
    marginRight: 8,
  },
  loadingWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
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
  cardTitle: {
    fontWeight: 'bold',
    fontSize: 17,
    color: '#111827',
    marginBottom: 16,
  },
  typeOptions: {
    gap: 12,
  },
  typeOption: {
    borderWidth: 2,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    padding: 16,
  },
  selectedTypeOption: {
    borderColor: '#059669',
    backgroundColor: '#f0fdf4',
  },
  typeContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  typeLabel: {
    fontWeight: 'bold',
    fontSize: 15,
    color: '#111827',
  },
  selectedTypeLabel: {
    color: '#065f46',
  },
  typeDescription: {
    fontSize: 13,
    color: '#6b7280',
    marginTop: 2,
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
  textarea: {
    height: 80,
    textAlignVertical: 'top',
  },
  errorText: {
    color: '#ef4444',
    fontSize: 12,
    marginTop: 4,
  },
  row: {
    flexDirection: 'row',
  },
  checkboxOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
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
  submitButton: {
    backgroundColor: '#059669',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  submitButtonDisabled: {
    backgroundColor: '#9ca3af',
  },
  submitButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  infoCard: {
    backgroundColor: '#f0fdf4',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#bbf7d0',
  },
  infoContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  infoTitle: {
    fontWeight: 'bold',
    fontSize: 15,
    color: '#065f46',
    marginBottom: 4,
  },
  infoText: {
    fontSize: 13,
    color: '#047857',
    lineHeight: 18,
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
  },
}) 