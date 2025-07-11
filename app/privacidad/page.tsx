"use client"

import { ArrowLeft, Shield, Eye, Lock, Database, Users, Globe, AlertTriangle, CheckCircle } from "lucide-react"
import Link from "next/link"

export default function PrivacidadPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="flex items-center gap-4 p-4">
          <Link href="/configuracion" className="p-2 hover:bg-gray-100 rounded-full">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <h1 className="text-lg font-semibold">Política de Privacidad</h1>
        </div>
      </div>

      <div className="p-4 space-y-6">
        {/* Document Info Card */}
        <div className="bg-white rounded-lg p-4 border">
          <div className="flex items-start gap-3">
            <Shield className="h-6 w-6 text-green-600 mt-1" />
            <div className="flex-1">
              <h2 className="font-semibold text-gray-900 mb-2">Política de Privacidad de VintedRD</h2>
              <div className="flex items-center gap-4 text-sm text-gray-600 mb-3">
                <div className="flex items-center gap-1">
                  <Eye className="h-4 w-4" />
                  <span>Última actualización: 10 de enero, 2025</span>
                </div>
                <div className="flex items-center gap-1">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span>Cumple con GDPR</span>
                </div>
              </div>
              <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                <div className="flex items-start gap-2">
                  <Shield className="h-4 w-4 text-green-600 mt-0.5" />
                  <div className="text-sm text-green-800">
                    <p className="font-medium mb-1">Tu Privacidad es Nuestra Prioridad</p>
                    <p>
                      En VintedRD protegemos tu información personal y respetamos tu privacidad. Esta política explica
                      cómo recopilamos, usamos y protegemos tus datos.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Privacy Content */}
        <div className="bg-white rounded-lg border">
          <div className="p-6 space-y-8">
            {/* Section 1 */}
            <section>
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <span className="bg-green-100 text-green-800 text-sm font-medium px-2 py-1 rounded">1</span>
                Información que Recopilamos
              </h3>
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium text-gray-900 mb-2 flex items-center gap-2">
                    <Users className="h-4 w-4 text-blue-600" />
                    Información Personal
                  </h4>
                  <ul className="list-disc list-inside space-y-1 text-sm text-gray-700 ml-6">
                    <li>Nombre completo y fecha de nacimiento</li>
                    <li>Número de cédula de identidad dominicana</li>
                    <li>Dirección de correo electrónico</li>
                    <li>Número de teléfono móvil</li>
                    <li>Dirección física para envíos</li>
                    <li>Foto de perfil (opcional)</li>
                  </ul>
                </div>

                <div>
                  <h4 className="font-medium text-gray-900 mb-2 flex items-center gap-2">
                    <Database className="h-4 w-4 text-purple-600" />
                    Información de Transacciones
                  </h4>
                  <ul className="list-disc list-inside space-y-1 text-sm text-gray-700 ml-6">
                    <li>Historial de compras y ventas</li>
                    <li>Métodos de pago utilizados (sin datos completos de tarjetas)</li>
                    <li>Direcciones de envío y facturación</li>
                    <li>Comunicaciones con otros usuarios</li>
                    <li>Calificaciones y reseñas</li>
                  </ul>
                </div>

                <div>
                  <h4 className="font-medium text-gray-900 mb-2 flex items-center gap-2">
                    <Globe className="h-4 w-4 text-orange-600" />
                    Información Técnica
                  </h4>
                  <ul className="list-disc list-inside space-y-1 text-sm text-gray-700 ml-6">
                    <li>Dirección IP y ubicación aproximada</li>
                    <li>Tipo de dispositivo y sistema operativo</li>
                    <li>Navegador web utilizado</li>
                    <li>Páginas visitadas y tiempo de navegación</li>
                    <li>Cookies y tecnologías similares</li>
                  </ul>
                </div>
              </div>
            </section>

            {/* Section 2 */}
            <section>
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <span className="bg-green-100 text-green-800 text-sm font-medium px-2 py-1 rounded">2</span>
                Cómo Usamos tu Información
              </h3>
              <div className="space-y-3 text-gray-700 text-sm leading-relaxed">
                <p>
                  <strong>Para proporcionar nuestros servicios:</strong>
                </p>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>Crear y gestionar tu cuenta de usuario</li>
                  <li>Procesar transacciones de compra y venta</li>
                  <li>Facilitar comunicación entre usuarios</li>
                  <li>Verificar tu identidad para mayor seguridad</li>
                  <li>Proporcionar soporte al cliente</li>
                </ul>

                <p>
                  <strong>Para mejorar la experiencia:</strong>
                </p>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>Personalizar contenido y recomendaciones</li>
                  <li>Analizar patrones de uso para mejoras</li>
                  <li>Prevenir fraude y actividades sospechosas</li>
                  <li>Enviar notificaciones relevantes</li>
                </ul>

                <p>
                  <strong>Para cumplir obligaciones legales:</strong>
                </p>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>Verificación de identidad según leyes dominicanas</li>
                  <li>Reportes fiscales cuando sea requerido</li>
                  <li>Cooperación con autoridades competentes</li>
                </ul>
              </div>
            </section>

            {/* Section 3 */}
            <section>
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <span className="bg-green-100 text-green-800 text-sm font-medium px-2 py-1 rounded">3</span>
                Compartir Información con Terceros
              </h3>
              <div className="space-y-3 text-gray-700 text-sm leading-relaxed">
                <p>Compartimos tu información únicamente en las siguientes situaciones:</p>

                <p>
                  <strong>Con proveedores de servicios:</strong>
                </p>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>Procesadores de pago (para transacciones seguras)</li>
                  <li>Empresas de envío (para entregas)</li>
                  <li>Servicios de verificación de identidad</li>
                  <li>Proveedores de hosting y almacenamiento</li>
                </ul>

                <p>
                  <strong>Con otros usuarios (información limitada):</strong>
                </p>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>Nombre de usuario y foto de perfil</li>
                  <li>Calificaciones y reseñas públicas</li>
                  <li>Información necesaria para completar transacciones</li>
                </ul>

                <p>
                  <strong>Por requerimientos legales:</strong>
                </p>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>Órdenes judiciales o citaciones</li>
                  <li>Investigaciones de fraude o actividades ilegales</li>
                  <li>Protección de derechos y seguridad</li>
                </ul>

                <div className="bg-red-50 border border-red-200 rounded-lg p-3 mt-4">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="h-4 w-4 text-red-600 mt-0.5" />
                    <div className="text-sm text-red-800">
                      <p className="font-medium">Importante:</p>
                      <p>Nunca vendemos tu información personal a terceros con fines comerciales.</p>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* Section 4 */}
            <section>
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <span className="bg-green-100 text-green-800 text-sm font-medium px-2 py-1 rounded">4</span>
                Seguridad de los Datos
              </h3>
              <div className="space-y-3 text-gray-700 text-sm leading-relaxed">
                <p>Implementamos múltiples medidas de seguridad para proteger tu información:</p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                    <div className="flex items-center gap-2 mb-2">
                      <Lock className="h-4 w-4 text-blue-600" />
                      <span className="font-medium text-blue-800">Encriptación</span>
                    </div>
                    <p className="text-sm text-blue-700">
                      Todos los datos se transmiten usando encriptación SSL/TLS y se almacenan de forma segura.
                    </p>
                  </div>

                  <div className="bg-purple-50 border border-purple-200 rounded-lg p-3">
                    <div className="flex items-center gap-2 mb-2">
                      <Shield className="h-4 w-4 text-purple-600" />
                      <span className="font-medium text-purple-800">Acceso Limitado</span>
                    </div>
                    <p className="text-sm text-purple-700">
                      Solo personal autorizado tiene acceso a datos personales, bajo estrictos protocolos.
                    </p>
                  </div>

                  <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                    <div className="flex items-center gap-2 mb-2">
                      <Database className="h-4 w-4 text-green-600" />
                      <span className="font-medium text-green-800">Respaldos Seguros</span>
                    </div>
                    <p className="text-sm text-green-700">
                      Realizamos respaldos regulares en servidores seguros con acceso restringido.
                    </p>
                  </div>

                  <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
                    <div className="flex items-center gap-2 mb-2">
                      <Eye className="h-4 w-4 text-orange-600" />
                      <span className="font-medium text-orange-800">Monitoreo</span>
                    </div>
                    <p className="text-sm text-orange-700">
                      Monitoreamos constantemente actividades sospechosas y accesos no autorizados.
                    </p>
                  </div>
                </div>
              </div>
            </section>

            {/* Section 5 */}
            <section>
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <span className="bg-green-100 text-green-800 text-sm font-medium px-2 py-1 rounded">5</span>
                Tus Derechos de Privacidad
              </h3>
              <div className="space-y-3 text-gray-700 text-sm leading-relaxed">
                <p>Como usuario de VintedRD, tienes los siguientes derechos:</p>

                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center mt-0.5">
                      <span className="text-blue-600 text-xs font-bold">1</span>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">Derecho de Acceso</p>
                      <p className="text-sm text-gray-600">
                        Solicitar una copia de toda la información personal que tenemos sobre ti.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center mt-0.5">
                      <span className="text-blue-600 text-xs font-bold">2</span>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">Derecho de Rectificación</p>
                      <p className="text-sm text-gray-600">Corregir información personal inexacta o incompleta.</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center mt-0.5">
                      <span className="text-blue-600 text-xs font-bold">3</span>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">Derecho de Eliminación</p>
                      <p className="text-sm text-gray-600">
                        Solicitar la eliminación de tu información personal (sujeto a obligaciones legales).
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center mt-0.5">
                      <span className="text-blue-600 text-xs font-bold">4</span>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">Derecho de Portabilidad</p>
                      <p className="text-sm text-gray-600">Recibir tus datos en un formato estructurado y legible.</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center mt-0.5">
                      <span className="text-blue-600 text-xs font-bold">5</span>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">Derecho de Oposición</p>
                      <p className="text-sm text-gray-600">
                        Oponerte al procesamiento de tus datos para marketing directo.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mt-4">
                  <p className="text-sm text-blue-800">
                    <strong>Para ejercer estos derechos:</strong> Contáctanos en privacidad@vintedrd.com o desde la
                    configuración de tu cuenta.
                  </p>
                </div>
              </div>
            </section>

            {/* Section 6 */}
            <section>
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <span className="bg-green-100 text-green-800 text-sm font-medium px-2 py-1 rounded">6</span>
                Cookies y Tecnologías de Seguimiento
              </h3>
              <div className="space-y-3 text-gray-700 text-sm leading-relaxed">
                <p>Utilizamos cookies y tecnologías similares para:</p>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>Mantener tu sesión activa</li>
                  <li>Recordar tus preferencias</li>
                  <li>Analizar el uso de la plataforma</li>
                  <li>Personalizar tu experiencia</li>
                  <li>Mostrar anuncios relevantes</li>
                </ul>

                <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                  <h4 className="font-medium text-gray-900 mb-2">Tipos de Cookies:</h4>
                  <div className="space-y-2 text-sm">
                    <div>
                      <strong>Esenciales:</strong> Necesarias para el funcionamiento básico (no se pueden desactivar)
                    </div>
                    <div>
                      <strong>Funcionales:</strong> Mejoran la funcionalidad y personalización
                    </div>
                    <div>
                      <strong>Analíticas:</strong> Nos ayudan a entender cómo usas la plataforma
                    </div>
                    <div>
                      <strong>Publicitarias:</strong> Para mostrar anuncios relevantes
                    </div>
                  </div>
                </div>

                <p>
                  Puedes gestionar las cookies desde la configuración de tu navegador o desde nuestro centro de
                  preferencias.
                </p>
              </div>
            </section>

            {/* Section 7 */}
            <section>
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <span className="bg-green-100 text-green-800 text-sm font-medium px-2 py-1 rounded">7</span>
                Retención de Datos
              </h3>
              <div className="space-y-3 text-gray-700 text-sm leading-relaxed">
                <p>Conservamos tu información personal durante los siguientes períodos:</p>

                <div className="space-y-2">
                  <div className="flex justify-between items-center p-2 bg-gray-50 rounded">
                    <span>Información de cuenta activa</span>
                    <span className="font-medium">Mientras la cuenta esté activa</span>
                  </div>
                  <div className="flex justify-between items-center p-2 bg-gray-50 rounded">
                    <span>Historial de transacciones</span>
                    <span className="font-medium">7 años (requerimiento fiscal)</span>
                  </div>
                  <div className="flex justify-between items-center p-2 bg-gray-50 rounded">
                    <span>Comunicaciones de soporte</span>
                    <span className="font-medium">3 años</span>
                  </div>
                  <div className="flex justify-between items-center p-2 bg-gray-50 rounded">
                    <span>Datos de marketing</span>
                    <span className="font-medium">Hasta que retires el consentimiento</span>
                  </div>
                  <div className="flex justify-between items-center p-2 bg-gray-50 rounded">
                    <span>Logs de seguridad</span>
                    <span className="font-medium">1 año</span>
                  </div>
                </div>

                <p>Después de estos períodos, eliminamos o anonimizamos tu información de forma segura.</p>
              </div>
            </section>

            {/* Section 8 */}
            <section>
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <span className="bg-green-100 text-green-800 text-sm font-medium px-2 py-1 rounded">8</span>
                Transferencias Internacionales
              </h3>
              <div className="space-y-3 text-gray-700 text-sm leading-relaxed">
                <p>
                  Algunos de nuestros proveedores de servicios pueden estar ubicados fuera de República Dominicana.
                  Cuando transferimos datos internacionalmente:
                </p>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>Solo trabajamos con proveedores que cumplen estándares internacionales de protección</li>
                  <li>Implementamos salvaguardas contractuales apropiadas</li>
                  <li>Aseguramos que el nivel de protección sea equivalente al local</li>
                  <li>Cumplimos con regulaciones de transferencia de datos</li>
                </ul>
                <p>
                  Los principales destinos de transferencia incluyen Estados Unidos y la Unión Europea, bajo marcos de
                  protección reconocidos.
                </p>
              </div>
            </section>

            {/* Section 9 */}
            <section>
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <span className="bg-green-100 text-green-800 text-sm font-medium px-2 py-1 rounded">9</span>
                Privacidad de Menores
              </h3>
              <div className="space-y-3 text-gray-700 text-sm leading-relaxed">
                <p>VintedRD está diseñado para usuarios mayores de 18 años.</p>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>No recopilamos intencionalmente información de menores de 18 años</li>
                  <li>Requerimos verificación de edad durante el registro</li>
                  <li>Si descubrimos que hemos recopilado datos de un menor, los eliminaremos inmediatamente</li>
                  <li>Los padres pueden contactarnos si creen que su hijo ha proporcionado información</li>
                </ul>

                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="h-4 w-4 text-yellow-600 mt-0.5" />
                    <div className="text-sm text-yellow-800">
                      <p className="font-medium">Para Padres:</p>
                      <p>
                        Si crees que tu hijo menor de 18 años ha creado una cuenta, contáctanos inmediatamente en
                        privacidad@vintedrd.com
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* Section 10 */}
            <section>
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <span className="bg-green-100 text-green-800 text-sm font-medium px-2 py-1 rounded">10</span>
                Cambios a esta Política
              </h3>
              <div className="space-y-3 text-gray-700 text-sm leading-relaxed">
                <p>Podemos actualizar esta política de privacidad ocasionalmente para:</p>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>Reflejar cambios en nuestros servicios</li>
                  <li>Cumplir con nuevas regulaciones</li>
                  <li>Mejorar la claridad y transparencia</li>
                  <li>Incorporar nuevas funcionalidades</li>
                </ul>

                <p>
                  <strong>Cuando hagamos cambios importantes:</strong>
                </p>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>Te notificaremos por email con 30 días de anticipación</li>
                  <li>Mostraremos un aviso prominente en la aplicación</li>
                  <li>Actualizaremos la fecha de "última modificación"</li>
                  <li>Mantendremos versiones anteriores disponibles para consulta</li>
                </ul>

                <p>El uso continuado de VintedRD después de los cambios constituye aceptación de la nueva política.</p>
              </div>
            </section>
          </div>
        </div>

        {/* Contact Info */}
        <div className="bg-white rounded-lg p-4 border">
          <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <Shield className="h-5 w-5 text-green-600" />
            Contacto para Privacidad
          </h3>
          <div className="space-y-3 text-sm text-gray-600">
            <p>Si tienes preguntas sobre esta política de privacidad o el manejo de tus datos:</p>
            <div className="bg-gray-50 rounded-lg p-3 space-y-2">
              <div className="flex items-center gap-2">
                <span className="font-medium">Email:</span>
                <span>privacidad@vintedrd.com</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-medium">Oficial de Protección de Datos:</span>
                <span>dpo@vintedrd.com</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="font-medium">Dirección:</span>
                <span>
                  Av. Winston Churchill #25, Piantini
                  <br />
                  Santo Domingo, República Dominicana
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-medium">Teléfono:</span>
                <span>+1 (809) 555-0123</span>
              </div>
            </div>
            <p className="text-xs text-gray-500">
              Responderemos a todas las consultas de privacidad dentro de 30 días hábiles.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center text-xs text-gray-500 pb-8">
          <p>© 2025 VintedRD. Todos los derechos reservados.</p>
          <p>Política de privacidad válida desde el 10 de enero de 2025</p>
        </div>
      </div>
    </div>
  )
}
