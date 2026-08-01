import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../../App';

type TermsScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Terms'>;

interface TermsScreenProps {
  navigation: TermsScreenNavigationProp;
}

export const TermsScreen: React.FC<TermsScreenProps> = ({ navigation }) => {
  const renderSection = (number: number, title: string, content: React.ReactNode) => (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <View style={styles.sectionNumber}>
          <Text style={styles.sectionNumberText}>{number}</Text>
        </View>
        <Text style={styles.sectionTitle}>{title}</Text>
      </View>
      <View style={styles.sectionContent}>
        {content}
      </View>
    </View>
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
        <Text style={styles.headerTitle}>Términos y Condiciones</Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Document Info Card */}
        <View style={styles.infoCard}>
          <View style={styles.infoHeader}>
            <Ionicons name="document-text-outline" size={24} color="#2563EB" />
            <View style={styles.infoContent}>
              <Text style={styles.infoTitle}>Términos y Condiciones de RopaNova</Text>
              <View style={styles.infoMeta}>
                <View style={styles.infoMetaItem}>
                  <Ionicons name="calendar-outline" size={16} color="#6B7280" />
                  <Text style={styles.infoMetaText}>Última actualización: 10 de enero, 2025</Text>
                </View>
                <View style={styles.infoMetaItem}>
                  <Ionicons name="shield-outline" size={16} color="#6B7280" />
                  <Text style={styles.infoMetaText}>Versión 2.1</Text>
                </View>
              </View>
            </View>
          </View>
          
          <View style={styles.importantNotice}>
            <View style={styles.noticeHeader}>
              <Ionicons name="alert-circle-outline" size={16} color="#2563EB" />
              <Text style={styles.noticeTitle}>Información Importante</Text>
            </View>
            <Text style={styles.noticeText}>
              Al usar RopaNova, aceptas estos términos y condiciones. Te recomendamos leerlos completamente.
            </Text>
          </View>
        </View>

        {/* Terms Content */}
        <View style={styles.termsCard}>
          {renderSection(1, 'Definiciones y Alcance', (
            <View style={styles.textContent}>
              <Text style={styles.paragraph}>
                <Text style={styles.bold}>RopaNova</Text> es una plataforma digital que conecta compradores y vendedores de ropa y
                accesorios de segunda mano en República Dominicana.
              </Text>
              <Text style={styles.paragraph}>
                <Text style={styles.bold}>Usuario:</Text> Cualquier persona que accede y utiliza los servicios de RopaNova.
              </Text>
              <Text style={styles.paragraph}>
                <Text style={styles.bold}>Vendedor:</Text> Usuario que ofrece productos para la venta en la plataforma.
              </Text>
              <Text style={styles.paragraph}>
                <Text style={styles.bold}>Comprador:</Text> Usuario que adquiere productos a través de la plataforma.
              </Text>
              <Text style={styles.paragraph}>
                Estos términos se aplican a todos los usuarios de RopaNova en territorio dominicano.
              </Text>
            </View>
          ))}

          {renderSection(2, 'Registro y Cuenta de Usuario', (
            <View style={styles.textContent}>
              <Text style={styles.paragraph}>Para usar RopaNova debes:</Text>
              <View style={styles.list}>
                <Text style={styles.listItem}>• Ser mayor de 18 años o tener autorización de un tutor legal</Text>
                <Text style={styles.listItem}>• Proporcionar información veraz y actualizada</Text>
                <Text style={styles.listItem}>• Verificar tu identidad con cédula dominicana válida</Text>
                <Text style={styles.listItem}>• Mantener la confidencialidad de tu contraseña</Text>
              </View>
              <Text style={styles.paragraph}>
                Eres responsable de todas las actividades realizadas desde tu cuenta.
              </Text>
            </View>
          ))}

          {renderSection(3, 'Compra y Venta de Productos', (
            <View style={styles.textContent}>
              <Text style={styles.paragraph}>
                <Text style={styles.bold}>Vendedores deben:</Text>
              </Text>
              <View style={styles.list}>
                <Text style={styles.listItem}>• Describir productos de manera precisa y honesta</Text>
                <Text style={styles.listItem}>• Publicar fotos reales y actuales del producto</Text>
                <Text style={styles.listItem}>• Especificar el estado y condición del artículo</Text>
                <Text style={styles.listItem}>• Cumplir con los tiempos de envío acordados</Text>
              </View>
              <Text style={styles.paragraph}>
                <Text style={styles.bold}>Compradores deben:</Text>
              </Text>
              <View style={styles.list}>
                <Text style={styles.listItem}>• Revisar cuidadosamente la descripción del producto</Text>
                <Text style={styles.listItem}>• Comunicarse con el vendedor para aclarar dudas</Text>
                <Text style={styles.listItem}>• Completar el pago según los métodos disponibles</Text>
              </View>
            </View>
          ))}

          {renderSection(4, 'Pagos y Comisiones', (
            <View style={styles.textContent}>
              <Text style={styles.paragraph}>RopaNova acepta los siguientes métodos de pago:</Text>
              <View style={styles.list}>
                <Text style={styles.listItem}>• Tarjetas de crédito y débito (cuando estén activas en la app, solo vía proveedor de pago certificado; no se ingresan datos de tarjeta en formularios de RopaNova)</Text>
                <Text style={styles.listItem}>• Transferencias bancarias (Banco Popular, Reservas, BHD León)</Text>
                <Text style={styles.listItem}>• Billetera digital RopaNova</Text>
              </View>
              <Text style={styles.paragraph}>
                <Text style={styles.bold}>Comisiones:</Text>
              </Text>
              <View style={styles.list}>
                <Text style={styles.listItem}>• 5% de comisión por venta exitosa</Text>
                <Text style={styles.listItem}>• Gastos de procesamiento de pago según el método elegido</Text>
              </View>
              <Text style={styles.paragraph}>
                Todos los precios se muestran en Pesos Dominicanos (DOP).
              </Text>
            </View>
          ))}

          {renderSection(5, 'Envíos y Entregas', (
            <View style={styles.textContent}>
              <Text style={styles.paragraph}>RopaNova facilita envíos a través de:</Text>
              <View style={styles.list}>
                <Text style={styles.listItem}>• Servicio de mensajería local en Santo Domingo y Santiago</Text>
                <Text style={styles.listItem}>• Empresas de paquetería nacional</Text>
                <Text style={styles.listItem}>• Entrega en persona (acordada entre las partes)</Text>
              </View>
              <Text style={styles.paragraph}>
                Los costos de envío son responsabilidad del comprador, salvo acuerdo contrario.
              </Text>
              <Text style={styles.paragraph}>
                Los tiempos de entrega varían según la ubicación y método de envío seleccionado.
              </Text>
            </View>
          ))}

          {renderSection(6, 'Política de Devoluciones', (
            <View style={styles.textContent}>
              <Text style={styles.paragraph}>Las devoluciones se aceptan en los siguientes casos:</Text>
              <View style={styles.list}>
                <Text style={styles.listItem}>• El producto no coincide con la descripción</Text>
                <Text style={styles.listItem}>• El artículo llega dañado durante el envío</Text>
                <Text style={styles.listItem}>• Se envió un producto incorrecto</Text>
              </View>
              <Text style={styles.paragraph}>
                <Text style={styles.bold}>Proceso de devolución:</Text>
              </Text>
              <View style={styles.list}>
                <Text style={styles.listItem}>• Reportar el problema dentro de 48 horas de recibido</Text>
                <Text style={styles.listItem}>• Proporcionar evidencia fotográfica del problema</Text>
                <Text style={styles.listItem}>• Devolver el producto en su estado original</Text>
              </View>
              <Text style={styles.paragraph}>
                Los gastos de devolución corren por cuenta del vendedor si el problema es su responsabilidad.
              </Text>
            </View>
          ))}

          {renderSection(7, 'Conducta del Usuario y Seguridad', (
            <View style={styles.textContent}>
              <Text style={styles.paragraph}>
                <Text style={styles.bold}>Está prohibido:</Text>
              </Text>
              <View style={styles.list}>
                <Text style={styles.listItem}>• Vender productos falsificados o ilegales</Text>
                <Text style={styles.listItem}>• Usar lenguaje ofensivo o discriminatorio</Text>
                <Text style={styles.listItem}>• Crear múltiples cuentas para evadir restricciones</Text>
                <Text style={styles.listItem}>• Realizar transacciones fuera de la plataforma</Text>
                <Text style={styles.listItem}>• Compartir información personal de otros usuarios</Text>
              </View>
              <Text style={styles.paragraph}>
                RopaNova se reserva el derecho de suspender o eliminar cuentas que violen estas normas.
              </Text>
            </View>
          ))}

          {renderSection(8, 'Propiedad Intelectual', (
            <View style={styles.textContent}>
              <Text style={styles.paragraph}>
                Todo el contenido de RopaNova (diseño, logotipos, textos, código) está protegido por derechos de
                autor.
              </Text>
              <Text style={styles.paragraph}>
                Los usuarios conservan los derechos sobre las fotos y descripciones de sus productos.
              </Text>
              <Text style={styles.paragraph}>
                Al publicar contenido, otorgas a RopaNova una licencia para usar, mostrar y promocionar dicho
                contenido en la plataforma.
              </Text>
            </View>
          ))}

          {renderSection(9, 'Limitación de Responsabilidad', (
            <View style={styles.textContent}>
              <Text style={styles.paragraph}>
                RopaNova actúa como intermediario entre compradores y vendedores.
              </Text>
              <Text style={styles.paragraph}>No somos responsables por:</Text>
              <View style={styles.list}>
                <Text style={styles.listItem}>• La calidad, autenticidad o legalidad de los productos</Text>
                <Text style={styles.listItem}>• El cumplimiento de las transacciones entre usuarios</Text>
                <Text style={styles.listItem}>• Daños o pérdidas durante el envío</Text>
                <Text style={styles.listItem}>• Disputas entre compradores y vendedores</Text>
              </View>
              <Text style={styles.paragraph}>
                Nuestra responsabilidad se limita al monto de las comisiones cobradas por la transacción específica.
              </Text>
            </View>
          ))}

          {renderSection(10, 'Modificaciones y Terminación', (
            <View style={styles.textContent}>
              <Text style={styles.paragraph}>
                RopaNova puede modificar estos términos en cualquier momento.
              </Text>
              <Text style={styles.paragraph}>
                Los cambios importantes se notificarán con 30 días de anticipación.
              </Text>
              <Text style={styles.paragraph}>
                Puedes cerrar tu cuenta en cualquier momento desde la configuración.
              </Text>
              <Text style={styles.paragraph}>
                Nos reservamos el derecho de suspender o terminar cuentas que violen estos términos.
              </Text>
            </View>
          ))}

          {renderSection(11, 'Ley Aplicable y Jurisdicción', (
            <View style={styles.textContent}>
              <Text style={styles.paragraph}>
                Estos términos se rigen por las leyes de República Dominicana.
              </Text>
              <Text style={styles.paragraph}>
                Cualquier disputa será resuelta en los tribunales competentes de Santo Domingo, Distrito Nacional.
              </Text>
              <Text style={styles.paragraph}>
                Para resolver conflictos, se priorizará la mediación antes de proceder a instancias legales.
              </Text>
            </View>
          ))}
        </View>

        {/* Contact Info */}
        <View style={styles.contactCard}>
          <Text style={styles.contactTitle}>¿Preguntas sobre estos términos?</Text>
          <Text style={styles.contactSubtitle}>
            Si tienes dudas sobre estos términos y condiciones, contáctanos:
          </Text>
          <View style={styles.contactInfo}>
            <View style={styles.contactItem}>
              <Text style={styles.contactLabel}>Email:</Text>
              <Text style={styles.contactValue}>legal@ropanova.com</Text>
            </View>
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>© 2025 RopaNova. Todos los derechos reservados.</Text>
          <Text style={styles.footerText}>Documento legal válido desde el 10 de enero de 2025</Text>
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
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginLeft: 12,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  infoCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  infoHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  infoContent: {
    flex: 1,
    marginLeft: 12,
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 8,
  },
  infoMeta: {
    gap: 8,
  },
  infoMetaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  infoMetaText: {
    fontSize: 14,
    color: '#6B7280',
  },
  importantNotice: {
    backgroundColor: '#EFF6FF',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: '#DBEAFE',
  },
  noticeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  noticeTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1E40AF',
    marginLeft: 6,
  },
  noticeText: {
    fontSize: 14,
    color: '#1E40AF',
    lineHeight: 20,
  },
  termsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginBottom: 16,
  },
  section: {
    padding: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionNumber: {
    backgroundColor: '#DBEAFE',
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginRight: 8,
  },
  sectionNumberText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#1E40AF',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  sectionContent: {
    gap: 12,
  },
  textContent: {
    gap: 12,
  },
  paragraph: {
    fontSize: 14,
    color: '#374151',
    lineHeight: 20,
  },
  bold: {
    fontWeight: '600',
  },
  list: {
    marginLeft: 16,
  },
  listItem: {
    fontSize: 14,
    color: '#374151',
    lineHeight: 20,
    marginBottom: 4,
  },
  contactCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  contactTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 8,
  },
  contactSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 12,
  },
  contactInfo: {
    gap: 8,
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  contactLabel: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
    marginRight: 8,
    minWidth: 80,
  },
  contactValue: {
    fontSize: 14,
    color: '#111827',
    flex: 1,
  },
  footer: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  footerText: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 4,
  },
  bottomSpacing: {
    height: 32,
  },
}); 