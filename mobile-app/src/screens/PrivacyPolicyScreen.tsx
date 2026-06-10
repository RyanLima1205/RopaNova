import React from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
  SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../../App';

type PrivacyPolicyScreenNavigationProp = StackNavigationProp<RootStackParamList, 'PrivacyPolicy'>;

interface PrivacyPolicyScreenProps {
  navigation: PrivacyPolicyScreenNavigationProp;
}

export const PrivacyPolicyScreen: React.FC<PrivacyPolicyScreenProps> = ({ navigation }) => {
  const handleBack = () => {
    navigation.goBack();
  };

  const handleContactPrivacy = () => {
    Alert.alert(
      'Contacto de Privacidad',
      'Email: privacidad@ropanova.com\nOficial de Protección de Datos: dpo@ropanova.com\nTeléfono: +1 (809) 555-0123',
      [{ text: 'OK' }]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#374151" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Política de Privacidad</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Document Info Card */}
        <View style={styles.card}>
          <View style={styles.documentInfo}>
            <Ionicons name="shield-checkmark" size={24} color="#059669" style={styles.documentIcon} />
            <View style={styles.documentContent}>
              <Text style={styles.documentTitle}>Política de Privacidad de RopaNova</Text>
              <View style={styles.documentMeta}>
                <View style={styles.metaItem}>
                  <Ionicons name="eye" size={16} color="#6B7280" />
                  <Text style={styles.metaText}>Última actualización: 10 de enero, 2025</Text>
                </View>
                <View style={styles.metaItem}>
                  <Ionicons name="checkmark-circle" size={16} color="#059669" />
                  <Text style={styles.metaText}>Cumple con GDPR</Text>
                </View>
              </View>
              <View style={styles.privacyNotice}>
                <Ionicons name="shield-checkmark" size={16} color="#059669" />
                <View style={styles.noticeContent}>
                  <Text style={styles.noticeTitle}>Tu Privacidad es Nuestra Prioridad</Text>
                  <Text style={styles.noticeText}>
                    En RopaNova protegemos tu información personal y respetamos tu privacidad. Esta política explica
                    cómo recopilamos, usamos y protegemos tus datos.
                  </Text>
                </View>
              </View>
            </View>
          </View>
        </View>

        {/* Privacy Content */}
        <View style={styles.contentCard}>
          {/* Section 1 */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionNumber}>
                <Text style={styles.sectionNumberText}>1</Text>
              </View>
              <Text style={styles.sectionTitle}>Información que Recopilamos</Text>
            </View>
            
            <View style={styles.subsection}>
              <View style={styles.subsectionHeader}>
                <Ionicons name="people" size={16} color="#2563EB" />
                <Text style={styles.subsectionTitle}>Información Personal</Text>
              </View>
              <View style={styles.listContainer}>
                <Text style={styles.listItem}>• Nombre completo y fecha de nacimiento</Text>
                <Text style={styles.listItem}>• Número de cédula de identidad dominicana</Text>
                <Text style={styles.listItem}>• Dirección de correo electrónico</Text>
                <Text style={styles.listItem}>• Número de teléfono móvil</Text>
                <Text style={styles.listItem}>• Dirección física para envíos</Text>
                <Text style={styles.listItem}>• Foto de perfil (opcional)</Text>
              </View>
            </View>

            <View style={styles.subsection}>
              <View style={styles.subsectionHeader}>
                <Ionicons name="card" size={16} color="#7C3AED" />
                <Text style={styles.subsectionTitle}>Información de Transacciones</Text>
              </View>
              <View style={styles.listContainer}>
                <Text style={styles.listItem}>• Historial de compras y ventas</Text>
                <Text style={styles.listItem}>• Métodos de pago utilizados (sin datos completos de tarjetas)</Text>
                <Text style={styles.listItem}>• Direcciones de envío y facturación</Text>
                <Text style={styles.listItem}>• Comunicaciones con otros usuarios</Text>
                <Text style={styles.listItem}>• Calificaciones y reseñas</Text>
              </View>
            </View>

            <View style={styles.subsection}>
              <View style={styles.subsectionHeader}>
                <Ionicons name="globe" size={16} color="#EA580C" />
                <Text style={styles.subsectionTitle}>Información Técnica</Text>
              </View>
              <View style={styles.listContainer}>
                <Text style={styles.listItem}>• Dirección IP y ubicación aproximada</Text>
                <Text style={styles.listItem}>• Tipo de dispositivo y sistema operativo</Text>
                <Text style={styles.listItem}>• Navegador web utilizado</Text>
                <Text style={styles.listItem}>• Páginas visitadas y tiempo de navegación</Text>
                <Text style={styles.listItem}>• Cookies y tecnologías similares</Text>
              </View>
            </View>
          </View>

          {/* Section 2 */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionNumber}>
                <Text style={styles.sectionNumberText}>2</Text>
              </View>
              <Text style={styles.sectionTitle}>Cómo Usamos tu Información</Text>
            </View>
            
            <Text style={styles.paragraph}>
              <Text style={styles.boldText}>Para proporcionar nuestros servicios:</Text>
            </Text>
            <View style={styles.listContainer}>
              <Text style={styles.listItem}>• Crear y gestionar tu cuenta de usuario</Text>
              <Text style={styles.listItem}>• Procesar transacciones de compra y venta</Text>
              <Text style={styles.listItem}>• Facilitar comunicación entre usuarios</Text>
              <Text style={styles.listItem}>• Verificar tu identidad para mayor seguridad</Text>
              <Text style={styles.listItem}>• Proporcionar soporte al cliente</Text>
            </View>

            <Text style={styles.paragraph}>
              <Text style={styles.boldText}>Para mejorar la experiencia:</Text>
            </Text>
            <View style={styles.listContainer}>
              <Text style={styles.listItem}>• Personalizar contenido y recomendaciones</Text>
              <Text style={styles.listItem}>• Analizar patrones de uso para mejoras</Text>
              <Text style={styles.listItem}>• Prevenir fraude y actividades sospechosas</Text>
              <Text style={styles.listItem}>• Enviar notificaciones relevantes</Text>
            </View>

            <Text style={styles.paragraph}>
              <Text style={styles.boldText}>Para cumplir obligaciones legales:</Text>
            </Text>
            <View style={styles.listContainer}>
              <Text style={styles.listItem}>• Verificación de identidad según leyes dominicanas</Text>
              <Text style={styles.listItem}>• Reportes fiscales cuando sea requerido</Text>
              <Text style={styles.listItem}>• Cooperación con autoridades competentes</Text>
            </View>
          </View>

          {/* Section 3 */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionNumber}>
                <Text style={styles.sectionNumberText}>3</Text>
              </View>
              <Text style={styles.sectionTitle}>Compartir Información con Terceros</Text>
            </View>
            
            <Text style={styles.paragraph}>
              Compartimos tu información únicamente en las siguientes situaciones:
            </Text>

            <Text style={styles.paragraph}>
              <Text style={styles.boldText}>Con proveedores de servicios:</Text>
            </Text>
            <View style={styles.listContainer}>
              <Text style={styles.listItem}>• Procesadores de pago (para transacciones seguras)</Text>
              <Text style={styles.listItem}>• Empresas de envío (para entregas)</Text>
              <Text style={styles.listItem}>• Servicios de verificación de identidad</Text>
              <Text style={styles.listItem}>• Proveedores de hosting y almacenamiento</Text>
            </View>

            <Text style={styles.paragraph}>
              <Text style={styles.boldText}>Con otros usuarios (información limitada):</Text>
            </Text>
            <View style={styles.listContainer}>
              <Text style={styles.listItem}>• Nombre de usuario y foto de perfil</Text>
              <Text style={styles.listItem}>• Calificaciones y reseñas públicas</Text>
              <Text style={styles.listItem}>• Información necesaria para completar transacciones</Text>
            </View>

            <Text style={styles.paragraph}>
              <Text style={styles.boldText}>Por requerimientos legales:</Text>
            </Text>
            <View style={styles.listContainer}>
              <Text style={styles.listItem}>• Órdenes judiciales o citaciones</Text>
              <Text style={styles.listItem}>• Investigaciones de fraude o actividades ilegales</Text>
              <Text style={styles.listItem}>• Protección de derechos y seguridad</Text>
            </View>

            <View style={styles.warningBox}>
              <Ionicons name="warning" size={16} color="#DC2626" />
              <View style={styles.warningContent}>
                <Text style={styles.warningTitle}>Importante:</Text>
                <Text style={styles.warningText}>
                  Nunca vendemos tu información personal a terceros con fines comerciales.
                </Text>
              </View>
            </View>
          </View>

          {/* Section 4 */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionNumber}>
                <Text style={styles.sectionNumberText}>4</Text>
              </View>
              <Text style={styles.sectionTitle}>Seguridad de los Datos</Text>
            </View>
            
            <Text style={styles.paragraph}>
              Implementamos múltiples medidas de seguridad para proteger tu información:
            </Text>

            <View style={styles.securityGrid}>
              <View style={styles.securityCard}>
                <View style={styles.securityHeader}>
                  <Ionicons name="lock-closed" size={16} color="#2563EB" />
                  <Text style={styles.securityTitle}>Encriptación</Text>
                </View>
                <Text style={styles.securityText}>
                  Todos los datos se transmiten usando encriptación SSL/TLS y se almacenan de forma segura.
                </Text>
              </View>

              <View style={styles.securityCard}>
                <View style={styles.securityHeader}>
                  <Ionicons name="shield-checkmark" size={16} color="#7C3AED" />
                  <Text style={styles.securityTitle}>Acceso Limitado</Text>
                </View>
                <Text style={styles.securityText}>
                  Solo personal autorizado tiene acceso a datos personales, bajo estrictos protocolos.
                </Text>
              </View>

              <View style={styles.securityCard}>
                <View style={styles.securityHeader}>
                  <Ionicons name="server" size={16} color="#059669" />
                  <Text style={styles.securityTitle}>Respaldos Seguros</Text>
                </View>
                <Text style={styles.securityText}>
                  Realizamos respaldos regulares en servidores seguros con acceso restringido.
                </Text>
              </View>

              <View style={styles.securityCard}>
                <View style={styles.securityHeader}>
                  <Ionicons name="eye" size={16} color="#EA580C" />
                  <Text style={styles.securityTitle}>Monitoreo</Text>
                </View>
                <Text style={styles.securityText}>
                  Monitoreamos constantemente actividades sospechosas y accesos no autorizados.
                </Text>
              </View>
            </View>
          </View>

          {/* Section 5 */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionNumber}>
                <Text style={styles.sectionNumberText}>5</Text>
              </View>
              <Text style={styles.sectionTitle}>Tus Derechos de Privacidad</Text>
            </View>
            
            <Text style={styles.paragraph}>
              Como usuario de RopaNova, tienes los siguientes derechos:
            </Text>

            <View style={styles.rightsList}>
              <View style={styles.rightItem}>
                <View style={styles.rightNumber}>
                  <Text style={styles.rightNumberText}>1</Text>
                </View>
                <View style={styles.rightContent}>
                  <Text style={styles.rightTitle}>Derecho de Acceso</Text>
                  <Text style={styles.rightDescription}>
                    Solicitar una copia de toda la información personal que tenemos sobre ti.
                  </Text>
                </View>
              </View>

              <View style={styles.rightItem}>
                <View style={styles.rightNumber}>
                  <Text style={styles.rightNumberText}>2</Text>
                </View>
                <View style={styles.rightContent}>
                  <Text style={styles.rightTitle}>Derecho de Rectificación</Text>
                  <Text style={styles.rightDescription}>
                    Corregir información personal inexacta o incompleta.
                  </Text>
                </View>
              </View>

              <View style={styles.rightItem}>
                <View style={styles.rightNumber}>
                  <Text style={styles.rightNumberText}>3</Text>
                </View>
                <View style={styles.rightContent}>
                  <Text style={styles.rightTitle}>Derecho de Eliminación</Text>
                  <Text style={styles.rightDescription}>
                    Solicitar la eliminación de tu información personal (sujeto a obligaciones legales).
                  </Text>
                </View>
              </View>

              <View style={styles.rightItem}>
                <View style={styles.rightNumber}>
                  <Text style={styles.rightNumberText}>4</Text>
                </View>
                <View style={styles.rightContent}>
                  <Text style={styles.rightTitle}>Derecho de Portabilidad</Text>
                  <Text style={styles.rightDescription}>
                    Recibir tus datos en un formato estructurado y legible.
                  </Text>
                </View>
              </View>

              <View style={styles.rightItem}>
                <View style={styles.rightNumber}>
                  <Text style={styles.rightNumberText}>5</Text>
                </View>
                <View style={styles.rightContent}>
                  <Text style={styles.rightTitle}>Derecho de Oposición</Text>
                  <Text style={styles.rightDescription}>
                    Oponerte al procesamiento de tus datos para marketing directo.
                  </Text>
                </View>
              </View>
            </View>

            <View style={styles.infoBox}>
              <Text style={styles.infoText}>
                <Text style={styles.boldText}>Para ejercer estos derechos:</Text> Contáctanos en privacidad@ropanova.com o desde la
                configuración de tu cuenta.
              </Text>
            </View>
          </View>

          {/* Section 6 */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionNumber}>
                <Text style={styles.sectionNumberText}>6</Text>
              </View>
              <Text style={styles.sectionTitle}>Cookies y Tecnologías de Seguimiento</Text>
            </View>
            
            <Text style={styles.paragraph}>
              Utilizamos cookies y tecnologías similares para:
            </Text>
            <View style={styles.listContainer}>
              <Text style={styles.listItem}>• Mantener tu sesión activa</Text>
              <Text style={styles.listItem}>• Recordar tus preferencias</Text>
              <Text style={styles.listItem}>• Analizar el uso de la plataforma</Text>
              <Text style={styles.listItem}>• Personalizar tu experiencia</Text>
              <Text style={styles.listItem}>• Mostrar anuncios relevantes</Text>
            </View>

            <View style={styles.cookiesBox}>
              <Text style={styles.cookiesTitle}>Tipos de Cookies:</Text>
              <View style={styles.cookiesList}>
                <Text style={styles.cookiesItem}>
                  <Text style={styles.boldText}>Esenciales:</Text> Necesarias para el funcionamiento básico (no se pueden desactivar)
                </Text>
                <Text style={styles.cookiesItem}>
                  <Text style={styles.boldText}>Funcionales:</Text> Mejoran la funcionalidad y personalización
                </Text>
                <Text style={styles.cookiesItem}>
                  <Text style={styles.boldText}>Analíticas:</Text> Nos ayudan a entender cómo usas la plataforma
                </Text>
                <Text style={styles.cookiesItem}>
                  <Text style={styles.boldText}>Publicitarias:</Text> Para mostrar anuncios relevantes
                </Text>
              </View>
            </View>

            <Text style={styles.paragraph}>
              Puedes gestionar las cookies desde la configuración de tu navegador o desde nuestro centro de
              preferencias.
            </Text>
          </View>

          {/* Section 7 */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionNumber}>
                <Text style={styles.sectionNumberText}>7</Text>
              </View>
              <Text style={styles.sectionTitle}>Retención de Datos</Text>
            </View>
            
            <Text style={styles.paragraph}>
              Conservamos tu información personal durante los siguientes períodos:
            </Text>

            <View style={styles.retentionList}>
              <View style={styles.retentionItem}>
                <Text style={styles.retentionLabel}>Información de cuenta activa</Text>
                <Text style={styles.retentionValue}>Mientras la cuenta esté activa</Text>
              </View>
              <View style={styles.retentionItem}>
                <Text style={styles.retentionLabel}>Historial de transacciones</Text>
                <Text style={styles.retentionValue}>7 años (requerimiento fiscal)</Text>
              </View>
              <View style={styles.retentionItem}>
                <Text style={styles.retentionLabel}>Comunicaciones de soporte</Text>
                <Text style={styles.retentionValue}>3 años</Text>
              </View>
              <View style={styles.retentionItem}>
                <Text style={styles.retentionLabel}>Datos de marketing</Text>
                <Text style={styles.retentionValue}>Hasta que retires el consentimiento</Text>
              </View>
              <View style={styles.retentionItem}>
                <Text style={styles.retentionLabel}>Logs de seguridad</Text>
                <Text style={styles.retentionValue}>1 año</Text>
              </View>
            </View>

            <Text style={styles.paragraph}>
              Después de estos períodos, eliminamos o anonimizamos tu información de forma segura.
            </Text>
          </View>

          {/* Section 8 */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionNumber}>
                <Text style={styles.sectionNumberText}>8</Text>
              </View>
              <Text style={styles.sectionTitle}>Transferencias Internacionales</Text>
            </View>
            
            <Text style={styles.paragraph}>
              Algunos de nuestros proveedores de servicios pueden estar ubicados fuera de República Dominicana.
              Cuando transferimos datos internacionalmente:
            </Text>
            <View style={styles.listContainer}>
              <Text style={styles.listItem}>• Solo trabajamos con proveedores que cumplen estándares internacionales de protección</Text>
              <Text style={styles.listItem}>• Implementamos salvaguardas contractuales apropiadas</Text>
              <Text style={styles.listItem}>• Aseguramos que el nivel de protección sea equivalente al local</Text>
              <Text style={styles.listItem}>• Cumplimos con regulaciones de transferencia de datos</Text>
            </View>
            <Text style={styles.paragraph}>
              Los principales destinos de transferencia incluyen Estados Unidos y la Unión Europea, bajo marcos de
              protección reconocidos.
            </Text>
          </View>

          {/* Section 9 */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionNumber}>
                <Text style={styles.sectionNumberText}>9</Text>
              </View>
              <Text style={styles.sectionTitle}>Privacidad de Menores</Text>
            </View>
            
            <Text style={styles.paragraph}>
              RopaNova está diseñado para usuarios mayores de 18 años.
            </Text>
            <View style={styles.listContainer}>
              <Text style={styles.listItem}>• No recopilamos intencionalmente información de menores de 18 años</Text>
              <Text style={styles.listItem}>• Requerimos verificación de edad durante el registro</Text>
              <Text style={styles.listItem}>• Si descubrimos que hemos recopilado datos de un menor, los eliminaremos inmediatamente</Text>
              <Text style={styles.listItem}>• Los padres pueden contactarnos si creen que su hijo ha proporcionado información</Text>
            </View>

            <View style={styles.warningBox}>
              <Ionicons name="warning" size={16} color="#CA8A04" />
              <View style={styles.warningContent}>
                <Text style={styles.warningTitle}>Para Padres:</Text>
                <Text style={styles.warningText}>
                  Si crees que tu hijo menor de 18 años ha creado una cuenta, contáctanos inmediatamente en
                  privacidad@ropanova.com
                </Text>
              </View>
            </View>
          </View>

          {/* Section 10 */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionNumber}>
                <Text style={styles.sectionNumberText}>10</Text>
              </View>
              <Text style={styles.sectionTitle}>Cambios a esta Política</Text>
            </View>
            
            <Text style={styles.paragraph}>
              Podemos actualizar esta política de privacidad ocasionalmente para:
            </Text>
            <View style={styles.listContainer}>
              <Text style={styles.listItem}>• Reflejar cambios en nuestros servicios</Text>
              <Text style={styles.listItem}>• Cumplir con nuevas regulaciones</Text>
              <Text style={styles.listItem}>• Mejorar la claridad y transparencia</Text>
              <Text style={styles.listItem}>• Incorporar nuevas funcionalidades</Text>
            </View>

            <Text style={styles.paragraph}>
              <Text style={styles.boldText}>Cuando hagamos cambios importantes:</Text>
            </Text>
            <View style={styles.listContainer}>
              <Text style={styles.listItem}>• Te notificaremos por email con 30 días de anticipación</Text>
              <Text style={styles.listItem}>• Mostraremos un aviso prominente en la aplicación</Text>
              <Text style={styles.listItem}>• Actualizaremos la fecha de &quot;última modificación&quot;</Text>
              <Text style={styles.listItem}>• Mantendremos versiones anteriores disponibles para consulta</Text>
            </View>

            <Text style={styles.paragraph}>
              El uso continuado de RopaNova después de los cambios constituye aceptación de la nueva política.
            </Text>
          </View>
        </View>

        {/* Contact Info */}
        <View style={styles.card}>
          <View style={styles.contactHeader}>
            <Ionicons name="shield-checkmark" size={20} color="#059669" />
            <Text style={styles.contactTitle}>Contacto para Privacidad</Text>
          </View>
          <Text style={styles.contactText}>
            Si tienes preguntas sobre esta política de privacidad o el manejo de tus datos:
          </Text>
          <View style={styles.contactInfo}>
            <View style={styles.contactItem}>
              <Text style={styles.contactLabel}>Email:</Text>
              <Text style={styles.contactValue}>privacidad@ropanova.com</Text>
            </View>
            <View style={styles.contactItem}>
              <Text style={styles.contactLabel}>Oficial de Protección de Datos:</Text>
              <Text style={styles.contactValue}>dpo@ropanova.com</Text>
            </View>
            <View style={styles.contactItem}>
              <Text style={styles.contactLabel}>Dirección:</Text>
              <Text style={styles.contactValue}>
                Av. Winston Churchill #25, Piantini{'\n'}
                Santo Domingo, República Dominicana
              </Text>
            </View>
            <View style={styles.contactItem}>
              <Text style={styles.contactLabel}>Teléfono:</Text>
              <Text style={styles.contactValue}>+1 (809) 555-0123</Text>
            </View>
          </View>
          <Text style={styles.contactNote}>
            Responderemos a todas las consultas de privacidad dentro de 30 días hábiles.
          </Text>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>© 2025 RopaNova. Todos los derechos reservados.</Text>
          <Text style={styles.footerText}>Política de privacidad válida desde el 10 de enero de 2025</Text>
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
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 16,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  placeholder: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    margin: 16,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  documentInfo: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  documentIcon: {
    marginTop: 4,
    marginRight: 12,
  },
  documentContent: {
    flex: 1,
  },
  documentTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 8,
  },
  documentMeta: {
    marginBottom: 12,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  metaText: {
    fontSize: 14,
    color: '#6B7280',
    marginLeft: 4,
  },
  privacyNotice: {
    flexDirection: 'row',
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#A7F3D0',
    borderRadius: 8,
    padding: 12,
  },
  noticeContent: {
    flex: 1,
    marginLeft: 8,
  },
  noticeTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#065F46',
    marginBottom: 4,
  },
  noticeText: {
    fontSize: 13,
    color: '#065F46',
    lineHeight: 18,
  },
  contentCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    margin: 16,
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
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
    backgroundColor: '#D1FAE5',
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginRight: 12,
  },
  sectionNumberText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#065F46',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    flex: 1,
  },
  subsection: {
    marginBottom: 20,
  },
  subsectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  subsectionTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#111827',
    marginLeft: 8,
  },
  listContainer: {
    marginLeft: 24,
  },
  listItem: {
    fontSize: 14,
    color: '#374151',
    lineHeight: 20,
    marginBottom: 4,
  },
  paragraph: {
    fontSize: 14,
    color: '#374151',
    lineHeight: 20,
    marginBottom: 12,
  },
  boldText: {
    fontWeight: '600',
  },
  warningBox: {
    flexDirection: 'row',
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: 8,
    padding: 12,
    marginTop: 16,
  },
  warningContent: {
    flex: 1,
    marginLeft: 8,
  },
  warningTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#991B1B',
    marginBottom: 4,
  },
  warningText: {
    fontSize: 13,
    color: '#991B1B',
    lineHeight: 18,
  },
  securityGrid: {
    marginTop: 16,
  },
  securityCard: {
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  securityHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  securityTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1E40AF',
    marginLeft: 8,
  },
  securityText: {
    fontSize: 13,
    color: '#1E40AF',
    lineHeight: 18,
  },
  rightsList: {
    marginTop: 16,
  },
  rightItem: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  rightNumber: {
    width: 24,
    height: 24,
    backgroundColor: '#DBEAFE',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    marginTop: 2,
  },
  rightNumberText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#2563EB',
  },
  rightContent: {
    flex: 1,
  },
  rightTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#111827',
    marginBottom: 4,
  },
  rightDescription: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
  },
  infoBox: {
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
    borderRadius: 8,
    padding: 12,
    marginTop: 16,
  },
  infoText: {
    fontSize: 14,
    color: '#1E40AF',
    lineHeight: 20,
  },
  cookiesBox: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    padding: 12,
    marginTop: 16,
  },
  cookiesTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#111827',
    marginBottom: 8,
  },
  cookiesList: {
    gap: 8,
  },
  cookiesItem: {
    fontSize: 14,
    color: '#374151',
    lineHeight: 20,
  },
  retentionList: {
    marginTop: 16,
  },
  retentionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    padding: 8,
    borderRadius: 6,
    marginBottom: 8,
  },
  retentionLabel: {
    fontSize: 14,
    color: '#374151',
    flex: 1,
  },
  retentionValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#111827',
  },
  contactHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  contactTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginLeft: 8,
  },
  contactText: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 12,
  },
  contactInfo: {
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  contactItem: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  contactLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    width: 120,
  },
  contactValue: {
    fontSize: 14,
    color: '#374151',
    flex: 1,
  },
  contactNote: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  footer: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  footerText: {
    fontSize: 12,
    color: '#9CA3AF',
    textAlign: 'center',
    marginBottom: 4,
  },
  bottomSpacing: {
    height: 20,
  },
}); 