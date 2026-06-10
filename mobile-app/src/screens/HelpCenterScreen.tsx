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

type HelpCenterScreenNavigationProp = StackNavigationProp<RootStackParamList, 'HelpCenter'>;

interface HelpCenterScreenProps {
  navigation: HelpCenterScreenNavigationProp;
}

interface FAQItem {
  id: string;
  question: string;
  answer: string;
  category: string;
}

interface HelpCategory {
  id: string;
  title: string;
  icon: keyof typeof Ionicons.glyphMap;
  description: string;
  articles: number;
}

const faqData: FAQItem[] = [
  {
    id: "1",
            question: "¿Cómo puedo vender mi ropa en RopaNova?",
    answer:
      'Para vender tu ropa, ve a la sección "Vender", toma fotos de tu artículo, completa la información del producto incluyendo talla, color, condición y precio. Una vez publicado, los compradores podrán contactarte.',
    category: "vender",
  },
  {
    id: "2",
    question: "¿Cuáles son las formas de pago disponibles?",
    answer:
              "Aceptamos tarjetas de crédito/débito, transferencias bancarias, y pagos móviles. También puedes usar tu RopaNova Wallet para transacciones más rápidas.",
    category: "pagos",
  },
  {
    id: "3",
    question: "¿Cómo funciona el envío en República Dominicana?",
    answer:
      "Trabajamos con servicios de mensajería locales. El costo de envío se calcula según la distancia y peso. Puedes coordinar entrega en persona en Santo Domingo y Santiago.",
    category: "envios",
  },
  {
    id: "4",
    question: "¿Qué hago si tengo un problema con mi compra?",
    answer:
      "Puedes contactar al vendedor directamente a través de mensajes. Si no se resuelve, nuestro equipo de soporte te ayudará. Tienes 48 horas para reportar problemas.",
    category: "comprar",
  },
  {
    id: "5",
    question: "¿Cómo puedo verificar mi cuenta?",
    answer:
      "Ve a Configuración > Verificación de Cuenta. Necesitarás subir una foto de tu cédula y una selfie. La verificación toma 24-48 horas.",
    category: "cuenta",
  },
  {
    id: "6",
    question: "¿Puedo devolver un artículo?",
    answer:
      "Las devoluciones dependen de la política del vendedor. Revisa la descripción del producto antes de comprar. Para artículos con problemas no descritos, contacta soporte.",
    category: "comprar",
  },
  {
    id: "7",
    question: "¿Cómo retiro dinero de mi RopaNova Wallet?",
    answer:
      'Ve a tu Wallet, selecciona "Retirar", elige tu banco (Popular, Reservas, BHD León), ingresa los datos de tu cuenta y confirma. El proceso toma 1-3 días hábiles.',
    category: "pagos",
  },
  {
    id: "8",
    question: "¿Qué medidas de seguridad tienen?",
    answer:
      "Verificamos cuentas, moderamos publicaciones, ofrecemos sistema de reseñas, y protegemos pagos. Nunca compartas información personal fuera de la app.",
    category: "seguridad",
  },
];

const helpCategories: HelpCategory[] = [
  {
    id: "comprar",
    title: "Comprar",
    icon: "bag-outline",
    description: "Todo sobre cómo comprar artículos",
    articles: 12,
  },
  {
    id: "vender",
    title: "Vender",
    icon: "star-outline",
    description: "Guías para vender tu ropa",
    articles: 15,
  },
  {
    id: "pagos",
    title: "Pagos y Wallet",
    icon: "card-outline",
    description: "Información sobre pagos y retiros",
    articles: 8,
  },
  {
    id: "envios",
    title: "Envíos",
    icon: "cube-outline",
    description: "Todo sobre entregas y envíos",
    articles: 6,
  },
  {
    id: "cuenta",
    title: "Mi Cuenta",
    icon: "person-outline",
    description: "Configuración y verificación",
    articles: 10,
  },
  {
    id: "seguridad",
    title: "Seguridad",
    icon: "shield-outline",
    description: "Consejos de seguridad y privacidad",
    articles: 7,
  },
];

