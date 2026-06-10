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
  Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../../App';

type ContactSupportScreenNavigationProp = StackNavigationProp<RootStackParamList, 'ContactSupport'>;

interface ContactSupportScreenProps {
  navigation: ContactSupportScreenNavigationProp;
}

export const ContactSupportScreen: React.FC<ContactSupportScreenProps> = ({ navigation }) => {
  const [formData, setFormData] = useState({
    nombre: '',
    email: '',
    categoria: '',
    prioridad: '',
    asunto: '',
    mensaje: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const categories = [
    { id: 'compra', title: 'Problema con Compra', icon: 'bag-outline' },
    { id: 'venta', title: 'Problema con Venta', icon: 'star-outline' },
    { id: 'pago', title: 'Pagos y Wallet', icon: 'card-outline' },
    { id: 'cuenta', title: 'Mi Cuenta', icon: 'person-outline' },
    { id: 'tecnico', title: 'Problema Técnico', icon: 'bug-outline' },
    { id: 'otro', title: 'Otro', icon: 'help-circle-outline' },
  ];

  const priorities = [
    { id: 'baja', title: 'Baja (7 días)', color: '#059669' },
    { id: 'normal', title: 'Normal (2-3 días)', color: '#2563EB' },
    { id: 'alta', title: 'Alta (24 horas)', color: '#DC2626' },
    { id: 'urgente', title: 'Urgente (2-4 horas)', color: '#DC2626' },
  ];

  const handleCallSupport = () => {
    Linking.openURL('tel:+18095551234');
  };

  const handleEmailSupport = () => {
            Linking.openURL('mailto:ayuda@ropanova.com');
  };

  const handleChatSupport = () => {
    Alert.alert(
      'Chat en Vivo',
      '¿Deseas iniciar un chat en vivo con nuestro equipo de soporte?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Iniciar Chat', onPress: () => Alert.alert('Chat', 'Conectando con soporte...') },
      ]
    );
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    if (!formData.nombre.trim() || !formData.email.trim() || !formData.categoria || 
        !formData.prioridad || !formData.asunto.trim() || !formData.mensaje.trim()) {
      Alert.alert('Error', 'Por favor completa todos los campos');
      return;
    }

    setIsSubmitting(true);

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 2000));

    setIsSubmitting(false);
    setIsSubmitted(true);
  };

  if (isSubmitted) {
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
          <Text style={styles.headerTitle}>Contactar Soporte</Text>
        </View>

        {/* Success Message */}
        <View style={styles.content}>
          <View style={styles.successCard}>
            <View style={styles.successContent}>
              <Ionicons name="checkmark-circle" size={64} color="#059669" style={styles.successIcon} />
              <Text style={styles.successTitle}>¡Mensaje Enviado!</Text>
              <Text style={styles.successSubtitle}>
                Hemos recibido tu solicitud de soporte. Te contactaremos pronto.
              </Text>
              
              <View style={styles.ticketCard}>
                <Text style={styles.ticketLabel}>Número de ticket:</Text>
                <Text style={styles.ticketNumber}>#VRD-{Date.now().toString().slice(-6)}</Text>
              </View>
              
              <View style={styles.successInfo}>
                <Text style={styles.successInfoText}>• Recibirás una confirmación por email</Text>
                <Text style={styles.successInfoText}>• Tiempo de respuesta estimado: 2-24 horas</Text>
                <Text style={styles.successInfoText}>• Puedes seguir el estado en tu perfil</Text>
              </View>
              
              <View style={styles.successButtons}>
                <TouchableOpacity
                  style={styles.successButtonSecondary}
                  onPress={() => navigation.navigate('HelpCenter')}
                >
                  <Text style={styles.successButtonSecondaryText}>Volver a Ayuda</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.successButtonPrimary}
                  onPress={() => navigation.navigate('MainTabs')}
                >
                  <Text style={styles.successButtonPrimaryText}>Ir a Mi Perfil</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
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
        <Text style={styles.headerTitle}>Contactar Soporte</Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Contact Methods */}
        <View style={styles.contactMethodsContainer}>
          <View style={styles.chatCard}>
            <View style={styles.chatHeader}>
              <Ionicons name="chatbubble-outline" size={24} color="#2563EB" />
              <View style={styles.chatInfo}>
                <Text style={styles.chatTitle}>Chat en Vivo</Text>
                <View style={styles.onlineBadge}>
                  <Text style={styles.onlineBadgeText}>En línea</Text>
                </View>
              </View>
            </View>
            <Text style={styles.chatDescription}>
              Respuesta inmediata con nuestro equipo
            </Text>
            <TouchableOpacity style={styles.chatButton} onPress={handleChatSupport}>
              <Text style={styles.chatButtonText}>Iniciar Chat</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.contactGrid}>
            <View style={styles.contactCard}>
              <Ionicons name="call-outline" size={32} color="#059669" style={styles.contactIcon} />
              <Text style={styles.contactCardTitle}>Llamar</Text>
              <Text style={styles.contactCardSubtitle}>+1 (809) 555-1234</Text>
              <View style={styles.contactTime}>
                <Ionicons name="time-outline" size={12} color="#059669" />
                <Text style={styles.contactTimeText}>9AM-6PM</Text>
              </View>
            </View>

            <View style={styles.contactCard}>
              <Ionicons name="mail-outline" size={32} color="#7C3AED" style={styles.contactIcon} />
              <Text style={styles.contactCardTitle}>Email</Text>
              <Text style={styles.contactCardSubtitle}>ayuda@ropanova.com</Text>
              <View style={styles.contactTime}>
                <Ionicons name="time-outline" size={12} color="#6B7280" />
                <Text style={styles.contactTimeText}>24h respuesta</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Contact Form */}
        <View style={styles.card}>
          <View style={styles.formHeader}>
            <Ionicons name="send" size={20} color="#2563EB" />
            <Text style={styles.formTitle}>Enviar Mensaje</Text>
          </View>
          
          <View style={styles.formGrid}>
            <View style={styles.formField}>
              <Text style={styles.inputLabel}>Nombre Completo</Text>
              <TextInput
                style={styles.textInput}
                placeholder="Tu nombre"
                value={formData.nombre}
                onChangeText={(value) => handleInputChange('nombre', value)}
                placeholderTextColor="#9CA3AF"
              />
            </View>
            
            <View style={styles.formField}>
              <Text style={styles.inputLabel}>Email</Text>
              <TextInput
                style={styles.textInput}
                placeholder="tu@email.com"
                value={formData.email}
                onChangeText={(value) => handleInputChange('email', value)}
                keyboardType="email-address"
                placeholderTextColor="#9CA3AF"
              />
            </View>
          </View>

          <View style={styles.formGrid}>
            <View style={styles.formField}>
              <Text style={styles.inputLabel}>Categoría</Text>
              <View style={styles.selectContainer}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <View style={styles.selectOptions}>
                    {categories.map((category) => (
                      <TouchableOpacity
                        key={category.id}
                        style={[
                          styles.selectOption,
                          formData.categoria === category.id && styles.selectOptionSelected,
                        ]}
                        onPress={() => handleInputChange('categoria', category.id)}
                      >
                        <Ionicons
                          name={category.icon as any}
                          size={16}
                          color={formData.categoria === category.id ? '#2563EB' : '#6B7280'}
                        />
                        <Text style={[
                          styles.selectOptionText,
                          formData.categoria === category.id && styles.selectOptionTextSelected,
                        ]}>
                          {category.title}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </ScrollView>
              </View>
            </View>
            
            <View style={styles.formField}>
              <Text style={styles.inputLabel}>Prioridad</Text>
              <View style={styles.selectContainer}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <View style={styles.selectOptions}>
                    {priorities.map((priority) => (
                      <TouchableOpacity
                        key={priority.id}
                        style={[
                          styles.selectOption,
                          formData.prioridad === priority.id && styles.selectOptionSelected,
                        ]}
                        onPress={() => handleInputChange('prioridad', priority.id)}
                      >
                        <Text style={[
                          styles.selectOptionText,
                          formData.prioridad === priority.id && styles.selectOptionTextSelected,
                        ]}>
                          {priority.title}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </ScrollView>
              </View>
            </View>
          </View>

          <View style={styles.formField}>
            <Text style={styles.inputLabel}>Asunto</Text>
            <TextInput
              style={styles.textInput}
              placeholder="Describe brevemente tu problema"
              value={formData.asunto}
              onChangeText={(value) => handleInputChange('asunto', value)}
              placeholderTextColor="#9CA3AF"
            />
          </View>

          <View style={styles.formField}>
            <Text style={styles.inputLabel}>Mensaje Detallado</Text>
            <TextInput
              style={[styles.textInput, styles.messageInput]}
              placeholder="Describe tu problema con el mayor detalle posible..."
              value={formData.mensaje}
              onChangeText={(value) => handleInputChange('mensaje', value)}
              placeholderTextColor="#9CA3AF"
              multiline
              numberOfLines={5}
              textAlignVertical="top"
            />
          </View>

          {/* Response Time Info */}
          <View style={styles.responseTimeInfo}>
            <View style={styles.responseTimeHeader}>
              <Ionicons name="alert-circle-outline" size={16} color="#2563EB" />
              <Text style={styles.responseTimeTitle}>Tiempos de Respuesta:</Text>
            </View>
            <View style={styles.responseTimeList}>
              <Text style={styles.responseTimeItem}>
                • <Text style={styles.responseTimeBold}>Urgente:</Text> 2-4 horas (solo emergencias)
              </Text>
              <Text style={styles.responseTimeItem}>
                • <Text style={styles.responseTimeBold}>Alta:</Text> 24 horas (problemas importantes)
              </Text>
              <Text style={styles.responseTimeItem}>
                • <Text style={styles.responseTimeBold}>Normal:</Text> 2-3 días (consultas generales)
              </Text>
              <Text style={styles.responseTimeItem}>
                • <Text style={styles.responseTimeBold}>Baja:</Text> 7 días (sugerencias)
              </Text>
            </View>
          </View>

          {/* Submit Button */}
          <TouchableOpacity
            style={[
              styles.submitButton,
              (!formData.nombre.trim() || !formData.email.trim() || !formData.categoria || 
               !formData.prioridad || !formData.asunto.trim() || !formData.mensaje.trim() || isSubmitting) && styles.submitButtonDisabled,
            ]}
            onPress={handleSubmit}
            disabled={!formData.nombre.trim() || !formData.email.trim() || !formData.categoria || 
                     !formData.prioridad || !formData.asunto.trim() || !formData.mensaje.trim() || isSubmitting}
          >
            {isSubmitting ? (
              <View style={styles.submitButtonLoading}>
                <View style={styles.spinner} />
                <Text style={styles.submitButtonText}>Enviando...</Text>
              </View>
            ) : (
              <View style={styles.submitButtonContent}>
                <Ionicons name="send" size={16} color="#FFFFFF" />
                <Text style={styles.submitButtonText}>Enviar Mensaje</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* FAQ Quick Links */}
        <View style={styles.card}>
          <Text style={styles.faqTitle}>Antes de contactarnos, revisa:</Text>
          <View style={styles.faqLinks}>
            <TouchableOpacity style={styles.faqLink}>
              <Text style={styles.faqLinkText}>→ Preguntas Frecuentes (FAQ)</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.faqLink}>
              <Text style={styles.faqLinkText}>→ Guías de Compra y Venta</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.faqLink}>
              <Text style={styles.faqLinkText}>→ Información de Pagos</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.bottomSpacing} />
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
    fontSize: 20,
    fontWeight: '600',
    color: '#111827',
    marginLeft: 12,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  // Success screen styles
  successCard: {
    backgroundColor: '#F0FDF4',
    borderRadius: 12,
    padding: 24,
    marginTop: 20,
    borderWidth: 1,
    borderColor: '#D1FAE5',
  },
  successContent: {
    alignItems: 'center',
  },
  successIcon: {
    marginBottom: 16,
  },
  successTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: '#065F46',
    marginBottom: 8,
    textAlign: 'center',
  },
  successSubtitle: {
    fontSize: 16,
    color: '#047857',
    marginBottom: 24,
    textAlign: 'center',
    lineHeight: 22,
  },
  ticketCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    width: '100%',
  },
  ticketLabel: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 4,
  },
  ticketNumber: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    fontFamily: 'monospace',
  },
  successInfo: {
    marginBottom: 24,
  },
  successInfoText: {
    fontSize: 14,
    color: '#047857',
    lineHeight: 20,
    marginBottom: 4,
  },
  successButtons: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  successButtonSecondary: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  successButtonSecondaryText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#374151',
  },
  successButtonPrimary: {
    flex: 1,
    backgroundColor: '#2563EB',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
  },
  successButtonPrimaryText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  // Contact methods styles
  contactMethodsContainer: {
    gap: 16,
  },
  chatCard: {
    backgroundColor: '#EFF6FF',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#DBEAFE',
  },
  chatHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  chatInfo: {
    marginLeft: 12,
    flex: 1,
  },
  chatTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1E40AF',
    marginBottom: 4,
  },
  onlineBadge: {
    backgroundColor: '#D1FAE5',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    alignSelf: 'flex-start',
  },
  onlineBadgeText: {
    fontSize: 10,
    color: '#065F46',
    fontWeight: '500',
  },
  chatDescription: {
    fontSize: 14,
    color: '#1E40AF',
    marginBottom: 16,
  },
  chatButton: {
    backgroundColor: '#2563EB',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
  },
  chatButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  contactGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  contactCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  contactIcon: {
    marginBottom: 8,
  },
  contactCardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  contactCardSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 8,
  },
  contactTime: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  contactTimeText: {
    fontSize: 12,
    color: '#6B7280',
  },
  // Form styles
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  formHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  formTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginLeft: 8,
  },
  formGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  formField: {
    flex: 1,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 8,
  },
  selectContainer: {
    marginBottom: 8,
  },
  selectOptions: {
    flexDirection: 'row',
    gap: 8,
  },
  selectOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
    gap: 6,
  },
  selectOptionSelected: {
    borderColor: '#2563EB',
    backgroundColor: '#EFF6FF',
  },
  selectOptionText: {
    fontSize: 12,
    color: '#6B7280',
  },
  selectOptionTextSelected: {
    color: '#2563EB',
    fontWeight: '500',
  },
  textInput: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    color: '#111827',
  },
  messageInput: {
    height: 100,
    paddingTop: 12,
  },
  // Response time info styles
  responseTimeInfo: {
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    padding: 12,
    marginTop: 16,
  },
  responseTimeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  responseTimeTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#111827',
    marginLeft: 6,
  },
  responseTimeList: {
    gap: 4,
  },
  responseTimeItem: {
    fontSize: 12,
    color: '#6B7280',
    lineHeight: 16,
  },
  responseTimeBold: {
    fontWeight: '600',
  },
  // Submit button styles
  submitButton: {
    backgroundColor: '#2563EB',
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 20,
  },
  submitButtonDisabled: {
    backgroundColor: '#D1D5DB',
  },
  submitButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  submitButtonLoading: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  spinner: {
    width: 16,
    height: 16,
    borderWidth: 2,
    borderColor: '#FFFFFF',
    borderTopColor: 'transparent',
    borderRadius: 8,
  },
  // FAQ links styles
  faqTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 12,
  },
  faqLinks: {
    gap: 8,
  },
  faqLink: {
    paddingVertical: 4,
  },
  faqLinkText: {
    fontSize: 14,
    color: '#2563EB',
  },
  bottomSpacing: {
    height: 32,
  },
}); 