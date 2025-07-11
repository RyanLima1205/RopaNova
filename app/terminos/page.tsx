"use client"

import { ArrowLeft, FileText, Calendar, Shield, AlertCircle } from "lucide-react"
import Link from "next/link"

export default function TerminosPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="flex items-center gap-4 p-4">
          <Link href="/configuracion" className="p-2 hover:bg-gray-100 rounded-full">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <h1 className="text-lg font-semibold">Términos y Condiciones</h1>
        </div>
      </div>

      <div className="p-4 space-y-6">
        {/* Document Info Card */}
        <div className="bg-white rounded-lg p-4 border">
          <div className="flex items-start gap-3">
            <FileText className="h-6 w-6 text-blue-600 mt-1" />
            <div className="flex-1">
              <h2 className="font-semibold text-gray-900 mb-2">Términos y Condiciones de VintedRD</h2>
              <div className="flex items-center gap-4 text-sm text-gray-600 mb-3">
                <div className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  <span>Última actualización: 10 de enero, 2025</span>
                </div>
                <div className="flex items-center gap-1">
                  <Shield className="h-4 w-4" />
                  <span>Versión 2.1</span>
                </div>
              </div>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <div className="flex items-start gap-2">
                  <AlertCircle className="h-4 w-4 text-blue-600 mt-0.5" />
                  <div className="text-sm text-blue-800">
                    <p className="font-medium mb-1">Información Importante</p>
                    <p>
                      Al usar VintedRD, aceptas estos términos y condiciones. Te recomendamos leerlos completamente.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Terms Content */}
        <div className="bg-white rounded-lg border">
          <div className="p-6 space-y-8">
            {/* Section 1 */}
            <section>
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <span className="bg-blue-100 text-blue-800 text-sm font-medium px-2 py-1 rounded">1</span>
                Definiciones y Alcance
              </h3>
              <div className="space-y-3 text-gray-700 text-sm leading-relaxed">
                <p>
                  <strong>VintedRD</strong> es una plataforma digital que conecta compradores y vendedores de ropa y
                  accesorios de segunda mano en República Dominicana.
                </p>
                <p>
                  <strong>Usuario:</strong> Cualquier persona que accede y utiliza los servicios de VintedRD.
                </p>
                <p>
                  <strong>Vendedor:</strong> Usuario que ofrece productos para la venta en la plataforma.
                </p>
                <p>
                  <strong>Comprador:</strong> Usuario que adquiere productos a través de la plataforma.
                </p>
                <p>Estos términos se aplican a todos los usuarios de VintedRD en territorio dominicano.</p>
              </div>
            </section>

            {/* Section 2 */}
            <section>
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <span className="bg-blue-100 text-blue-800 text-sm font-medium px-2 py-1 rounded">2</span>
                Registro y Cuenta de Usuario
              </h3>
              <div className="space-y-3 text-gray-700 text-sm leading-relaxed">
                <p>Para usar VintedRD debes:</p>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>Ser mayor de 18 años o tener autorización de un tutor legal</li>
                  <li>Proporcionar información veraz y actualizada</li>
                  <li>Verificar tu identidad con cédula dominicana válida</li>
                  <li>Mantener la confidencialidad de tu contraseña</li>
                </ul>
                <p>Eres responsable de todas las actividades realizadas desde tu cuenta.</p>
              </div>
            </section>

            {/* Section 3 */}
            <section>
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <span className="bg-blue-100 text-blue-800 text-sm font-medium px-2 py-1 rounded">3</span>
                Compra y Venta de Productos
              </h3>
              <div className="space-y-3 text-gray-700 text-sm leading-relaxed">
                <p>
                  <strong>Vendedores deben:</strong>
                </p>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>Describir productos de manera precisa y honesta</li>
                  <li>Publicar fotos reales y actuales del producto</li>
                  <li>Especificar el estado y condición del artículo</li>
                  <li>Cumplir con los tiempos de envío acordados</li>
                </ul>
                <p>
                  <strong>Compradores deben:</strong>
                </p>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>Revisar cuidadosamente la descripción del producto</li>
                  <li>Comunicarse con el vendedor para aclarar dudas</li>
                  <li>Completar el pago según los métodos disponibles</li>
                </ul>
              </div>
            </section>

            {/* Section 4 */}
            <section>
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <span className="bg-blue-100 text-blue-800 text-sm font-medium px-2 py-1 rounded">4</span>
                Pagos y Comisiones
              </h3>
              <div className="space-y-3 text-gray-700 text-sm leading-relaxed">
                <p>VintedRD acepta los siguientes métodos de pago:</p>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>Tarjetas de crédito y débito (Visa, Mastercard)</li>
                  <li>Transferencias bancarias (Banco Popular, Reservas, BHD León)</li>
                  <li>Billetera digital VintedRD</li>
                </ul>
                <p>
                  <strong>Comisiones:</strong>
                </p>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>5% de comisión por venta exitosa</li>
                  <li>Gastos de procesamiento de pago según el método elegido</li>
                </ul>
                <p>Todos los precios se muestran en Pesos Dominicanos (DOP).</p>
              </div>
            </section>

            {/* Section 5 */}
            <section>
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <span className="bg-blue-100 text-blue-800 text-sm font-medium px-2 py-1 rounded">5</span>
                Envíos y Entregas
              </h3>
              <div className="space-y-3 text-gray-700 text-sm leading-relaxed">
                <p>VintedRD facilita envíos a través de:</p>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>Servicio de mensajería local en Santo Domingo y Santiago</li>
                  <li>Empresas de paquetería nacional</li>
                  <li>Entrega en persona (acordada entre las partes)</li>
                </ul>
                <p>Los costos de envío son responsabilidad del comprador, salvo acuerdo contrario.</p>
                <p>Los tiempos de entrega varían según la ubicación y método de envío seleccionado.</p>
              </div>
            </section>

            {/* Section 6 */}
            <section>
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <span className="bg-blue-100 text-blue-800 text-sm font-medium px-2 py-1 rounded">6</span>
                Política de Devoluciones
              </h3>
              <div className="space-y-3 text-gray-700 text-sm leading-relaxed">
                <p>Las devoluciones se aceptan en los siguientes casos:</p>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>El producto no coincide con la descripción</li>
                  <li>El artículo llega dañado durante el envío</li>
                  <li>Se envió un producto incorrecto</li>
                </ul>
                <p>
                  <strong>Proceso de devolución:</strong>
                </p>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>Reportar el problema dentro de 48 horas de recibido</li>
                  <li>Proporcionar evidencia fotográfica del problema</li>
                  <li>Devolver el producto en su estado original</li>
                </ul>
                <p>Los gastos de devolución corren por cuenta del vendedor si el problema es su responsabilidad.</p>
              </div>
            </section>

            {/* Section 7 */}
            <section>
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <span className="bg-blue-100 text-blue-800 text-sm font-medium px-2 py-1 rounded">7</span>
                Conducta del Usuario y Seguridad
              </h3>
              <div className="space-y-3 text-gray-700 text-sm leading-relaxed">
                <p>
                  <strong>Está prohibido:</strong>
                </p>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>Vender productos falsificados o ilegales</li>
                  <li>Usar lenguaje ofensivo o discriminatorio</li>
                  <li>Crear múltiples cuentas para evadir restricciones</li>
                  <li>Realizar transacciones fuera de la plataforma</li>
                  <li>Compartir información personal de otros usuarios</li>
                </ul>
                <p>VintedRD se reserva el derecho de suspender o eliminar cuentas que violen estas normas.</p>
              </div>
            </section>

            {/* Section 8 */}
            <section>
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <span className="bg-blue-100 text-blue-800 text-sm font-medium px-2 py-1 rounded">8</span>
                Propiedad Intelectual
              </h3>
              <div className="space-y-3 text-gray-700 text-sm leading-relaxed">
                <p>
                  Todo el contenido de VintedRD (diseño, logotipos, textos, código) está protegido por derechos de
                  autor.
                </p>
                <p>Los usuarios conservan los derechos sobre las fotos y descripciones de sus productos.</p>
                <p>
                  Al publicar contenido, otorgas a VintedRD una licencia para usar, mostrar y promocionar dicho
                  contenido en la plataforma.
                </p>
              </div>
            </section>

            {/* Section 9 */}
            <section>
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <span className="bg-blue-100 text-blue-800 text-sm font-medium px-2 py-1 rounded">9</span>
                Limitación de Responsabilidad
              </h3>
              <div className="space-y-3 text-gray-700 text-sm leading-relaxed">
                <p>VintedRD actúa como intermediario entre compradores y vendedores.</p>
                <p>No somos responsables por:</p>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>La calidad, autenticidad o legalidad de los productos</li>
                  <li>El cumplimiento de las transacciones entre usuarios</li>
                  <li>Daños o pérdidas durante el envío</li>
                  <li>Disputas entre compradores y vendedores</li>
                </ul>
                <p>
                  Nuestra responsabilidad se limita al monto de las comisiones cobradas por la transacción específica.
                </p>
              </div>
            </section>

            {/* Section 10 */}
            <section>
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <span className="bg-blue-100 text-blue-800 text-sm font-medium px-2 py-1 rounded">10</span>
                Modificaciones y Terminación
              </h3>
              <div className="space-y-3 text-gray-700 text-sm leading-relaxed">
                <p>VintedRD puede modificar estos términos en cualquier momento.</p>
                <p>Los cambios importantes se notificarán con 30 días de anticipación.</p>
                <p>Puedes cerrar tu cuenta en cualquier momento desde la configuración.</p>
                <p>Nos reservamos el derecho de suspender o terminar cuentas que violen estos términos.</p>
              </div>
            </section>

            {/* Section 11 */}
            <section>
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <span className="bg-blue-100 text-blue-800 text-sm font-medium px-2 py-1 rounded">11</span>
                Ley Aplicable y Jurisdicción
              </h3>
              <div className="space-y-3 text-gray-700 text-sm leading-relaxed">
                <p>Estos términos se rigen por las leyes de República Dominicana.</p>
                <p>
                  Cualquier disputa será resuelta en los tribunales competentes de Santo Domingo, Distrito Nacional.
                </p>
                <p>Para resolver conflictos, se priorizará la mediación antes de proceder a instancias legales.</p>
              </div>
            </section>
          </div>
        </div>

        {/* Contact Info */}
        <div className="bg-white rounded-lg p-4 border">
          <h3 className="font-semibold text-gray-900 mb-3">¿Preguntas sobre estos términos?</h3>
          <div className="space-y-2 text-sm text-gray-600">
            <p>Si tienes dudas sobre estos términos y condiciones, contáctanos:</p>
            <div className="space-y-1">
              <p>
                <strong>Email:</strong> legal@vintedrd.com
              </p>
              <p>
                <strong>Dirección:</strong> Av. Winston Churchill, Plaza Central, Santo Domingo
              </p>
              <p>
                <strong>RNC:</strong> 132-45678-9
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center text-xs text-gray-500 pb-8">
          <p>© 2025 VintedRD. Todos los derechos reservados.</p>
          <p>Documento legal válido desde el 10 de enero de 2025</p>
        </div>
      </div>
    </div>
  )
}