export const HelpCenterScreen: React.FC<HelpCenterScreenProps> = ({ navigation }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [expandedFAQ, setExpandedFAQ] = useState<string | null>(null);

  const filteredFAQs = faqData.filter((faq) => {
    const matchesSearch =
      faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      faq.answer.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = !selectedCategory || faq.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

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

  const renderCategoryButton = (category: HelpCategory) => {
    const isSelected = selectedCategory === category.id;
    return (
      <TouchableOpacity
        key={category.id}
        style={[
          styles.categoryButton,
          isSelected && styles.categoryButtonSelected,
        ]}
        onPress={() => setSelectedCategory(isSelected ? null : category.id)}
      >
        <Ionicons
          name={category.icon}
          size={24}
          color={isSelected ? '#2563EB' : '#6B7280'}
          style={styles.categoryIcon}
        />
        <Text style={[
          styles.categoryTitle,
          isSelected && styles.categoryTitleSelected,
        ]}>
          {category.title}
        </Text>
        <Text style={styles.categoryArticles}>{category.articles} artículos</Text>
      </TouchableOpacity>
    );
  };

  const renderFAQItem = (faq: FAQItem) => {
    const isExpanded = expandedFAQ === faq.id;
    return (
      <View key={faq.id} style={styles.faqItem}>
        <TouchableOpacity
          style={styles.faqQuestion}
          onPress={() => setExpandedFAQ(isExpanded ? null : faq.id)}
        >
          <Text style={styles.faqQuestionText} numberOfLines={isExpanded ? undefined : 2}>
            {faq.question}
          </Text>
          <Ionicons
            name={isExpanded ? 'chevron-up' : 'chevron-down'}
            size={20}
            color="#9CA3AF"
          />
        </TouchableOpacity>
        {isExpanded && (
          <View style={styles.faqAnswer}>
            <Text style={styles.faqAnswerText}>{faq.answer}</Text>
          </View>
        )}
      </View>
    );
  };

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
        <Text style={styles.headerTitle}>Centro de Ayuda</Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color="#9CA3AF" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Buscar en el centro de ayuda..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor="#9CA3AF"
          />
        </View>

        {/* Quick Actions */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>¿Necesitas ayuda inmediata?</Text>
          
          <TouchableOpacity 
            style={styles.quickActionItem} 
            onPress={() => navigation.navigate('ContactSupport')}
          >
            <Ionicons name="chatbubble-outline" size={20} color="#2563EB" />
            <View style={styles.quickActionContent}>
              <Text style={styles.quickActionTitle}>Chat en Vivo</Text>
              <Text style={styles.quickActionSubtitle}>Respuesta inmediata</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.quickActionItem} onPress={handleCallSupport}>
            <Ionicons name="call-outline" size={20} color="#059669" />
            <View style={styles.quickActionContent}>
              <Text style={styles.quickActionTitle}>Llamar Soporte</Text>
              <Text style={styles.quickActionSubtitle}>Lun-Vie 9AM-6PM</Text>
            </View>
            <Ionicons name="open-outline" size={20} color="#9CA3AF" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.quickActionItem} onPress={handleEmailSupport}>
            <Ionicons name="mail-outline" size={20} color="#7C3AED" />
            <View style={styles.quickActionContent}>
              <Text style={styles.quickActionTitle}>Enviar Email</Text>
              <Text style={styles.quickActionSubtitle}>Respuesta en 24h</Text>
            </View>
            <Ionicons name="open-outline" size={20} color="#9CA3AF" />
          </TouchableOpacity>
        </View>

        {/* Help Categories */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Categorías de Ayuda</Text>
          <View style={styles.categoriesGrid}>
            {helpCategories.map(renderCategoryButton)}
          </View>
        </View>

        {/* FAQ Section */}
        <View style={styles.card}>
          <View style={styles.faqHeader}>
            <Text style={styles.cardTitle}>Preguntas Frecuentes</Text>
            {selectedCategory && (
              <TouchableOpacity onPress={() => setSelectedCategory(null)}>
                <Text style={styles.viewAllButton}>Ver todas</Text>
              </TouchableOpacity>
            )}
          </View>

          {filteredFAQs.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="alert-circle-outline" size={48} color="#9CA3AF" />
              <Text style={styles.emptyStateTitle}>No se encontraron resultados</Text>
              <Text style={styles.emptyStateSubtitle}>
                Intenta con otros términos de búsqueda
              </Text>
            </View>
          ) : (
            <View style={styles.faqList}>
              {filteredFAQs.map(renderFAQItem)}
            </View>
          )}
        </View>

        {/* Safety Tips */}
        <View style={styles.safetyCard}>
          <View style={styles.safetyHeader}>
            <Ionicons name="shield-outline" size={24} color="#2563EB" />
            <Text style={styles.safetyTitle}>Consejos de Seguridad</Text>
          </View>
          <View style={styles.safetyList}>
            <Text style={styles.safetyItem}>• Nunca compartas información personal fuera de la app</Text>
            <Text style={styles.safetyItem}>• Prefiere entregas en lugares públicos y seguros</Text>
            <Text style={styles.safetyItem}>• Verifica la identidad del vendedor antes de comprar</Text>
            <Text style={styles.safetyItem}>• Usa el sistema de pagos de RopaNova para mayor protección</Text>
          </View>
          <TouchableOpacity style={styles.safetyLink}>
            <Text style={styles.safetyLinkText}>Ver más consejos</Text>
            <Ionicons name="open-outline" size={16} color="#2563EB" />
          </TouchableOpacity>
        </View>

        {/* Contact Info */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Información de Contacto</Text>
          <View style={styles.contactList}>
            <View style={styles.contactItem}>
              <Ionicons name="call-outline" size={16} color="#9CA3AF" />
              <Text style={styles.contactText}>+1 (809) 555-1234</Text>
            </View>
            <View style={styles.contactItem}>
              <Ionicons name="mail-outline" size={16} color="#9CA3AF" />
              <Text style={styles.contactText}>ayuda@ropanova.com</Text>
            </View>
            <View style={styles.contactItem}>
              <Ionicons name="chatbubble-outline" size={16} color="#9CA3AF" />
              <View style={styles.contactInfo}>
                <Text style={styles.contactText}>Chat en vivo disponible:</Text>
                <Text style={styles.contactSubtext}>Lunes a Viernes 9:00 AM - 6:00 PM</Text>
              </View>
            </View>
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
  searchContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  searchIcon: {
    position: 'absolute',
    left: 12,
    top: '50%',
    transform: [{ translateY: -10 }],
    zIndex: 1,
  },
  searchInput: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 40,
    paddingVertical: 12,
    fontSize: 16,
    color: '#111827',
  },
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
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 16,
  },
  quickActionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginBottom: 8,
  },
  quickActionContent: {
    flex: 1,
    marginLeft: 12,
  },
  quickActionTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#111827',
  },
  quickActionSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 2,
  },
  categoriesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  categoryButton: {
    width: '48%',
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
  },
  categoryButtonSelected: {
    borderColor: '#2563EB',
    backgroundColor: '#EFF6FF',
  },
  categoryIcon: {
    marginBottom: 8,
  },
  categoryTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#111827',
    marginBottom: 4,
  },
  categoryTitleSelected: {
    color: '#2563EB',
  },
  categoryArticles: {
    fontSize: 12,
    color: '#6B7280',
  },
  faqHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  viewAllButton: {
    fontSize: 14,
    color: '#2563EB',
    fontWeight: '500',
  },
  faqList: {
    gap: 8,
  },
  faqItem: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    overflow: 'hidden',
  },
  faqQuestion: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: '#FFFFFF',
  },
  faqQuestionText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
    color: '#111827',
    marginRight: 12,
  },
  faqAnswer: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    backgroundColor: '#FFFFFF',
  },
  faqAnswerText: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  emptyStateTitle: {
    fontSize: 16,
    color: '#6B7280',
    marginTop: 12,
    marginBottom: 4,
  },
  emptyStateSubtitle: {
    fontSize: 14,
    color: '#9CA3AF',
  },
  safetyCard: {
    backgroundColor: '#EFF6FF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#DBEAFE',
  },
  safetyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  safetyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginLeft: 8,
  },
  safetyList: {
    marginBottom: 12,
  },
  safetyItem: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
    marginBottom: 4,
  },
  safetyLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  safetyLinkText: {
    fontSize: 14,
    color: '#2563EB',
    fontWeight: '500',
  },
  contactList: {
    gap: 12,
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  contactText: {
    fontSize: 14,
    color: '#6B7280',
  },
  contactInfo: {
    flex: 1,
  },
  contactSubtext: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 2,
  },
  bottomSpacing: {
    height: 32,
  },
}); 